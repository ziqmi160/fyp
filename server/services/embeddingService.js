import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = false;

export const EXPERTISE_CATEGORIES = [
  'Machine Learning & Deep Learning',
  'Data Science & Analytics',
  'Artificial Intelligence',
  'Software Engineering',
  'Natural Language Processing',
  'Learning Technology & HCI',
  'Information Systems & Database',
  'Computer Vision & Image Processing',
  'Web & Mobile Development',
  'Cybersecurity & Cryptography',
];

// Rich descriptions give the model more semantic surface area than short labels.
const CATEGORY_DESCRIPTIONS = {
  'Machine Learning & Deep Learning':
    'Machine learning and deep learning techniques that learn patterns from data. Covers supervised and ' +
    'unsupervised learning, convolutional neural networks (CNNs), recurrent networks (RNNs), transformers, ' +
    'reinforcement learning, predictive modelling, class imbalance, and model training and evaluation.',
  'Data Science & Analytics':
    'Extracting insights from structured and unstructured data. Includes data mining, big data analytics, ' +
    'statistical analysis, data visualisation, feature engineering, predictive analytics, healthcare ' +
    'informatics, social media intelligence, and signal analysis and processing.',
  'Artificial Intelligence':
    'Classical and applied AI techniques including fuzzy logic, soft computing, genetic algorithms, ' +
    'expert systems, computational intelligence, evolutionary computation, scheduling and timetabling, ' +
    'optimization heuristics, decision support systems, and hierarchical fuzzy systems.',
  'Software Engineering':
    'Software development processes, quality assurance, and project management. Covers requirements ' +
    'engineering, software metrics, functional size measurement, effort estimation, software architecture, ' +
    'testing, agile methodologies, ontology engineering, and software project management.',
  'Natural Language Processing':
    'Processing and understanding human language through computational methods. Includes NLP, text ' +
    'analytics, sentiment analysis, speech processing and recognition, Malay and multilingual language ' +
    'technology, information retrieval, and human language technology.',
  'Learning Technology & HCI':
    'Technology-enhanced learning and human-computer interaction. Covers e-learning platforms, ' +
    'gamification, educational technology, multimedia systems, learning analytics, edutainment, ' +
    'intelligent learning systems, collaborative computing, and user experience design.',
  'Information Systems & Database':
    'Design and management of information systems and databases. Includes relational and NoSQL databases, ' +
    'information retrieval, knowledge management, ontology engineering, digital libraries, electronic ' +
    'information storage, and collaborative information systems.',
  'Computer Vision & Image Processing':
    'Processing and understanding visual data through computation. Covers digital image processing, ' +
    'computer vision, object detection, image segmentation, pattern recognition, signal processing, ' +
    'image retrieval, and visual data analysis for medical or industrial applications.',
  'Web & Mobile Development':
    'Building web and mobile applications. Includes frontend and backend web development, cloud computing, ' +
    'mobile computing, cross-platform frameworks, REST API design, progressive web apps, games ' +
    'development, and scalable distributed application architecture.',
  'Cybersecurity & Cryptography':
    'Protecting systems and data from digital threats. Covers cryptographic algorithms, blockchain ' +
    'technology, network security, intrusion detection, penetration testing, secure communication ' +
    'protocols, digital forensics, and cybersecurity frameworks.',
};

let _pipeline = null;
let _categoryEmbeddings = null;

// Cache of direct expertise embeddings, keyed by supervisor id.
// Each entry stores { text, vec } so a changed expertise string self-invalidates.
const _supervisorEmbeddingCache = new Map();

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

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function getCategoryEmbeddings() {
  if (!_categoryEmbeddings) {
    _categoryEmbeddings = {};
    for (const cat of EXPERTISE_CATEGORIES) {
      _categoryEmbeddings[cat] = await embed(CATEGORY_DESCRIPTIONS[cat]);
    }
  }
  return _categoryEmbeddings;
}

// Embed a supervisor's expertise tags as a single text string for direct
// query-to-supervisor similarity. Cached per supervisor; recomputed only when
// the expertise text changes.
async function getSupervisorExpertiseVec(supervisor) {
  const tags = Array.isArray(supervisor.expertise) ? supervisor.expertise : [];
  const text = tags.join(', ');
  if (!text) return null;

  const cached = _supervisorEmbeddingCache.get(supervisor.id);
  if (cached && cached.text === text) return cached.vec;

  const vec = await embed(text);
  _supervisorEmbeddingCache.set(supervisor.id, { text, vec });
  return vec;
}

/**
 * Drop a supervisor's cached expertise embedding (e.g. after they edit their
 * expertise). Call with no argument to clear the entire cache.
 */
export function clearSupervisorEmbeddingCache(supervisorId) {
  if (supervisorId == null) {
    _supervisorEmbeddingCache.clear();
  } else {
    _supervisorEmbeddingCache.delete(supervisorId);
  }
}

/**
 * Recommend supervisors for a project description.
 *
 * Hybrid scoring blends two signals (both cosine similarities, since all vectors
 * are normalised so dot product = cosine):
 *   1. Category score — query vs. the 10 rich expertise-category descriptions,
 *      taking the supervisor's best-matching category (primary) plus a weighted
 *      average of their remaining categories: primary + 0.25 × secondary_mean.
 *   2. Direct score — query vs. the supervisor's own expertise text directly.
 *   final_score = 0.55 × category_score + 0.45 × direct_score
 *
 * @param {string} query - The project query ("title. description").
 * @param {Array}  supervisors - Objects with at least { id, expertise: string[] }.
 * @param {number} topN
 */
export async function recommendSupervisors(query, supervisors, topN = 3) {
  const queryVec = await embed(query.trim());
  const catEmbeddings = await getCategoryEmbeddings();

  // Pre-compute query similarity against every category (dot = cosine since vecs are normalised)
  const categoryScores = {};
  for (const cat of EXPERTISE_CATEGORIES) {
    categoryScores[cat] = dot(queryVec, catEmbeddings[cat]);
  }

  const scored = await Promise.all(supervisors.map(async supervisor => {
    const tags = Array.isArray(supervisor.expertise) ? supervisor.expertise : [];

    if (tags.length === 0) {
      return { ...supervisor, match_score: 0, matched_expertise: null, matched_tags: [] };
    }

    const tagScores = tags
      .map(tag => ({ tag, score: categoryScores[tag] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const primaryScore = tagScores[0].score;
    const bestCategory = tagScores[0].tag;
    const secondaryMean =
      tagScores.length > 1
        ? tagScores.slice(1).reduce((s, t) => s + t.score, 0) / (tagScores.length - 1)
        : 0;

    // Tags responsible for the match: always the best, plus any other tag scoring
    // within 55% of it. Relative-to-best so it adapts to each query's strength.
    const matchedTags = tagScores
      .filter((t, i) => i === 0 || t.score >= 0.55 * primaryScore)
      .map(t => t.tag);

    // Signal 1: taxonomy reasoning — best category, rewarding breadth of relevant areas.
    const categoryScore = primaryScore + 0.25 * secondaryMean;

    // Signal 2: direct text similarity between the query and the supervisor's expertise.
    const expertiseVec = await getSupervisorExpertiseVec(supervisor);
    const directScore = expertiseVec ? dot(queryVec, expertiseVec) : 0;

    const finalScore = 0.55 * categoryScore + 0.45 * directScore;

    return {
      ...supervisor,
      match_score: Math.round(finalScore * 10000) / 10000,
      matched_expertise: bestCategory,
      matched_tags: matchedTags,
    };
  }));

  return scored.sort((a, b) => b.match_score - a.match_score).slice(0, topN);
}

// Kept for seeder compatibility — expertise_embedding is no longer used by the engine.
export async function recomputeSupervisorEmbedding(_profile) {}

export async function warmUp() {
  try {
    await getCategoryEmbeddings();
    console.log('Embedding service warmed up.');
  } catch (err) {
    console.warn('Embedding service warm-up failed:', err.message);
  }
}
