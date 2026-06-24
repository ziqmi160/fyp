# NLP Supervisor Matching — Technical Implementation Report

This document describes the complete pipeline behind the "AI-based supervisor matching" feature of the FYP Management System: how lecturer expertise data was collected, how it was cleaned and categorised, the embedding/similarity model used, the scoring algorithm, and how the result is exposed through the API and rendered in the frontend.

The feature lets a **student** write a free-text project description, and the system recommends the **top 3 supervisors** from the Faculty of Computer and Mathematical Sciences (FSKM) whose research expertise is most semantically related to that description.

---

## 1. Pipeline at a Glance

```
[1] Data Collection         Selenium scrapes UiTM Expert Portal profiles for FSKM lecturers
        |
[2] Data Cleaning           Regex parsing of profile HTML -> raw "Area of Expertise" strings
        |
[3] Taxonomy Design         Frequency analysis of scraped phrases -> 10 fixed expertise categories
        |
[4] Manual Mapping          Each lecturer's raw expertise manually mapped to 1-4 categories
        |
[5] Seed Data               Hardcoded {name, expertise[]} records loaded into MySQL via Sequelize seeder
        |
[6] Runtime Input           Student writes free-text project description (+ title) in the UI
        |
[7] Embedding               Both category descriptions and student query encoded with
                            Xenova/transformers (all-MiniLM-L6-v2), mean-pooled, L2-normalised
        |
[8] Similarity Scoring      Hybrid score = 0.55 x category_score + 0.45 x direct_score (cosine)
        |
[9] Ranking                 Sort supervisors by match_score, take top 3, apply UI floor (0.20)
        |
[10] API Exposure           GET /api/supervisors/recommendations
        |
[11] Frontend Display       SupervisorMarketplace.jsx renders ranked cards with match badges
```

---

## 2. Data Collection — Web Scraping (`/Users/haziqhilmi/Documents/fyp/script/`)

The expertise data is **not synthetic** — it was scraped from UiTM's official "Expert" portal (`https://expert.uitm.edu.my/V2/search.php`), which publishes each lecturer's self-declared research expertise fields. This is a separate, standalone Python toolset, outside the main Node.js application, used once (offline) to produce the seed data.

### 2.1 Final scraper used: `selenium-scrapper.py`

This is the script that actually produced the data used downstream (its lecturer list matches the seeder exactly).

**Why Selenium:** the Expert portal's search results and profile detail panel are populated via JavaScript/AJAX after page load, and several fields are CSS-hidden until a tab is activated — a plain HTTP `requests` call (as attempted in the earlier `scrapper.py`/`expertise.py` scripts) cannot see this content because it never executes the page's JS. Selenium drives a real Chrome instance (via `webdriver_manager.ChromeDriverManager`) so the DOM is fully rendered before scraping.

**Input — hardcoded lecturer roster** (lines 14-36): a Python list `LECTURERS` of 40 full names of FSKM academic staff (e.g. `"AZLAN BIN ISMAIL"`, `"NORAINI BINTI SEMAN"`, ... `"ISMADI BIN MD BADARUDIN"`), collected manually from the faculty staff directory.

**Per-lecturer scrape loop:**
1. Navigate to the search page, wait until the `#searchWord` input is clickable (`WebDriverWait` + `EC.element_to_be_clickable`).
2. Clear the box (select-all + backspace, since `.clear()` was unreliable on this site) and type the lecturer's name, then press Enter.
3. Wait ~3s for the AJAX results table to populate, then read result rows via `#listSearch tr td a`.
4. If no rows, record `"Area of Expertise": "Not Found"` and move to the next lecturer.
5. Otherwise, open the first matching profile link in a new tab (`window.open` + `switch_to.window`).
6. Wait for the `#viewDetPrDet` detail container to appear, then pull its **`innerHTML` directly via `execute_script`** — necessary because the visible `.text` property is empty (the fields are CSS-hidden, not actually removed from the DOM).
7. Parse the HTML with a regex that matches the portal's `<li>Label :<br>Value</li>` markup:
   ```python
   pairs = re.findall(
       r'<li>\s*(.*?)\s*:<br>\s*(.*?)\s*</li>',
       inner_html, re.IGNORECASE | re.DOTALL,
   )
   data = {unescape(k.strip()): unescape(v.strip()) for k, v in pairs}
   ```
8. Pull `Area of Expertise` (falling back to `Specific Expertise`) from the parsed `data` dict, plus a flattened `"Full Expertise Details"` string of every `Label: Value` pair on the profile.
9. Close the detail tab, return focus to the search tab, and continue to the next lecturer.

**Output:** results accumulated into a list of dicts, written to `UiTM_Lecturer_Expertise_Output.xlsx` via `pandas.DataFrame.to_excel`, with columns `Lecturer Name`, `Area of Expertise`, `Full Expertise Details`.

### 2.2 Superseded/earlier attempts

- **`scrapper.py`** — single hardcoded profile URL, scraped with `requests` + `BeautifulSoup`; demonstrates the static-HTML approach failing to reach JS-rendered content reliably, hence the move to Selenium.
- **`expertise.py`** — attempted a fully automated two-stage pipeline: (1) scrape the public FSKM staff directory page (`fskm.uitm.edu.my/.../staff-directory/academic-staff`) to auto-harvest lecturer names (stripping titles like `Dr.`, `Prof.`, `Ts.` via regex in `clean_lecturer_name`), then (2) POST each name to the Expert search endpoint and scrape the resulting profile for expertise fields, aggregating frequency counts with `collections.Counter`. This version was not the one that produced the final dataset (the hardcoded name list and Selenium flow were used instead), but it shows the original design intent of full automation before falling back to a manually-curated name list for reliability.

### 2.3 Post-processing / taxonomy discovery: `classificationl.py`

After scraping, this script analyses `UiTM_Lecturer_Expertise_Output.xlsx` to **derive a taxonomy** from the raw scraped text (rather than being applied to clean it for storage):
- Loads the `Area of Expertise` and `Full Expertise Details` columns, concatenates all text, uppercases it.
- **Method A:** splits on `|` and `:` to recover individual phrases, filters out structural labels (e.g. `"DIVISION OF EXPERTISE"`, `"AREA OF EXPERTISE"`, `"NOT FOUND"`), then ranks phrases by frequency with `Counter`.
- **Method B:** regex-extracts standalone uppercase words (`\b[A-Z]{3,}\b`), strips generic stop-words (`AND`, `SYSTEM`, `MANAGEMENT`, etc.), and ranks by frequency.
- Prints the top 10 most common phrases and keywords.

This frequency analysis is what informed the design of the **10 fixed `EXPERTISE_CATEGORIES`** used throughout the application (Machine Learning & Deep Learning, Data Science & Analytics, Artificial Intelligence, Software Engineering, Natural Language Processing, Learning Technology & HCI, Information Systems & Database, Computer Vision & Image Processing, Web & Mobile Development, Cybersecurity & Cryptography) — i.e., the taxonomy is **empirically grounded** in what FSKM lecturers actually listed, not arbitrarily invented.

### 2.4 Manual mapping into the application

The raw scraped strings per lecturer (e.g. free text like "Machine Learning, Big Data Analytics, Image Processing...") were **manually read and mapped by the developer** onto the closed 10-category taxonomy — this is a human curation step, not an automated classifier. The result is hardcoded directly into the main application's database seeder:

`/Users/haziqhilmi/Documents/fyp/fyp/server/seeders/seed.js` (from line 48):
```js
{ name: 'Azlan Bin Ismail', expertise: ['Machine Learning & Deep Learning', 'Web & Mobile Development', 'Data Science & Analytics'] },
{ name: 'Marshima Binti Mohd Rosli', expertise: ['Machine Learning & Deep Learning', 'Data Science & Analytics', 'Software Engineering'] },
{ name: 'Noraini Binti Seman', expertise: ['Natural Language Processing', 'Machine Learning & Deep Learning', 'Data Science & Analytics'] },
... // continues for all 40 lecturers
```
The lecturer names in this seed array are an exact match to the `LECTURERS` list in `selenium-scrapper.py`, confirming this seeder is the direct downstream consumer of the scraping exercise. Each supervisor is assigned 1–4 categories out of the 10.

This seed data becomes each `SupervisorProfile.expertise` row in MySQL when `npm run db:seed` is executed, and is later editable by each supervisor themselves via the Settings UI (Section 6.2).

---

## 3. Data Model (Storage)

| Model | Field | Type | Purpose |
|---|---|---|---|
| `SupervisorProfile` | `expertise` | `TEXT` (JSON-encoded array via Sequelize getter/setter) | The supervisor's selected categories, from the closed 10-tag taxonomy |
| `SupervisorProfile` | `expertise_embedding` | `TEXT` | Legacy/vestigial column from an earlier single-embedding design; unused by the current scoring engine |
| `StudentProfile` | `project_description` | `TEXT`, nullable | Free-text project description, entered by the student |
| `StudentProfile` | `fyp_title` | `STRING(500)`, nullable | Project title, concatenated with the description to form the matching query |

`server/models/SupervisorProfile.js`:
```js
expertise: {
  type: DataTypes.TEXT,
  allowNull: true,
  get() {
    const raw = this.getDataValue('expertise');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  },
  set(val) {
    this.setDataValue('expertise', JSON.stringify(val ?? []));
  }
}
```
This getter/setter pattern lets the column behave like a native array field in application code while remaining a plain JSON string in the MySQL `TEXT` column.

---

## 4. Model / Library Choice

- **Library:** [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) v2.17.2 — a WASM/ONNX port of HuggingFace Transformers that runs entirely inside Node.js. No Python runtime or external inference server is needed at request time (Python is used only offline, for the scraping step in Section 2).
- **Model:** `Xenova/all-MiniLM-L6-v2` — the ONNX-converted version of the standard `sentence-transformers/all-MiniLM-L6-v2`, a 384-dimension sentence embedding model, loaded via the `feature-extraction` pipeline.
- **Why this model:** small, fast, CPU-friendly, good general-purpose semantic similarity performance — suitable for a single Node process performing on-demand embedding without GPU infrastructure.

`server/services/embeddingService.js`:
```js
import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = false;
env.useBrowserCache = false;

async function getPipeline() {
  if (!_pipeline) {
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _pipeline;
}

async function embed(text) {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```
- **Pooling:** mean pooling over token embeddings (standard for sentence-transformers models).
- **Normalisation:** L2-normalised output vectors, so **cosine similarity reduces to a plain dot product** — used throughout the scoring logic to avoid repeated norm calculations:
```js
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
```

---

## 5. Preprocessing

Deliberately minimal — no stemming, lemmatization, or stop-word removal, since transformer embeddings are designed to consume natural language directly:

1. **Query construction (student side):** title and description are concatenated server-side —
   ```js
   const description =
     req.query.description ||
     [studentProfile.fyp_title, studentProfile.project_description]
       .filter(Boolean)
       .join('. ');
   ```
   (`server/controllers/supervisorController.js`) — "Combine title + description so strong title keywords also drive the match."
2. **Trimming:** `query.trim()` before embedding.
3. **Supervisor expertise text:** the selected category tags are joined into a single string — `tags.join(', ')` — for the "direct" similarity signal (see Section 6).
4. **Category description expansion (the key feature-engineering step):** rather than embedding the short label alone (e.g. "Machine Learning & Deep Learning"), each of the 10 categories is expanded into a hand-written paragraph giving the embedding model more semantic surface area to match against, e.g.:
   ```js
   'Machine Learning & Deep Learning':
     'Machine learning and deep learning techniques that learn patterns from data. Covers supervised and ' +
     'unsupervised learning, convolutional neural networks (CNNs), recurrent networks (RNNs), transformers, ' +
     'reinforcement learning, predictive modelling, class imbalance, and model training and evaluation.',
   ```
   This paragraph-style expansion was informed by the keyword/phrase frequency analysis done in `classificationl.py` (Section 2.3) — i.e., the descriptions were written to cover the actual vocabulary lecturers used to describe their own expertise.

---

## 6. Embedding & Caching Strategy

Three sets of vectors are computed, all cached in **in-memory module state** (no DB persistence of vectors despite the legacy `expertise_embedding` column):

1. **Category embeddings** (`_categoryEmbeddings`) — the 10 rich category descriptions, embedded once per server process and reused for the process lifetime. Warmed up proactively at boot via `warmUp()`, called from `server/server.js`:
   ```js
   import { warmUp } from './services/embeddingService.js';
   ...
   warmUp(); // computes all 10 category embeddings ahead of the first request
   ```
2. **Supervisor expertise embeddings** (`_supervisorEmbeddingCache`, a `Map` keyed by supervisor id, storing `{ text, vec }`) — computed lazily the first time a supervisor is scored, and **self-invalidating**: if the cached `text` no longer matches the supervisor's current expertise string, it is recomputed.
   - Explicit invalidation also happens when a supervisor edits their expertise via `PUT /api/supervisors/expertise`:
     ```js
     await profile.update({ expertise });
     await recomputeSupervisorEmbedding(profile); // no-op stub, kept for seeder compatibility
     clearSupervisorEmbeddingCache(profile.id);
     ```
3. **Query embedding** — computed fresh on every recommendation request (no caching, since the text varies per call).

---

## 7. Similarity / Scoring Algorithm

Implemented in `recommendSupervisors(query, supervisors, topN = 3)` (`server/services/embeddingService.js`). This is a **hybrid two-signal cosine-similarity scheme**, not a trained classifier — there is no training data, fine-tuning, or learned weighting; the blend weights below were manually tuned.

For each candidate supervisor:

1. Compute cosine similarity between the query embedding and **all 10 category embeddings** → `categoryScores`.
2. Look up the supervisor's own selected tags among those 10 categories, sort descending by score.
3. `primaryScore` = score of the supervisor's best-matching tag. `secondaryMean` = mean score of all their remaining tags.
4. **Signal 1 — category score** (rewards breadth of relevant secondary expertise without letting it dominate):
   ```
   categoryScore = primaryScore + 0.25 * secondaryMean
   ```
5. **Signal 2 — direct score:** cosine similarity between the query embedding and the embedding of the supervisor's own expertise-tag text directly (not via the category descriptions).
6. **Final blended score:**
   ```
   finalScore = 0.55 * categoryScore + 0.45 * directScore
   match_score = round(finalScore, 4)
   ```
7. **Matched tags for UI highlighting:** the supervisor's best tag, plus any other tag scoring `>= 0.55 * primaryScore` — a relative threshold so it adapts to the strength of each individual query.
8. Supervisors with zero selected expertise tags receive `match_score = 0`.
9. All candidates sorted descending by `match_score`, sliced to the top `N` (3).

```js
const finalScore = 0.55 * categoryScore + 0.45 * directScore;
return {
  ...supervisor,
  match_score: Math.round(finalScore * 10000) / 10000,
  matched_expertise: bestCategory,
  matched_tags: matchedTags,
};
```

---

## 8. API Exposure

### `GET /api/supervisors/recommendations`
- Auth: `studentOnly`.
- Route registered **before** `GET /:id` in `server/routes/supervisorRoutes.js` to avoid Express matching the literal string "recommendations" as an `:id` parameter — explicit comment in the source flags this ordering requirement.
- Controller (`server/controllers/supervisorController.js::getRecommendations`):
  1. Loads the requesting student's `StudentProfile`.
  2. Builds the query text from `fyp_title` + `project_description` (or an optional `?description=` override).
  3. Loads all `SupervisorProfile` rows where `is_accepting = true`, joined to an active `User`.
  4. Filters out supervisors already at capacity (`current_student_count >= max_students`).
  5. Calls `recommendSupervisors(description, candidates, 3)`.
  6. Returns `{ success: true, data: scored }`.
- Response item shape: `{ id, user_id, name, email, staff_id, expertise, max_students, current_student_count, is_accepting, match_score, matched_expertise, matched_tags }`.

### `PUT /api/supervisors/expertise`
- Auth: `supervisorOnly`.
- Validates `expertise` is an array, persists it, invalidates the in-memory embedding cache for that supervisor so the next recommendation call uses fresh data.

### `PUT /api/users/profile/description`
- Auth: student-only (enforced inside the controller).
- Persists `project_description` on the student's profile; this is the text that ultimately drives the embedding query.

---

## 9. Frontend Integration

### Student side — `client/src/pages/student/SupervisorMarketplace.jsx`
- Fetches the student's `project_description` from `/users/profile`.
- Fires a TanStack Query against `/supervisors/recommendations`, but only `enabled: !!projectDescription` — i.e. recommendations are not requested until the student has written something.
- Applies a **client-side score floor**:
  ```js
  const MIN_RECOMMENDATION_SCORE = 0.20;
  ```
  with the calibration comment: "strong topical matches land ~0.40+, decent matches ~0.30, off-topic supervisors fall below 0.20."
- Buckets scores into UI badges:
  ```js
  function matchLabel(score) {
    if (score >= 0.40) return { label: 'Best Match', color: 'bg-green-100 text-green-700' };
    if (score >= 0.30) return { label: 'Strong Match', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Good Match', color: 'bg-amber-100 text-amber-700' };
  }
  ```
- Renders a "Recommended for You" section above the regular browsable supervisor grid; `matched_tags` are visually highlighted (green, ringed) against the supervisor's full expertise tag list.
- `DescriptionModal` component is the free-text entry UI that saves to `/users/profile/description` and invalidates the recommendations query on save.
- `ProjectDescriptionPrompt` nudges students with no description yet: "Get personalised supervisor recommendations... our AI will match you with the best supervisors."

### Supervisor side — `client/src/pages/supervisor/SupervisorSettings.jsx`
- Renders the same 10 `EXPERTISE_CATEGORIES` (kept in sync with `embeddingService.js`) as toggleable pill buttons.
- Saving triggers `PUT /supervisors/expertise`, with a confirmation toast: "Expertise updated. AI matching index refreshed."

---

## 10. Design Notes, Caveats, and Evolution (useful for report discussion/limitations)

- **No `instruction.md` requirement** — this feature was added ad hoc on top of the base FYP management system spec; it is an enhancement, not an original requirement.
- **No Python microservice in production** — the only Python code is the **offline, one-time data-collection toolchain** in `/Users/haziqhilmi/Documents/fyp/script/`. The live application is 100% Node.js/JavaScript, with the embedding model running in-process via `@xenova/transformers`.
- **Evolution of the scoring design** is visible across commits:
  - **v1** (initial commit `97dbf39`): a single embedding per supervisor (`expertise_embedding`), persisted in the database, compared directly against the query embedding via cosine similarity (`getEmbedding`/`cosineSimilarity`).
  - **v2** (current): a hybrid taxonomy-aware design — category-based reasoning blended with direct expertise-text similarity, computed on the fly with in-memory caching rather than DB persistence. The `expertise_embedding` column remains in the schema but is no longer read or written meaningfully by the engine.
- **No formal evaluation:** there is no labelled ground-truth dataset, no precision/recall/F1 measurement, and no A/B testing of the scoring weights. All thresholds (`0.55`/`0.45` blend, `0.25` secondary weight, `0.55x` matched-tag threshold, `0.20` UI floor, `0.40`/`0.30` badge cutoffs) were manually calibrated by observing example outputs, not learned from data. This is worth flagging explicitly as a **limitation** in the report, with a recommendation for future work (e.g. collecting actual supervisor-student match outcomes to validate or tune these weights, or running a small user study to calibrate thresholds empirically).
- **Manual mapping step is a human-in-the-loop bottleneck:** scaling this approach to a full university (not just one department's 40 lecturers) would require either a more automated classifier from raw scraped text to the fixed taxonomy, or accepting continued manual curation effort.
- **Scraper fragility:** the Selenium script depends on the UiTM Expert portal's specific HTML structure (`#searchWord`, `#listSearch`, `#viewDetPrDet`, and the `<li>Label :<br>Value</li>` markup pattern) and is not resilient to portal redesigns — a one-off data acquisition tool rather than a maintained integration.

---

## 11. Key File Reference

| File | Role |
|---|---|
| `/Users/haziqhilmi/Documents/fyp/script/selenium-scrapper.py` | Final data collection script (Selenium-based scraping of UiTM Expert portal) |
| `/Users/haziqhilmi/Documents/fyp/script/scrapper.py` | Earlier static-HTML scraping attempt (superseded) |
| `/Users/haziqhilmi/Documents/fyp/script/expertise.py` | Earlier automated name-harvest + cross-reference attempt (superseded) |
| `/Users/haziqhilmi/Documents/fyp/script/classificationl.py` | Frequency analysis used to design the 10-category taxonomy |
| `/Users/haziqhilmi/Documents/fyp/script/UiTM_Lecturer_Expertise_Output.xlsx` | Raw scraped output dataset |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/seeders/seed.js` | Manually-curated mapping of each lecturer to 1-4 fixed expertise categories; seeds `SupervisorProfile.expertise` |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/models/SupervisorProfile.js` | `expertise` (JSON-array-as-TEXT) and legacy `expertise_embedding` fields |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/models/StudentProfile.js` | `project_description`, `fyp_title` fields |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/services/embeddingService.js` | Core NLP engine: model loading, category descriptions, embedding, hybrid scoring algorithm |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/controllers/supervisorController.js` | `getRecommendations`, `updateExpertise` — API logic |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/routes/supervisorRoutes.js` | Route wiring, including the `/recommendations` vs `/:id` ordering note |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/controllers/userController.js` | `updateProjectDescription` — student input endpoint |
| `/Users/haziqhilmi/Documents/fyp/fyp/server/server.js` | Calls `warmUp()` at boot to pre-compute category embeddings |
| `/Users/haziqhilmi/Documents/fyp/fyp/client/src/pages/student/SupervisorMarketplace.jsx` | Student-facing recommendation UI |
| `/Users/haziqhilmi/Documents/fyp/fyp/client/src/pages/supervisor/SupervisorSettings.jsx` | Supervisor expertise tag editor |
| `/Users/haziqhilmi/Documents/fyp/fyp/package.json` | `@xenova/transformers` dependency declaration |
