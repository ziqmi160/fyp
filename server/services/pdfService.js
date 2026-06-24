import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENTS_DIR = path.join(__dirname, '../uploads/documents');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Draw a simple bordered rectangle (no fill)
function rect(doc, x, y, w, h) {
  doc.save().rect(x, y, w, h).lineWidth(0.75).strokeColor('#000').stroke().restore();
}

// Draw a table row with a label cell and a value cell
function tableRow(doc, x, y, labelW, totalW, rowH, label, value, opts = {}) {
  // Label cell
  rect(doc, x, y, labelW, rowH);
  doc.font('Helvetica').fontSize(9).fillColor('#000')
    .text(label, x + 5, y + (rowH - 9) / 2 + 1, { width: labelW - 10, lineBreak: false });

  // Value cell
  rect(doc, x + labelW, y, totalW - labelW, rowH);
  if (value) {
    doc.font(opts.valueBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#000')
      .text(value, x + labelW + 5, y + (rowH - 9) / 2 + 1, { width: totalW - labelW - 10, lineBreak: false });
  }
}

export function generateMutualAcceptance({ student, supervisor, title, date, studentProfile }) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `F1_mutual_acceptance_${student.id}_${supervisor.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const PW = doc.page.width;   // 595.28
    const PH = doc.page.height;  // 841.89
    const L  = 45;               // left margin
    const R  = PW - 40;          // right margin
    const CW = R - L;            // ~510

    const DARK   = '#2d2d2d';    // header band background
    const WHITE  = '#ffffff';
    const BLACK  = '#000000';

    // ─────────────────────────────────────────────────────────────
    // PAGE 1 – Terms & Conditions
    // ─────────────────────────────────────────────────────────────

    // ── Form title ────────────────────────────────────────────────
    let y = 30;
    doc.fontSize(14).fillColor(BLACK).font('Helvetica-Bold')
      .text('F1 – MUTUAL ACCEPTANCE FORM', L, y, { width: CW, align: 'center' });

    y += 20;
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('TERMS AND CONDITIONS', L, y, { width: CW, align: 'center' });

    // ── Section I ─────────────────────────────────────────────────
    y += 18;
    doc.fontSize(10).fillColor(BLACK).font('Helvetica-Bold')
      .text('I.        EXPECTATION OF STUDENT FROM THE SUPERVISOR & CO-SUPERVISOR', L, y, { width: CW });

    const TC_FONT = 9.5;
    const TC_INDENT = L + 16;
    const TC_W = CW - 16;
    y += 14;
    doc.font('Helvetica').fontSize(TC_FONT).fillColor(BLACK);

    const tcItems1 = [
      'The supervisor should meet the student on a weekly basis at a mutually agreed day and time suitable to both parties. Any meeting changes should be communicated in advance to the student to facilitate re-scheduling.',
      "The supervisor should advice, guide, and assess the student's proposal/project work throughout the duration of the project formulation/project course.",
      "The supervisor should motivate and encourage the student's initiative in taking responsibility for his/her own project through to completion.",
      "The supervisor should regularly update the student on his/her performance. A weak or non- compliant performance from the student should be communicated to the course lecturer and/or project coordinator for further action.",
      "The supervisor reserves the right under special circumstances to discontinue his/her supervisory role with the student after the project formulation phase. This matter should be communicated to the project coordinator for further action.",
      'At all times, mutual respect and courtesy should be observed between the supervisor and the student.',
    ];

    tcItems1.forEach((item) => {
      doc.text('•  ' + item, TC_INDENT, y, { width: TC_W });
      y = doc.y + 3;
    });

    // ── Section II ────────────────────────────────────────────────
    y += 4;
    doc.fontSize(10).fillColor(BLACK).font('Helvetica-Bold')
      .text('II.       EXPECTATION OF SUPERVISOR(S ) FROM THE STUDENT', L, y, { width: CW });

    y += 14;
    doc.font('Helvetica').fontSize(TC_FONT).fillColor(BLACK);

    const tcItems2 = [
      "The student should apply his/her acquired skills and knowledge to produce a substantially successful and original project.",
      'The student should be responsible for the completion of his/her project without undue dependence on his/her supervisor.',
      'The student should be punctual for the weekly meetings with his/her supervisor. Any meeting changes should be communicated in advance to the supervisor to facilitate re-scheduling.',
      'The student reserves the right under special circumstances to discontinue his/her supervision with the supervisor after the project formulation phase. This matter should be communicated to the project coordinator for further action.',
      'At all times, mutual respect and courtesy should be observed between the supervisor and the student.',
    ];

    tcItems2.forEach((item) => {
      doc.text('•  ' + item, TC_INDENT, y, { width: TC_W });
      y = doc.y + 3;
    });

    // ── Acknowledgment line ───────────────────────────────────────
    y += 10;
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica')
      .text('I hereby understand the above mentioned Terns and Conditions.', L, y, { width: CW });

    // ── T&C Signature block ───────────────────────────────────────
    y += 22;
    const SIG_LINE_W = 130;
    const COL1_X = L + 60;            // line starts here (left column)
    const COL2_LABEL_X = L + CW / 2;  // right column label
    const COL2_X = COL2_LABEL_X + 72; // right column line starts here

    const drawSigLine = (lx, ly) => {
      doc.moveTo(lx, ly).lineTo(lx + SIG_LINE_W, ly).lineWidth(0.75).strokeColor(BLACK).stroke();
    };

    // Row 1: Signature
    doc.fontSize(9).fillColor(BLACK).font('Helvetica')
      .text('Signature:', L, y + 2);
    drawSigLine(COL1_X, y + 10);

    doc.text('Signature:', COL2_LABEL_X, y + 2);
    drawSigLine(COL2_X, y + 10);

    y += 22;
    // Row 2: Name
    doc.text("Student's Name:", L, y + 2);
    drawSigLine(COL1_X, y + 10);

    doc.text("Supervisor's Name:", COL2_LABEL_X, y + 2);
    drawSigLine(COL2_X, y + 10);

    y += 22;
    // Row 3: Date
    doc.text('Date:', L, y + 2);
    drawSigLine(COL1_X, y + 10);

    doc.text('Date:', COL2_LABEL_X, y + 2);
    drawSigLine(COL2_X, y + 10);

    // ─────────────────────────────────────────────────────────────
    // PAGE 2 – Info & Agreement
    // ─────────────────────────────────────────────────────────────
    doc.addPage();

    // ── Page 2 header (plain – no dark band) ─────────────────────
    const P2_T = 30;

    // Student's Photo placeholder box – top right  ← REPLACE: 78 × 98 pt image
    // To replace: doc.image('path/to/photo.jpg', R - 78, P2_T, { width: 78, height: 98 })
    const PHOTO_W = 78;
    const PHOTO_H = 98;
    const PHOTO_X = R - PHOTO_W;
    rect(doc, PHOTO_X, P2_T, PHOTO_W, PHOTO_H);
    doc.fontSize(7.5).fillColor('#999').font('Helvetica-Oblique')
      .text("Student's Photo", PHOTO_X, P2_T + PHOTO_H / 2 - 5, { width: PHOTO_W, align: 'center' });
    doc.font('Helvetica');

    // Form title (left of photo)
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('F1- MUTUAL ACCEPTANCE FORM', L, P2_T + 10, { width: CW - PHOTO_W - 10 });

    // ── Section a: STUDENT ────────────────────────────────────────
    y = P2_T + PHOTO_H + 12;
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('a.   STUDENT', L, y);

    y += 14;
    const ROW_H   = 20;
    const LABEL_W = 105;
    const TABLE_W = CW;

    tableRow(doc, L, y,              LABEL_W, TABLE_W, ROW_H, 'Name',        student.name || '');
    tableRow(doc, L, y + ROW_H,      LABEL_W, TABLE_W, ROW_H, 'Student ID',  studentProfile?.student_id || '');
    tableRow(doc, L, y + ROW_H * 2,  LABEL_W, TABLE_W, ROW_H, 'Program',     studentProfile?.programme || '');
    tableRow(doc, L, y + ROW_H * 3,  LABEL_W, TABLE_W, ROW_H, 'E-mail',      student.email || '');
    tableRow(doc, L, y + ROW_H * 4,  LABEL_W, TABLE_W, ROW_H, 'Contact',     '');
    y += ROW_H * 5;

    // ── Section b: SUPERVISOR & CO-SUPERVISOR ─────────────────────
    y += 14;
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('b.   SUPERVISOR & CO-SUPERVISOR', L, y);

    y += 14;
    // Sub-header row: empty label | SUPERVISOR | CO-SUPERVISOR (IF ANY)
    const SUP_LABEL_W = 105;
    const SUP_COL_W   = (TABLE_W - SUP_LABEL_W) / 2;

    rect(doc, L,                          y, SUP_LABEL_W, ROW_H);
    rect(doc, L + SUP_LABEL_W,            y, SUP_COL_W,   ROW_H);
    rect(doc, L + SUP_LABEL_W + SUP_COL_W, y, SUP_COL_W, ROW_H);

    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('SUPERVISOR', L + SUP_LABEL_W + 5, y + (ROW_H - 9) / 2 + 1, { width: SUP_COL_W - 10, align: 'center' });
    doc.text('CO-SUPERVISOR (IF ANY)', L + SUP_LABEL_W + SUP_COL_W + 5, y + (ROW_H - 9) / 2 + 1, { width: SUP_COL_W - 10, align: 'center' });

    y += ROW_H;

    const supData = [
      ['Name',               supervisor.name  || '', ''],
      ['Faculty/Department', 'Comp. & Math. Sciences', ''],
      ['E-mail',             supervisor.email || '', ''],
      ['Contact',            '',                     ''],
    ];

    supData.forEach(([label, sup, co]) => {
      rect(doc, L,                           y, SUP_LABEL_W, ROW_H);
      rect(doc, L + SUP_LABEL_W,             y, SUP_COL_W,   ROW_H);
      rect(doc, L + SUP_LABEL_W + SUP_COL_W, y, SUP_COL_W,  ROW_H);

      doc.font('Helvetica').fontSize(9).fillColor(BLACK);
      doc.text(label, L + 5,                         y + (ROW_H - 9) / 2 + 1, { width: SUP_LABEL_W - 10,  lineBreak: false });
      doc.text(sup,   L + SUP_LABEL_W + 5,           y + (ROW_H - 9) / 2 + 1, { width: SUP_COL_W - 10,   lineBreak: false });
      doc.text(co,    L + SUP_LABEL_W + SUP_COL_W + 5, y + (ROW_H - 9) / 2 + 1, { width: SUP_COL_W - 10, lineBreak: false });
      y += ROW_H;
    });

    // ── Section c: PROJECT ────────────────────────────────────────
    y += 14;
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('c.   PROJECT', L, y);

    y += 14;
    tableRow(doc, L, y,         LABEL_W, TABLE_W, ROW_H,     'Project Area',  '');
    tableRow(doc, L, y + ROW_H, LABEL_W, TABLE_W, ROW_H + 8, 'Project Title', title || '');
    y += ROW_H * 2 + 8;

    // ── Section d: AGREEMENT ──────────────────────────────────────
    y += 14;
    doc.fontSize(11).fillColor(BLACK).font('Helvetica-Bold')
      .text('d.   AGREEMENT (terms and conditions apply)', L, y);

    // i. SUPERVISOR
    y += 16;
    const IND = L + 20; // indent for sub-sections
    doc.fontSize(10).fillColor(BLACK).font('Helvetica-Bold')
      .text('i.   SUPERVISOR', IND, y);
    y += 13;
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica')
      .text('I hereby agree to supervise the above mentioned student.', IND, y, { width: CW - 20 });
    y += 24;

    // Signature layout: LABEL: ___sig_line___   DATE: ___date_line___
    // Sig line starts right after label, DATE comes after sig line
    const AGR_SIG_LINE_W  = 140; // signature underline length
    const AGR_DATE_LINE_W = 120; // date underline length

    // SUPERVISOR row
    const SUP_LABEL_END   = IND + 70;   // "SUPERVISOR:" ~70pt wide
    const SUP_SIG_END     = SUP_LABEL_END + AGR_SIG_LINE_W;
    const SUP_DATE_X      = SUP_SIG_END + 16;
    const SUP_DATE_LINE_X = SUP_DATE_X + 38;

    doc.fontSize(9).fillColor(BLACK).font('Helvetica').text('SUPERVISOR:', IND, y);
    doc.moveTo(SUP_LABEL_END, y + 12).lineTo(SUP_SIG_END, y + 12).lineWidth(0.75).strokeColor(BLACK).stroke();
    doc.text('DATE:', SUP_DATE_X, y);
    doc.moveTo(SUP_DATE_LINE_X, y + 12).lineTo(SUP_DATE_LINE_X + AGR_DATE_LINE_W, y + 12).stroke();
    y += 16;
    doc.fontSize(8).fillColor('#555').font('Helvetica')
      .text('(Signature)', IND + 70 + AGR_SIG_LINE_W / 2 - 20, y);

    y += 24;
    // CO-SUPERVISOR row
    const CO_LABEL_END   = IND + 84;
    const CO_SIG_END     = CO_LABEL_END + AGR_SIG_LINE_W;
    const CO_DATE_X      = CO_SIG_END + 16;
    const CO_DATE_LINE_X = CO_DATE_X + 38;

    doc.fontSize(9).fillColor(BLACK).font('Helvetica').text('CO-SUPERVISOR:', IND, y);
    doc.moveTo(CO_LABEL_END, y + 12).lineTo(CO_SIG_END, y + 12).lineWidth(0.75).strokeColor(BLACK).stroke();
    doc.text('DATE:', CO_DATE_X, y);
    doc.moveTo(CO_DATE_LINE_X, y + 12).lineTo(CO_DATE_LINE_X + AGR_DATE_LINE_W, y + 12).stroke();
    y += 16;
    doc.fontSize(8).fillColor('#555').font('Helvetica')
      .text('(Signature)', IND + 84 + AGR_SIG_LINE_W / 2 - 20, y);

    // ii. STUDENT
    y += 24;
    doc.fontSize(10).fillColor(BLACK).font('Helvetica-Bold')
      .text('ii.  STUDENT', IND, y);
    y += 13;
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica')
      .text('I hereby agree to be supervised by the above mentioned lecturer and that the project will be\nthe sole property of UiTM Malaysia.', IND, y, { width: CW - 20 });
    y += 34;

    const STU_LABEL_END   = IND + 54;
    const STU_SIG_END     = STU_LABEL_END + AGR_SIG_LINE_W;
    const STU_DATE_X      = STU_SIG_END + 16;
    const STU_DATE_LINE_X = STU_DATE_X + 38;

    doc.fontSize(9).fillColor(BLACK).font('Helvetica').text('STUDENT:', IND, y);
    doc.moveTo(STU_LABEL_END, y + 12).lineTo(STU_SIG_END, y + 12).lineWidth(0.75).strokeColor(BLACK).stroke();
    doc.text('DATE:', STU_DATE_X, y);
    doc.moveTo(STU_DATE_LINE_X, y + 12).lineTo(STU_DATE_LINE_X + AGR_DATE_LINE_W, y + 12).stroke();
    y += 16;
    doc.fontSize(8).fillColor('#555').font('Helvetica')
      .text('(Signature)', IND + 54 + AGR_SIG_LINE_W / 2 - 20, y);

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

export function generateProgressReport({ student, supervisor, submissions, meetings }) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `progress_report_${student.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).fillColor('#8B0000').text('Universiti Teknologi MARA (UiTM)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#1E3A5F').text('FYP Progress Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000000');
    doc.text(`Student: ${student.name} (${student.email})`);
    doc.text(`Supervisor: ${supervisor.name}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Submissions');
    doc.fontSize(10);
    if (submissions && submissions.length > 0) {
      submissions.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.title} - ${s.submission_type} (${s.status}) - ${new Date(s.submitted_at).toLocaleDateString()}`);
      });
    } else {
      doc.text('No submissions yet.');
    }
    doc.moveDown(2);

    doc.fontSize(14).text('Meetings');
    doc.fontSize(10);
    if (meetings && meetings.length > 0) {
      meetings.forEach((m, i) => {
        doc.text(`${i + 1}. ${m.meeting_date} ${m.meeting_time} - ${m.location || 'N/A'} (${m.status})`);
      });
    } else {
      doc.text('No meetings logged yet.');
    }

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F2 / F3 / F4 — Evaluation Form
// ─────────────────────────────────────────────────────────────────────────────
const EVAL_FORM_TITLES = {
  F2: 'F2 – PROJECT MOTIVATION EVALUATION FORM',
  F3: 'F3– LITERATURE REVIEW EVALUATION FORM',
  F4: 'F4 – METHODOLOGY EVALUATION FORM',
};


export function generateEvaluationForm({
  formType,
  student,
  studentProfile,
  supervisorName,
  evaluatorName,
  projectTitle,
  rubric,
  criteriaScores,
  totalMarks,
  date,
}) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `${formType}_evaluation_${student.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const PW    = doc.page.width;
    const L     = 45;
    const R     = PW - 40;
    const CW    = R - L;
    const BLACK = '#000000';
    const DARK  = '#2d2d2d';
    const WHITE = '#ffffff';

    const scoreMap = {};
    (criteriaScores || []).forEach(({ criterion_index, score }) => {
      scoreMap[criterion_index] = score;
    });

    // ── Form title ────────────────────────────────────────────────
    let y = 30;
    doc.fontSize(13).fillColor(BLACK).font('Helvetica-Bold')
      .text(EVAL_FORM_TITLES[formType] || formType, L, y, { width: CW, align: 'center' });

    // ── Student info table ────────────────────────────────────────
    y += 28;
    const ROW_H = 22;
    const HALF  = CW / 2;

    // Row 1: STUDENT NAME | STUDENT ID (side by side)
    const NAME_LBL_W = 92;
    const ID_LBL_W   = 70;
    rect(doc, L,                       y, NAME_LBL_W,          ROW_H);
    rect(doc, L + NAME_LBL_W,          y, HALF - NAME_LBL_W,   ROW_H);
    rect(doc, L + HALF,                y, ID_LBL_W,            ROW_H);
    rect(doc, L + HALF + ID_LBL_W,     y, HALF - ID_LBL_W,     ROW_H);

    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('STUDENT NAME', L + 4, y + 6, { width: NAME_LBL_W - 6, lineBreak: false });
    doc.font('Helvetica')
      .text(student.name || '', L + NAME_LBL_W + 4, y + 6,
        { width: HALF - NAME_LBL_W - 6, lineBreak: false });
    doc.font('Helvetica-Bold')
      .text('STUDENT ID', L + HALF + 4, y + 6, { width: ID_LBL_W - 6, lineBreak: false });
    doc.font('Helvetica')
      .text(studentProfile?.student_id || '', L + HALF + ID_LBL_W + 4, y + 6,
        { width: HALF - ID_LBL_W - 6, lineBreak: false });

    y += ROW_H;

    // Rows 2-4: full-width label+value
    const LBL_W = 92;
    const infoRows = [
      ['PROGRAM',       studentProfile?.programme || ''],
      ['SUPERVISOR',    supervisorName || ''],
      ['PROJECT TITLE', projectTitle || ''],
    ];
    infoRows.forEach(([label, val]) => {
      rect(doc, L, y, LBL_W, ROW_H);
      rect(doc, L + LBL_W, y, CW - LBL_W, ROW_H);
      doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
        .text(label, L + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica')
        .text(val, L + LBL_W + 4, y + 6, { width: CW - LBL_W - 6, lineBreak: false });
      y += ROW_H;
    });

    // ── Assessment criteria table ─────────────────────────────────
    y += 16;
    const WEIGHT_W = 46;
    const SCORE_W  = 80;
    const MARKS_W  = 56;
    const CRIT_W   = CW - WEIGHT_W - SCORE_W - MARKS_W;
    const HDR_H2   = 44;
    const CRIT_H   = 32;

    // Header
    rect(doc, L,                              y, CRIT_W,   HDR_H2);
    rect(doc, L + CRIT_W,                     y, WEIGHT_W, HDR_H2);
    rect(doc, L + CRIT_W + WEIGHT_W,          y, SCORE_W,  HDR_H2);
    rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W, HDR_H2);

    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('Assessment Criteria', L + 4, y + HDR_H2 / 2 - 6, { width: CRIT_W - 6 });

    const scoreRange = rubric?.[0]
      ? `[${rubric[0].score_min}-${rubric[0].score_max}]`
      : '[1-10]';

    [
      { label: 'Weight\n(W)',                              x: L + CRIT_W,                      w: WEIGHT_W },
      { label: `Score (S)\n${scoreRange}\n(Refer to\nrubric)`, x: L + CRIT_W + WEIGHT_W,       w: SCORE_W  },
      { label: 'Marks\n(W*S)',                             x: L + CRIT_W + WEIGHT_W + SCORE_W, w: MARKS_W  },
    ].forEach(({ label, x, w }) => {
      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
        .text(label, x + 3, y + 4, { width: w - 6, align: 'center' });
    });

    y += HDR_H2;

    // Criteria rows
    (rubric || []).forEach((criterion, i) => {
      const score = scoreMap[i] !== undefined ? scoreMap[i] : '';
      const marks = score !== '' && criterion.weight
        ? (criterion.weight * Number(score)).toFixed(1)
        : '';

      rect(doc, L,                               y, CRIT_W,   CRIT_H);
      rect(doc, L + CRIT_W,                      y, WEIGHT_W, CRIT_H);
      rect(doc, L + CRIT_W + WEIGHT_W,           y, SCORE_W,  CRIT_H);
      rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W,  CRIT_H);

      doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
        .text(`${i + 1}.  ${criterion.name}`, L + 4, y + 4, { width: CRIT_W - 8 });
      if (criterion.description) {
        doc.fontSize(7.5).fillColor('#444444').font('Helvetica')
          .text(`(${criterion.description})`, L + 4, doc.y + 1, { width: CRIT_W - 8 });
      }

      doc.fontSize(9).fillColor(BLACK).font('Helvetica')
        .text(String(criterion.weight), L + CRIT_W + 3, y + 11, { width: WEIGHT_W - 6, align: 'center' });

      if (score !== '') {
        doc.font('Helvetica-Bold')
          .text(String(score), L + CRIT_W + WEIGHT_W + 3, y + 11, { width: SCORE_W - 6, align: 'center' });
      }
      if (marks !== '') {
        doc.font('Helvetica-Bold')
          .text(String(marks), L + CRIT_W + WEIGHT_W + SCORE_W + 3, y + 11, { width: MARKS_W - 6, align: 'center' });
      }

      y += CRIT_H;
    });

    // Total row
    rect(doc, L,                               y, CRIT_W,   ROW_H);
    rect(doc, L + CRIT_W,                      y, WEIGHT_W, ROW_H);
    rect(doc, L + CRIT_W + WEIGHT_W,           y, SCORE_W,  ROW_H);
    rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W,  ROW_H);

    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('Total', L + 4, y + 6, { width: CRIT_W - 8 });
    if (totalMarks !== undefined && totalMarks !== null && totalMarks !== '') {
      doc.text(Number(totalMarks).toFixed(1),
        L + CRIT_W + WEIGHT_W + SCORE_W + 3, y + 6, { width: MARKS_W - 6, align: 'center' });
    }

    y += ROW_H;

    // ── Signature block ───────────────────────────────────────────
    y += 30;
    const SIG_W = CW / 3;
    const labels = ["Lecturer's Name", 'Signature', 'Date'];

    labels.forEach((lbl, i) => {
      const sx = L + i * SIG_W;
      doc.fontSize(8.5).fillColor(BLACK).font('Helvetica')
        .text(lbl, sx, y, { width: SIG_W - 6 });
    });

    y += 18;
    labels.forEach((lbl, i) => {
      const sx = L + i * SIG_W;
      doc.moveTo(sx, y).lineTo(sx + SIG_W - 12, y).lineWidth(0.75).strokeColor(BLACK).stroke();
      if (lbl === "Lecturer's Name" && evaluatorName) {
        doc.fontSize(9).fillColor(BLACK).font('Helvetica')
          .text(evaluatorName, sx, y + 3, { width: SIG_W - 12, lineBreak: false });
      }
      if (lbl === 'Date' && date) {
        const d = date instanceof Date ? date : new Date(date);
        doc.fontSize(9).fillColor(BLACK).font('Helvetica')
          .text(d.toLocaleDateString('en-MY'), sx, y + 3, { width: SIG_W - 12, lineBreak: false });
      }
    });

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F5 – Proposal/Project In-Progress Form
// ─────────────────────────────────────────────────────────────────────────────
export function generateF5Form({
  student,
  studentProfile,
  supervisorName,
  projectTitle,
  meetings,
}) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `F5_inprogress_${student.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const PW    = doc.page.width;
    const PH    = doc.page.height;
    const L     = 45;
    const R     = PW - 40;
    const CW    = R - L;
    const BLACK = '#000000';
    const DARK  = '#2d2d2d';
    const WHITE = '#ffffff';

    const drawPageHeader = (continued = false) => {
      const titleY = 30;
      doc.fontSize(13).fillColor(BLACK).font('Helvetica-Bold')
        .text('F5 – PROPOSAL/PROJECT IN-PROGRESS FORM' + (continued ? ' (continued)' : ''),
          L, titleY, { width: CW, align: 'center' });
      return titleY + 18;
    };

    const drawInfoTable = (y) => {
      const ROW_H = 22;
      const LBL_W = 82;
      const HALF  = CW / 2;

      rect(doc, L, y, LBL_W, ROW_H);
      rect(doc, L + LBL_W, y, HALF - LBL_W, ROW_H);
      rect(doc, L + HALF, y, LBL_W, ROW_H);
      rect(doc, L + HALF + LBL_W, y, HALF - LBL_W, ROW_H);
      doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold').text('STUDENT NAME', L + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica').text(student.name || '', L + LBL_W + 4, y + 6, { width: HALF - LBL_W - 6, lineBreak: false });
      doc.font('Helvetica-Bold').text('STUDENT ID', L + HALF + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica').text(studentProfile?.student_id || '', L + HALF + LBL_W + 4, y + 6, { width: HALF - LBL_W - 6, lineBreak: false });
      y += ROW_H;

      rect(doc, L, y, LBL_W, ROW_H);
      rect(doc, L + LBL_W, y, HALF - LBL_W, ROW_H);
      rect(doc, L + HALF, y, LBL_W, ROW_H);
      rect(doc, L + HALF + LBL_W, y, HALF - LBL_W, ROW_H);
      doc.font('Helvetica-Bold').text('PROGRAM', L + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica').text(studentProfile?.programme || '', L + LBL_W + 4, y + 6, { width: HALF - LBL_W - 6, lineBreak: false });
      doc.font('Helvetica-Bold').text('SUPERVISOR', L + HALF + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica').text(supervisorName || '', L + HALF + LBL_W + 4, y + 6, { width: HALF - LBL_W - 6, lineBreak: false });
      y += ROW_H;

      rect(doc, L, y, LBL_W, ROW_H);
      rect(doc, L + LBL_W, y, CW - LBL_W, ROW_H);
      doc.font('Helvetica-Bold').text('TITLE', L + 4, y + 6, { width: LBL_W - 6, lineBreak: false });
      doc.font('Helvetica').text(projectTitle || '', L + LBL_W + 4, y + 6, { width: CW - LBL_W - 6, lineBreak: false });
      y += ROW_H;

      return y;
    };

    const DATE_W = 62;
    const ACT_W  = Math.floor((CW - DATE_W) * 0.44);
    const CMT_W  = Math.floor((CW - DATE_W) * 0.39);
    const SIG_W  = CW - DATE_W - ACT_W - CMT_W;
    const MEET_H = 60;
    const HDR_H2 = 24;
    const BOTTOM = PH - 40;

    const drawTableHeader = (y) => {
      rect(doc, L, y, DATE_W, HDR_H2);
      rect(doc, L + DATE_W, y, ACT_W, HDR_H2);
      rect(doc, L + DATE_W + ACT_W, y, CMT_W, HDR_H2);
      rect(doc, L + DATE_W + ACT_W + CMT_W, y, SIG_W, HDR_H2);

      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
        .text('DATE OF\nMEETING', L + 2, y + 4, { width: DATE_W - 4, align: 'center' });
      doc.text('COMPLETED ACTIVITY', L + DATE_W + 4, y + 8, { width: ACT_W - 8 });
      doc.text('SUPERVISOR/CO-SUPERVISOR\nNEXT ACTIVITY/COMMENT', L + DATE_W + ACT_W + 4, y + 4, { width: CMT_W - 8 });
      doc.text('SIGNATURE', L + DATE_W + ACT_W + CMT_W + 4, y + 8, { width: SIG_W - 8 });

      return y + HDR_H2;
    };

    // First page
    let y = drawPageHeader(false);
    y = drawInfoTable(y + 4);
    y = drawTableHeader(y + 6);

    const rows = meetings.length > 0 ? meetings : [null]; // at least one empty row
    for (const meeting of rows) {
      if (y + MEET_H > BOTTOM) {
        doc.addPage();
        y = drawPageHeader(true);
        y = drawInfoTable(y + 4);
        y = drawTableHeader(y + 6);
      }

      rect(doc, L, y, DATE_W, MEET_H);
      rect(doc, L + DATE_W, y, ACT_W, MEET_H);
      rect(doc, L + DATE_W + ACT_W, y, CMT_W, MEET_H);
      rect(doc, L + DATE_W + ACT_W + CMT_W, y, SIG_W, MEET_H);

      if (meeting) {
        doc.fontSize(8.5).fillColor(BLACK).font('Helvetica')
          .text(meeting.meeting_date || '', L + 2, y + 6, { width: DATE_W - 4, align: 'center' });
        doc.text(meeting.completed_activity || '', L + DATE_W + 4, y + 5, { width: ACT_W - 8, height: MEET_H - 10 });
        doc.text(meeting.supervisor_notes || '', L + DATE_W + ACT_W + 4, y + 5, { width: CMT_W - 8, height: MEET_H - 10 });

        if (meeting.supervisor_signature_img) {
          try {
            const b64 = meeting.supervisor_signature_img.replace(/^data:image\/\w+;base64,/, '');
            const buf = Buffer.from(b64, 'base64');
            doc.image(buf, L + DATE_W + ACT_W + CMT_W + 4, y + 4,
              { fit: [SIG_W - 8, MEET_H - 8] });
          } catch {}
        }
      }

      y += MEET_H;
    }

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

// ── F6(a) / F6(b) – Report Submission Form ──────────────────────────────────
export function generateF6Form({ f6, student, studentProfile, supervisorName, projectTitle }) {
  ensureDir(DOCUMENTS_DIR);
  const isB    = f6.phase === 'CSP650';
  const label  = isB ? 'F6b' : 'F6a';
  const filename = `${label}_${student.id}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const PW    = doc.page.width;   // 595.28
    const PH    = doc.page.height;  // 841.89
    const L     = 45;
    const R     = PW - 40;
    const CW    = R - L;            // ~510
    const BLACK = '#000000';
    const DARK  = '#2d2d2d';
    const WHITE = '#ffffff';

    // ── Form title ───────────────────────────────────────────────────
    let y = 30;
    const formTitle = isB
      ? 'F6(b) – PROJECT REPORT SUBMISSION FORM'
      : 'F6(a) – PROJECT FORMULATION REPORT SUBMISSION FORM';
    doc.fontSize(14).fillColor(BLACK).font('Helvetica-Bold')
      .text(formTitle, L, y, { width: CW, align: 'center' });

    // ── Instructions block ───────────────────────────────────────────
    y += 22;
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica-Bold')
      .text('Instructions to the student:', L, y);
    y += 14;

    const base = isB ? 4 : 0;
    const instructions = [
      `Ensure that the information needed in the form is completed before submission to the ${isB ? 'CSP650' : 'CSP600'} lecturer.`,
      'Obtain the endorsement of the Supervisor that the report has been screened for plagiarism.',
      'Please attach the original Plagiarism Report.',
      'Only a completed form will be processed.',
    ];
    doc.font('Helvetica').fontSize(9.5);
    instructions.forEach((text, i) => {
      doc.text(`${base + i + 1}.  ${text}`, L + 10, y, { width: CW - 10 });
      y = doc.y + 3;
    });

    // ── Student info table ───────────────────────────────────────────
    y += 8;
    const ROW_H   = 22;
    const LABEL_W = 130;  // wide enough for "CO-SUPERVISOR (IF ANY)"
    const TABLE_W = CW;
    const HALF    = TABLE_W / 2;

    // Row 1: STUDENT NAME (left half) | STUDENT ID (right half)
    rect(doc, L,                    y, LABEL_W,         ROW_H);
    rect(doc, L + LABEL_W,          y, HALF - LABEL_W,  ROW_H);
    rect(doc, L + HALF,             y, LABEL_W,         ROW_H);
    rect(doc, L + HALF + LABEL_W,   y, HALF - LABEL_W,  ROW_H);
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('STUDENT NAME', L + 5, y + (ROW_H - 9) / 2 + 1, { width: LABEL_W - 8, lineBreak: false });
    doc.font('Helvetica')
      .text(student.name || '', L + LABEL_W + 5, y + (ROW_H - 9) / 2 + 1, { width: HALF - LABEL_W - 8, lineBreak: false });
    doc.font('Helvetica-Bold')
      .text('STUDENT ID', L + HALF + 5, y + (ROW_H - 9) / 2 + 1, { width: LABEL_W - 8, lineBreak: false });
    doc.font('Helvetica')
      .text(studentProfile?.student_id || '', L + HALF + LABEL_W + 5, y + (ROW_H - 9) / 2 + 1, { width: HALF - LABEL_W - 8, lineBreak: false });
    y += ROW_H;

    // Remaining single-column rows
    const singleRows = [
      ['PROGRAM',                studentProfile?.programme || ''],
      ['SUPERVISOR',             supervisorName || ''],
      ['CO-SUPERVISOR\n(IF ANY)', ''],
      ['PROJECT TITLE',          projectTitle || ''],
      ['HANDOVER DATE',          f6.handover_date || ''],
    ];
    singleRows.forEach(([lbl, val]) => {
      const isMultiLine = lbl.includes('\n');
      const rh = isMultiLine ? ROW_H * 1.5 : ROW_H;
      tableRow(doc, L, y, LABEL_W, TABLE_W, rh, lbl, val);
      y += rh;
    });

    // STUDENT'S SIGNATURE row — taller to hold signature image
    const SIG_ROW_H = 52;
    tableRow(doc, L, y, LABEL_W, TABLE_W, SIG_ROW_H, "STUDENT'S\nSIGNATURE", '');
    if (student.signature) {
      try {
        const b64 = student.signature.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(b64, 'base64');
        doc.image(buf, L + LABEL_W + 6, y + 4, { fit: [160, SIG_ROW_H - 8] });
      } catch {}
    }
    y += SIG_ROW_H;

    // ── Supervisor endorsement ───────────────────────────────────────
    y += 16;
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica')
      .text('The student is required to get the endorsement of the Supervisor:', L, y, { width: CW });
    y += 16;
    doc.fontSize(9.5)
      .text(
        'I certify that this Final Year Project report has been screened for plagiarism and the original\nplagiarism report is enclosed.',
        L, y, { width: CW }
      );
    y = doc.y + 10;

    // SI line
    doc.fontSize(9.5).font('Helvetica')
      .text('Similarity index:', L, y, { continued: true })
      .font('Helvetica-Bold')
      .text(`  ${f6.similarity_index != null ? f6.similarity_index + '%' : '_______'}`, { continued: false });
    y = doc.y + 6;

    // AI line (new field)
    doc.fontSize(9.5).font('Helvetica')
      .text('AI Detection result:', L, y, { continued: true })
      .font('Helvetica-Bold')
      .text(`  ${f6.ai_index != null ? f6.ai_index + '%' : '_______'}`, { continued: false });
    y = doc.y + 14;

    // "Endorsed by:" + supervisor signature block
    doc.fontSize(9.5).fillColor(BLACK).font('Helvetica')
      .text('Endorsed by:', L, y);
    y += 18;

    // Supervisor signature image area
    const SIG_IMG_W = 160;
    const SIG_IMG_H = 44;
    if (f6.supervisor_signature_img) {
      try {
        const b64 = f6.supervisor_signature_img.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(b64, 'base64');
        doc.image(buf, L, y, { fit: [SIG_IMG_W, SIG_IMG_H] });
      } catch {}
    }

    // SUPERVISOR: ____ DATE: ____
    const sigLineY = y + SIG_IMG_H + 4;
    const SLINE_W  = 160;
    const DATE_X   = L + SLINE_W + 60;
    const DLINE_W  = 120;

    doc.moveTo(L, sigLineY).lineTo(L + SLINE_W, sigLineY).lineWidth(0.75).strokeColor(BLACK).stroke();
    doc.moveTo(DATE_X + 40, sigLineY).lineTo(DATE_X + 40 + DLINE_W, sigLineY).lineWidth(0.75).strokeColor(BLACK).stroke();

    doc.fontSize(9).fillColor(BLACK).font('Helvetica').text('SUPERVISOR:', L, sigLineY + 3);
    doc.text('(Signature)', L, sigLineY + 14, { width: SLINE_W, align: 'center' });

    doc.text('DATE:', DATE_X, sigLineY + 3);
    if (f6.supervisor_signed_at) {
      doc.font('Helvetica-Bold')
        .text(new Date(f6.supervisor_signed_at).toLocaleDateString('en-MY'), DATE_X + 40, sigLineY + 3);
    }

    // ── Note at bottom ───────────────────────────────────────────────
    y = sigLineY + 36;
    doc.fontSize(9).fillColor(BLACK).font('Helvetica')
      .text('Note:', L, y, { continued: true })
      .font('Helvetica-Bold')
      .text('\nThe maximum percentage of the similarity index for plagiarism checking is 30%.', { continued: false });

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}

// ────────────────────────────────────────────────────────────────────────────
// F3/F4/F7/F8/F9/F10/F11/F13 — Evaluation form PDF matching original UiTM forms
// ────────────────────────────────────────────────────────────────────────────
export async function generateEvalForm({
  form, template, student, studentProfile, supervisorName, projectTitle, evaluatorName
}) {
  ensureDir(DOCUMENTS_DIR);
  const filename = `${form.form_type}_eval_${student.id}_${form.evaluator_id || 'coord'}_${Date.now()}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, filename);
  const relativePath = path.join('documents', filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const PW    = doc.page.width;   // 595.28
    const PH    = doc.page.height;  // 841.89
    const L     = 45;
    const R     = PW - 40;
    const CW    = R - L;            // ≈ 510
    const BLACK = '#000000';
    const DARK  = '#2d2d2d';
    const WHITE = '#ffffff';
    const ft    = form.form_type;

    const isCSP650     = ['F9', 'F10', 'F11', 'F13'].includes(ft);
    const isSupervisor = form.evaluator_role === 'supervisor';

    // Rubric table column widths — matches the 4-column original form layout
    const WEIGHT_W = 46;
    const SCORE_W  = 80;
    const MARKS_W  = 56;
    const CRIT_W   = CW - WEIGHT_W - SCORE_W - MARKS_W;  // ≈ 328

    // ── Internal helpers ──────────────────────────────────────────

    // Rubric table header — Assessment Criteria | Weight (W) | Score (S) … | Marks (W*S)
    function drawRubricHdr(y, scoreLabel, critLabel) {
      const H = 48;
      rect(doc, L,                              y, CRIT_W,   H);
      rect(doc, L + CRIT_W,                     y, WEIGHT_W, H);
      rect(doc, L + CRIT_W + WEIGHT_W,          y, SCORE_W,  H);
      rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W, H);
      doc.fontSize(9).fillColor(BLACK).font('Helvetica')
        .text(critLabel || 'Assessment Criteria', L + 5, y + H / 2 - 5, { width: CRIT_W - 8 });
      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
        .text('Weight\n(W)', L + CRIT_W + 3, y + 8, { width: WEIGHT_W - 6, align: 'center' });
      doc.fontSize(7.5).fillColor(BLACK).font('Helvetica-Bold')
        .text(scoreLabel, L + CRIT_W + WEIGHT_W + 3, y + 5, { width: SCORE_W - 6, align: 'center' });
      doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
        .text('Marks\n(W*S)', L + CRIT_W + WEIGHT_W + SCORE_W + 3, y + 8, { width: MARKS_W - 6, align: 'center' });
      return y + H;
    }

    // Single criterion row — returns new y
    function drawCritRow(num, c, scoreVal, y) {
      // Estimate row height from content
      doc.font('Helvetica-Bold').fontSize(9);
      const nameH = doc.heightOfString(`${num}.  ${c.name}`, { width: CRIT_W - 10 });
      doc.font('Helvetica').fontSize(8);
      const descH = c.description ? doc.heightOfString(`(${c.description})`, { width: CRIT_W - 10 }) : 0;
      const rh = Math.max(40, nameH + descH + 10);

      if (y + rh > PH - 80) { doc.addPage(); y = 30; }

      rect(doc, L,                              y, CRIT_W,   rh);
      rect(doc, L + CRIT_W,                     y, WEIGHT_W, rh);
      rect(doc, L + CRIT_W + WEIGHT_W,          y, SCORE_W,  rh);
      rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W, rh);

      // Criterion name — bold, underlined per original
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text(`${num}.  ${c.name}`, L + 5, y + 6, { width: CRIT_W - 10, underline: true });
      if (c.description) {
        doc.font('Helvetica').fontSize(8).fillColor(BLACK)
          .text(`(${c.description})`, L + 5, doc.y + 1, { width: CRIT_W - 10 });
      }

      // Weight value
      doc.font('Helvetica').fontSize(10).fillColor(BLACK)
        .text(String(c.weight), L + CRIT_W + 3, y + rh / 2 - 6, { width: WEIGHT_W - 6, align: 'center', lineBreak: false });

      // Score and marks (only if scored)
      if (scoreVal) {
        doc.font('Helvetica').fontSize(10).fillColor(BLACK)
          .text(String(scoreVal), L + CRIT_W + WEIGHT_W + 3, y + rh / 2 - 6, { width: SCORE_W - 6, align: 'center', lineBreak: false });
        doc.font('Helvetica').fontSize(10).fillColor(BLACK)
          .text((c.weight * scoreVal).toFixed(1), L + CRIT_W + WEIGHT_W + SCORE_W + 3, y + rh / 2 - 6, { width: MARKS_W - 6, align: 'center', lineBreak: false });
      }

      return y + rh;
    }

    // Total row — label in criteria col, total score in marks col
    function drawTotalRow(y, label, totalVal) {
      const rh = 22;
      rect(doc, L,                              y, CRIT_W,   rh);
      rect(doc, L + CRIT_W,                     y, WEIGHT_W, rh);
      rect(doc, L + CRIT_W + WEIGHT_W,          y, SCORE_W,  rh);
      rect(doc, L + CRIT_W + WEIGHT_W + SCORE_W, y, MARKS_W, rh);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text(label, L + 5, y + (rh - 9) / 2 + 1, { width: CRIT_W - 8, lineBreak: false });
      if (totalVal) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
          .text(String(totalVal), L + CRIT_W + WEIGHT_W + SCORE_W + 3, y + (rh - 9) / 2 + 1, { width: MARKS_W - 6, align: 'center', lineBreak: false });
      }
      return y + rh;
    }

    // Percentage row spanning the FULL table width (CW), split into N equal cells
    function drawPctRow(y, pcts) {
      const rh = 18;
      const colW = CW / pcts.length;
      pcts.forEach((pct, i) => {
        rect(doc, L + i * colW, y, colW, rh);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
          .text(pct, L + i * colW + 3, y + (rh - 9) / 2 + 1, { width: colW - 6, align: 'center', lineBreak: false });
      });
      return y + rh;
    }

    // Comments box (outside the main table) — "Comments" label line + empty body
    function drawCommentsBox(y, label) {
      const lblH = 18;
      const bodyH = 40;
      rect(doc, L, y, CW, lblH);
      doc.font('Helvetica').fontSize(9).fillColor(BLACK)
        .text(label || 'Comments', L + 5, y + (lblH - 9) / 2 + 1, { width: CW - 8, lineBreak: false });
      rect(doc, L, y + lblH, CW, bodyH);
      if (form.comments) {
        doc.font('Helvetica').fontSize(8).fillColor(BLACK)
          .text(form.comments, L + 5, y + lblH + 4, { width: CW - 10, height: bodyH - 8 });
      }
      return y + lblH + bodyH;
    }

    // Boxed signature block: [Name label | Date:] then [Signature:]
    function drawBoxedSig(y, nameLabel) {
      const nameW = CW * 0.65;
      const dateW = CW - nameW;
      const topH  = 30;
      const sigH  = 45;

      rect(doc, L, y, nameW, topH);
      rect(doc, L + nameW, y, dateW, topH);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text(nameLabel, L + 5, y + (topH - 9) / 2 + 1, { width: nameW - 8, lineBreak: false });
      if (evaluatorName) {
        doc.font('Helvetica').fontSize(9).fillColor(BLACK)
          .text(evaluatorName, L + 5, y + topH / 2 + 3, { width: nameW - 8, lineBreak: false });
      }
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text('Date:', L + nameW + 5, y + (topH - 9) / 2 + 1, { width: dateW - 8, lineBreak: false });
      if (form.signed_at) {
        doc.font('Helvetica').fontSize(9).fillColor(BLACK)
          .text(new Date(form.signed_at).toLocaleDateString('en-MY'), L + nameW + 42, y + (topH - 9) / 2 + 1, { width: dateW - 50, lineBreak: false });
      }
      y += topH;

      rect(doc, L, y, CW, sigH);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
        .text('Signature:', L + 5, y + 5, { width: CW - 8, lineBreak: false });
      if (form.signature_img) {
        try {
          const b64 = form.signature_img.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(b64, 'base64');
          doc.image(buf, L + 5, y + 16, { fit: [140, sigH - 20] });
        } catch {}
      }
      return y + sigH;
    }

    // 3-column signature for F3/F4: Lecturer's Name | Signature | Date (underlines)
    function drawThreeColSig(y) {
      const colW = CW / 3;
      ['Lecturer\'s Name', 'Signature', 'Date'].forEach((lbl, i) => {
        doc.font('Helvetica').fontSize(9).fillColor(BLACK)
          .text(lbl, L + i * colW, y, { width: colW - 6 });
      });
      y += 20;
      [0, 1, 2].forEach(i => {
        const sx = L + i * colW;
        doc.moveTo(sx, y).lineTo(sx + colW - 16, y).lineWidth(0.75).strokeColor(BLACK).stroke();
      });
      return y + 10;
    }

    // ── Score column header label per form ────────────────────────
    const SCORE_HDRS = {
      F3:  'Score\n(S)\n[0-10]\n(Refer to rubric)',
      F4:  'Score\n(S)\n[1-10]\n(Refer to\nrubric)',
      F7:  'Score (s)\n[1-10]\n(refer to F7\nrubric)',
      F8:  'Score\n(S)\n[0-10]\n(refer to F8\nrubric)',
      F9:  'Score\n(S)\n[1-10]\n(**Refer\nrubric)',
      F10: 'Score\n(S)\n[1-10]\n(**Refer\nrubric)',
      F11: 'Score\n(S)\n(0-10)\n(**Refer\nrubric)',
      F13: 'Score (s)\n[1-10]\n(refer to\nF13 rubric)',
    };

    // ── Form title ────────────────────────────────────────────────
    const TITLES = {
      F3:  'F3– LITERATURE REVIEW EVALUATION FORM',
      F4:  'F4 – METHODOLOGY EVALUATION FORM',
      F7:  'F7 — PROJECT FORMULATION PRESENTATION FORM',
      F8:  'F8 – PROJECT FORMULATION REPORT EVALUATION FORM',
      F9:  'F9 – PROGRESS PROJECT PRESENTATION FORM',
      F10: 'F10 – FINAL PROJECT PRESENTATION FORM',
      F11: 'F11 – PROJECT REPORT EVALUATION FORM',
      F13: 'F13 – LEAN CANVAS MODEL EVALUATION FORM',
    };
    let y = 30;
    doc.fontSize(13).fillColor(BLACK).font('Helvetica-Bold')
      .text(TITLES[ft] || ft, L, y, { width: CW, align: 'center' });

    // ── Info table ────────────────────────────────────────────────
    y += 22;
    const ROW_H  = 22;
    const HALF   = CW / 2;
    const LBL_W  = 110;

    // Row 1: STUDENT NAME (left half) | STUDENT ID (right half)
    const NL = 100, IL = 80;
    rect(doc, L, y, NL, ROW_H);
    rect(doc, L + NL, y, HALF - NL, ROW_H);
    rect(doc, L + HALF, y, IL, ROW_H);
    rect(doc, L + HALF + IL, y, HALF - IL, ROW_H);
    doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
      .text('STUDENT NAME', L + 5, y + (ROW_H - 9) / 2 + 1, { width: NL - 8, lineBreak: false });
    doc.font('Helvetica')
      .text(student.name || '', L + NL + 5, y + (ROW_H - 9) / 2 + 1, { width: HALF - NL - 8, lineBreak: false });
    doc.font('Helvetica-Bold')
      .text('STUDENT ID', L + HALF + 5, y + (ROW_H - 9) / 2 + 1, { width: IL - 8, lineBreak: false });
    doc.font('Helvetica')
      .text(studentProfile?.student_id || '', L + HALF + IL + 5, y + (ROW_H - 9) / 2 + 1, { width: HALF - IL - 8, lineBreak: false });
    y += ROW_H;

    // Remaining info rows
    const infoRows = [['PROGRAM', studentProfile?.programme || '']];
    if (ft !== 'F13') infoRows.push(['SUPERVISOR', supervisorName || '']);
    infoRows.push(['PROJECT TITLE', projectTitle || '']);
    if (ft === 'F7') {
      const pd = form.presentation_date
        ? new Date(form.presentation_date).toLocaleDateString('en-MY') : '';
      infoRows.push(['PRESENTATION\nDATE', pd]);
    }
    if (ft === 'F8' || ft === 'F11') {
      infoRows.push(['HANDOVER DATE', '']);
    }

    infoRows.forEach(([lbl, val]) => {
      const isML = lbl.includes('\n');
      const rh = isML ? 34 : ROW_H;
      tableRow(doc, L, y, LBL_W, CW, rh, lbl, val);
      y += rh;
    });

    // ── Rubric table ──────────────────────────────────────────────
    y += 12;
    const scoreHdr = SCORE_HDRS[ft] || 'Score (S)\n[1-10]\n(Refer to\nrubric)';

    if (ft === 'F11') {
      // F11: CLO 1 table, then CLO 4 table
      const allCriteria = template.criteria;
      const clo1 = allCriteria.filter(c => c.group === 'CLO1' && (isSupervisor || !c.supervisor_only));
      const clo4 = allCriteria.filter(c => c.group === 'CLO4');

      // CLO 1 table
      y = drawRubricHdr(y, scoreHdr, 'Assessment Criteria\n(CLO 1)');
      let runNo = 1;
      let total1 = 0;
      for (const c of clo1) {
        const s = parseFloat(form.scores?.[c.id] ?? form.scores?.[String(c.id)] ?? 0);
        total1 += c.weight * s;
        y = drawCritRow(runNo++, c, s || null, y);
      }
      y = drawTotalRow(y, 'TOTAL CLO 1', total1 > 0 ? total1.toFixed(1) : '');
      y = drawPctRow(y, ['Supervisor (25%)', 'Examiner (20%)']);

      y += 10;

      // CLO 4 table
      y = drawRubricHdr(y, scoreHdr, 'Assessment Criteria\n(CLO 4)');
      let total4 = 0;
      for (const c of clo4) {
        const s = parseFloat(form.scores?.[c.id] ?? form.scores?.[String(c.id)] ?? 0);
        total4 += c.weight * s;
        y = drawCritRow(runNo++, c, s || null, y);
      }
      y = drawTotalRow(y, 'TOTAL CLO 4', total4 > 0 ? total4.toFixed(1) : '');
      y = drawPctRow(y, ['Supervisor (5%)', 'Examiner (5%)']);

      y += 10;
      y = drawCommentsBox(y, 'Comments:');
      y += 12;
      y = drawBoxedSig(y, 'Name of Supervisor/Examiner:');

    } else if (ft === 'F10') {
      // F10: criteria rows, Comments row inside table, percentage row inside table
      y = drawRubricHdr(y, scoreHdr);
      const criteria = template.criteria.filter(c => isSupervisor || !c.supervisor_only);
      let runNo = 1;
      for (const c of criteria) {
        const s = parseFloat(form.scores?.[c.id] ?? form.scores?.[String(c.id)] ?? 0);
        y = drawCritRow(runNo++, c, s || null, y);
      }

      // Comments row — spans full table width, inside the main table border
      const cH = 44;
      rect(doc, L, y, CW, cH);
      doc.font('Helvetica').fontSize(9).fillColor(BLACK)
        .text('Comments:', L + 5, y + 5, { width: CW - 8, lineBreak: false });
      if (form.comments) {
        doc.font('Helvetica').fontSize(8).fillColor(BLACK)
          .text(form.comments, L + 5, y + 17, { width: CW - 10, height: cH - 20 });
      }
      y += cH;

      // Percentage row — 2 equal halves, still inside table border
      y = drawPctRow(y, ['Supervisor (15%)', 'Examiner (15%)']);

      y += 12;
      y = drawBoxedSig(y, 'NAME OF LECTURER:');

    } else {
      // Standard: F3, F4, F7, F8, F9, F13
      y = drawRubricHdr(y, scoreHdr);
      const criteria = template.criteria.filter(c => isSupervisor || !c.supervisor_only);
      let runNo = 1;
      let total = 0;
      for (const c of criteria) {
        const s = parseFloat(form.scores?.[c.id] ?? form.scores?.[String(c.id)] ?? 0);
        total += c.weight * s;
        y = drawCritRow(runNo++, c, s || null, y);
      }
      y = drawTotalRow(y, 'Total:', total > 0 ? total.toFixed(1) : '');

      // Comments box (before percentage row for F7/F8, directly for F9)
      if (['F7', 'F8', 'F9'].includes(ft)) {
        y += 8;
        y = drawCommentsBox(y, ft === 'F9' ? 'Comments' : 'Comments');
      }

      // Percentage row (after comments for F7/F8)
      if (ft === 'F7') {
        y = drawPctRow(y, ['Lecturer CSP600 (10%)', 'Supervisor (10%)', 'Examiner (5%)']);
      } else if (ft === 'F8') {
        y = drawPctRow(y, ['Supervisor (30%)', 'Examiner (15%)']);
      }

      y += 12;

      // Signature block
      if (['F3', 'F4'].includes(ft)) {
        y += 10;
        drawThreeColSig(y);
      } else if (['F7', 'F8'].includes(ft)) {
        y = drawBoxedSig(y, 'Name of Supervisor/Examiner:');
      } else if (ft === 'F9') {
        y = drawBoxedSig(y, 'NAME OF LECTURER:');
      } else if (ft === 'F13') {
        y = drawBoxedSig(y, 'Name of Lecturer:');
      }
    }

    doc.end();
    stream.on('finish', () => resolve(relativePath));
    stream.on('error', reject);
  });
}
