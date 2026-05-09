# FYP Management System — Feature Gap Analysis & Plan

> Based on: **FYP Computing Essential Okt 22.pdf** (UiTM CS FYP Workflow)  
> Compared against: **instruction.md** (current system specification)

---

## Overview of the Official Workflow

The official FYP process spans **two semesters** and two distinct course codes:

| Phase | Course | Semester | Description |
|-------|--------|----------|-------------|
| **Project Formulation** | CSP600 | 5th | Proposal writing, supervisor matching, proposal defense |
| **Project** | CSP650 | 6th | Full project execution, FYP report, final presentation & exhibition |

### Official Forms Referenced
| Form | Name |
|------|------|
| F1 | Mutual Acceptance Form |
| F2 | Project Motivation Evaluation Form |
| F3 | Literature Review Evaluation Form |
| F4 | Methodology Evaluation Form |
| F5 | Proposal/Project In-Progress Form *(consultation log)* |
| F6(a) | Project Formulation Report Submission Form |
| F6(b) | Project (FYP) Report Submission Form |
| F7 | Project Formulation Presentation Form *(examiner evaluates)* |
| F8 | Project Formulation Report Evaluation Form *(examiner evaluates)* |
| F9 | Project Progress Presentation Form |
| F10 | Final Project Presentation Form |
| F11 | Final Report Evaluation Form |
| F12 | Confirmation of Correction Form |
| F13 | LMC (Lean Model Canvas) Evaluation Form |
| F14–F16 | Special Evaluation Forms |

---

## What the Current System Already Has

- ✅ Authentication (login, role-based routing)
- ✅ Supervisor marketplace + supervision request (F1 proxy)
- ✅ Submission management (generic — proposal, progress, draft, final)
- ✅ Meeting logbook (partial F5 proxy)
- ✅ Supervisor submission review with feedback
- ✅ Coordinator: student/supervisor management, basic reports
- ✅ Notifications system
- ✅ Mutual Acceptance PDF generation on request acceptance

---

## Missing Features — Grouped by Role

---

### 🟦 COORDINATOR (Project Formulation Lecturer / Project Lecturer)

#### C1 — Semester / Phase Management *(Critical)*
**What:** The system has no concept of the two-phase lifecycle (CSP600 → CSP650). Without this, workflow enforcement is impossible.  
**Needed:**
- A `semesters` or `phases` table tracking the active phase per cohort
- Coordinator can open/close phases (e.g., "Project Formulation is now active")
- Student FYP status must align to phase gates (can't do CSP650 tasks in CSP600)

---

#### C2 — Examiner Assignment *(Critical)*
**What:** The coordinator assigns a specific examiner (a supervisor who is NOT the student's own supervisor) to each student for both the proposal defense and the final presentation.  
**Needed:**
- Examiner assignment UI: coordinator selects a supervisor user and maps them to a student as "examiner"
- A new `examiner_assignments` table (student_id, examiner_id, phase, created_at)
- Examiners see only the students assigned to them (not all students)
- Both supervisor AND examiner can access the student's submitted report

---

#### C3 — Presentation Session Scheduling *(High)*
**What:** Coordinator plans and schedules the proposal presentation sessions (F7 defense) and the final presentation, then notifies all parties.  
**Needed:**
- Coordinator can create a presentation session (date, time, venue, list of students)
- Auto-assign examiner + supervisor to each slot
- Notifications sent to student, supervisor, and examiner
- Students see their presentation slot on dashboard

---

#### C4 — Resource Library (Previous Titles & Specializations) *(Medium)*
**What:** Coordinator provides a list of previous FYP titles and lecturer specializations for student reference at the start of CSP600.  
**Needed:**
- A "Resource Library" section in the coordinator panel
- Upload/manage previous FYP titles (CSV or manual entry)
- Students can browse/search this library from their dashboard

---

#### C5 — Anti-Plagiarism Tracking *(Medium)*
**What:** Coordinator instructs students to screen reports and tracks whether the plagiarism check has been completed before allowing report submission.  
**Needed:**
- A plagiarism check record per submission: student uploads a screenshot/report from Turnitin (or similar)
- Coordinator can see plagiarism status for all students
- Submission gate: cannot submit F6(a) / F6(b) without attaching plagiarism result

---

#### C6 — Report Distribution to Examiners *(High)*
**What:** After students submit their proposal/FYP reports, the coordinator distributes them to the assigned examiner along with the evaluation forms (F8, F11).  
**Needed:**
- When a student's submission is marked as "ready for examination," coordinator triggers distribution
- Examiner receives notification with a link to the student's report and the relevant evaluation form
- System tracks whether distribution has been done

---

#### C7 — Marks Recording *(High)*
**What:** After all evaluations are complete, the coordinator consolidates marks from F7+F8 (proposal) and F9+F10+F11 (project) and records them.  
**Needed:**
- A marks/grades section per student showing evaluation scores from each form
- Coordinator can view aggregated marks and export them (for uploading to RES)
- Optional: mark breakdown by component (presentation, report, supervisor mark)

---

#### C8 — Final Deliverables Collection *(Medium)*
**What:** Coordinator collects the final bundle from each student: FYP report (PDF + DOCX), slides, poster, raw data, system files, .apk/.exe.  
**Needed:**
- A "Final Submission Checklist" that replaces the current generic "final" submission type
- Student uploads each deliverable type individually with labels
- Coordinator sees a completion checklist per student (what has/hasn't been submitted)

---

#### C9 — FYP Exhibition Management *(Low-Medium)*
**What:** A resource person/lecturer in charge plans and manages the FYP exhibition, briefs students.  
**Needed:**
- Exhibition event creation (date, venue, schedule)
- Student briefing announcements (pinned notice on student dashboard)
- Exhibition attendance tracking

---

### 🟩 SUPERVISOR (also acting as EXAMINER for other students)

#### S1 — Dual Role: Supervisor vs. Examiner *(Critical)*
**What:** A supervisor can simultaneously be:
- The **supervisor** of their own students (guiding, checking, signing F5)
- The **examiner** for a different student (evaluating presentation + report)

The current system has no examiner concept at all.  
**Needed:**
- Supervisor dashboard split into "My Supervisees" and "Students I'm Examining"
- Examiner view: read-only access to the assigned student's submitted report + ability to fill evaluation forms

---

#### S2 — Evaluation Forms (F7, F8, F9, F10, F11) *(Critical)*
**What:** The examiner (and sometimes supervisor) scores the student using structured rubric-based forms at key milestones.  
**Needed:**
- Digital versions of evaluation forms with scored rubric fields:
  - **F7**: Proposal presentation form (examiner scores: clarity, methodology, feasibility, etc.)
  - **F8**: Proposal report evaluation form (examiner scores: literature, methodology, writing)
  - **F9**: Progress presentation form (supervisor/coordinator scores mid-project progress)
  - **F10**: Final presentation form (examiner scores)
  - **F11**: Final report evaluation form (examiner scores)
- Each form is locked to the relevant milestone (can't fill F10 before the final presentation is scheduled)
- Submitted forms are visible to the coordinator

---

#### S3 — Confirmation of Correction (F12) *(High)*
**What:** After the student does post-examination amendments to their FYP report, the examiner checks the amended report and signs the F12 form. The supervisor also signs the Supervisor Approval page.  
**Needed:**
- After final submission is marked "revision required," student uploads amended report
- Examiner reviews and digitally "signs" F12 (approves corrections are done)
- Supervisor digitally "signs" the Supervisor Approval
- Both signatures tracked in a `corrections` table; student cannot close out without both

---

#### S4 — Proposal/Project In-Progress Form (F5) Co-signing *(Medium)*
**What:** After each consultation meeting, the student updates the F5 form and the supervisor checks and signs it. Currently the meeting log doesn't capture this formal sign-off.  
**Needed:**
- Meeting log entry has a "Supervisor Confirmed" flag that the supervisor must toggle
- The F5 form fields: discussion points, action items, next meeting date, supervisor signature
- Students can view all F5 entries; coordinator can audit them

---

#### S5 — Supervisor Notes on Student Progress *(Low — partially exists)*
**What:** Supervisor provides ongoing notes/comments in the F5 form per consultation, beyond just meeting status.  
**Needed:**
- Richer meeting/consultation log with structured fields (topic discussed, action items, next steps)
- Separate from the free-text notes already in the current meeting log

---

### 🟨 STUDENT

#### ST1 — Phase-Aware Workflow Tracker *(Critical)*
**What:** Students need to see exactly where they are in the FYP process — which phase they're in, which steps are complete, and what's next. Currently there's just a generic FYP status badge.  
**Needed:**
- A visual **FYP Progress Timeline** on the student dashboard:
  - CSP600 steps: Register → Find Supervisor (F1) → F2 → F3+F4 → F5 consultations → Plagiarism check → Submit proposal (F6a) → Proposal defense → Amendments → Re-submit
  - CSP650 steps: Register → F5 consultations → LMC → Progress presentation → Plagiarism check → Submit FYP report (F6b) → Final presentation & exhibition → Amendments → F12 → Final deliverables
- Each step is checked off when completed; locked steps shown as upcoming

---

#### ST2 — Specific Form Submissions (F2, F3, F4) *(High)*
**What:** Students must submit specific evaluation forms at set points during CSP600.  
**Needed:**
- Dedicated submission types for F2, F3, F4 (beyond the generic "proposal/progress" types)
- Each form type has specific required fields (not just a file upload)
- Coordinator/supervisor reviews and marks them as evaluated

---

#### ST3 — Business Model Canvas / Lean Model Canvas Submission *(Medium)*
**What:**
- In CSP600: Student submits a **BMC** (Business Model Canvas) to the coordinator for review
- In CSP650: Student submits a **LMC** (Lean Model Canvas) to the coordinator; coordinator evaluates using F13  
**Needed:**
- Separate submission type for BMC (CSP600) and LMC (CSP650)
- Coordinator receives and evaluates using F13 rubric

---

#### ST4 — Ethical Approval Application Tracking *(Low-Medium)*
**What:** If required, students must apply for ethical approval (REC) before proceeding. This is a gating condition.  
**Needed:**
- A checkbox/field on the student profile: "Ethical Approval Required?" (Yes/No)
- If Yes: student uploads the REC form; coordinator approves/waives
- Gate: student cannot proceed to proposal submission until ethical approval is resolved

---

#### ST5 — Presentation Scheduling View *(High)*
**What:** Students need to see their scheduled presentation slot (coordinator-assigned) and confirm attendance.  
**Needed:**
- Presentation slot shown prominently on student dashboard
- Student confirms attendance (to trigger notification to supervisor + examiner)

---

#### ST6 — Amendments Workflow *(High)*
**What:** After the proposal/FYP defense, if the examiner marks the report as "revision required," the student must do amendments, re-submit, and then get examiner + supervisor sign-off.  
**Needed:**
- When a submission is marked "revision_required" post-presentation, an "Amendment Request" is generated
- Student uploads the amended report
- Examiner reviews → signs F12 digitally
- Supervisor signs Supervisor Approval
- Student sees amendment status in their progress timeline

---

#### ST7 — Plagiarism Report Upload *(Medium)*
**What:** Students must screen their proposal/FYP report with anti-plagiarism software and submit the result before the coordinator can accept the report submission.  
**Needed:**
- On submission form for F6(a) and F6(b): required field to attach the plagiarism report/screenshot
- Coordinator can see similarity percentage and report file

---

#### ST8 — Final Deliverables Submission *(Medium)*
**What:** At the end of CSP650, the student must submit a complete bundle: report (PDF+DOCX), slides, poster, raw data, system files.  
**Needed:**
- A structured "Final Package" submission with individual upload slots per deliverable type
- Progress indicator showing what's been uploaded vs. still missing
- Coordinator gets notified when the full package is complete

---

## Summary Table

| # | Feature | Role | Phase | Priority |
|---|---------|------|-------|----------|
| C1 | Semester/Phase Management | Coordinator | Both | 🔴 Critical |
| C2 | Examiner Assignment | Coordinator | Both | 🔴 Critical |
| S1 | Dual Role: Supervisor & Examiner | Supervisor | Both | 🔴 Critical |
| S2 | Evaluation Forms (F7-F11) | Supervisor/Examiner | Both | 🔴 Critical |
| ST1 | Phase-Aware Progress Tracker | Student | Both | 🔴 Critical |
| C3 | Presentation Session Scheduling | Coordinator | Both | 🟠 High |
| C6 | Report Distribution to Examiners | Coordinator | Both | 🟠 High |
| C7 | Marks Recording & Export | Coordinator | Both | 🟠 High |
| S3 | Confirmation of Correction (F12) | Supervisor/Examiner | CSP650 | 🟠 High |
| S4 | F5 Form Co-signing per Consultation | Supervisor | Both | 🟠 High |
| ST2 | F2, F3, F4 Form Submissions | Student | CSP600 | 🟠 High |
| ST5 | Presentation Scheduling View | Student | Both | 🟠 High |
| ST6 | Amendments Workflow | Student | Both | 🟠 High |
| C4 | Resource Library (Past Titles) | Coordinator | CSP600 | 🟡 Medium |
| C5 | Anti-Plagiarism Tracking | Coordinator | Both | 🟡 Medium |
| C8 | Final Deliverables Collection | Coordinator | CSP650 | 🟡 Medium |
| ST3 | BMC / LMC Submission | Student | Both | 🟡 Medium |
| ST4 | Ethical Approval Tracking | Student | CSP600 | 🟡 Medium |
| ST7 | Plagiarism Report Upload | Student | Both | 🟡 Medium |
| ST8 | Final Deliverables Submission | Student | CSP650 | 🟡 Medium |
| C9 | FYP Exhibition Management | Coordinator | CSP650 | 🟢 Low-Med |
| S5 | Richer Consultation Log (F5 fields) | Supervisor | Both | 🟢 Low |

---

## Key Architectural Changes Required

1. **`phases`/`semesters` table** — to gate all workflow steps by active phase (CSP600 vs CSP650)
2. **`examiner_assignments` table** — coordinator assigns examiner per student per phase
3. **`evaluation_forms` table** — stores structured rubric scores (F7, F8, F9, F10, F11, F13)
4. **`presentation_sessions` table** — coordinator-scheduled slots with student/supervisor/examiner
5. **`amendments` table** — tracks post-defense correction workflow and F12 sign-offs
6. **`deliverables` table** — final package with per-type upload slots

> **Note:** The `submissions` table submission_type ENUM will need expansion to cover F2, F3, F4, BMC, LMC, F6(a), F6(b), and the final package — or a separate typed-forms system.
