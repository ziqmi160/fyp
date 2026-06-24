import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import {
  EvaluationForm, RubricTemplate, User, StudentProfile, ExaminerAssignment, Class
} from '../models/index.js';
import { generateEvalForm } from '../services/pdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the user_ids of every student in a coordinator's own classes.
async function getCoordinatorStudentIds(coordinatorId) {
  const classes = await Class.findAll({
    where: { coordinator_id: coordinatorId },
    include: [{ model: StudentProfile, as: 'students', attributes: ['user_id'] }]
  });
  return classes.flatMap(cls => cls.students.map(s => s.user_id));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function computeScores(criteria, scores, isSupervisor) {
  let total = 0;
  let maxTotal = 0;
  for (const c of criteria) {
    if (c.supervisor_only && !isSupervisor) continue;
    const s = parseFloat(scores?.[c.id] ?? 0);
    total += c.weight * s;
    maxTotal += c.weight * c.score_max;
  }
  return { total: parseFloat(total.toFixed(2)), maxTotal };
}

async function resolveEvaluatorRole(evaluatorId, studentId) {
  const profile = await StudentProfile.findOne({ where: { user_id: studentId } });
  if (profile?.current_supervisor_id === evaluatorId) return 'supervisor';
  // Check ExaminerAssignment (primary) or StudentProfile.examiner_id (fallback)
  const assignment = await ExaminerAssignment.findOne({
    where: { student_id: studentId, examiner_id: evaluatorId, status: 'active' }
  });
  if (assignment) return 'examiner';
  if (profile?.examiner_id === evaluatorId) return 'examiner';
  return null;
}

// ── GET /evaluation-forms/templates — all rubric templates (any auth'd user) ─
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await RubricTemplate.findAll({ order: [['form_type', 'ASC']] });
    res.json({ success: true, data: templates });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/templates/:formType ─────────────────────────────────
export const getRubricTemplate = async (req, res) => {
  try {
    const template = await RubricTemplate.findOne({ where: { form_type: req.params.formType } });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found.' });
    res.json({ success: true, data: template });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── PUT /evaluation-forms/templates/:formType — coordinator updates rubric ────
export const updateRubricTemplate = async (req, res) => {
  try {
    const template = await RubricTemplate.findOne({ where: { form_type: req.params.formType } });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found.' });
    const { criteria, name } = req.body;
    if (criteria) await template.update({ criteria });
    if (name) await template.update({ name });
    res.json({ success: true, data: template, message: 'Rubric template updated.' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/students — evaluable students for current user ──────
export const getEvaluableStudents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Supervisees
    const superviseeProfiles = await StudentProfile.findAll({
      where: { current_supervisor_id: userId },
      include: [{ model: User, as: 'studentUser', attributes: ['id', 'name'] }]
    });

    // Examinees via ExaminerAssignment (primary source)
    const assignments = await ExaminerAssignment.findAll({
      where: { examiner_id: userId, status: 'active' },
      include: [{ model: User, as: 'student', attributes: ['id', 'name'] }]
    });

    // Examinees via StudentProfile.examiner_id (fallback — covers legacy data)
    const examineesViaProfile = await StudentProfile.findAll({
      where: { examiner_id: userId },
      include: [{ model: User, as: 'studentUser', attributes: ['id', 'name'] }]
    });

    const students = [];

    for (const p of superviseeProfiles) {
      students.push({ id: p.user_id, name: p.studentUser.name, role: 'supervisor', phase: p.current_phase || 'CSP600', student_id: p.student_id });
    }

    // Collect all examinees IDs from both sources
    const examineeUserIds = new Set([
      ...assignments.map(a => a.student_id),
      ...examineesViaProfile.map(p => p.user_id),
    ]);

    for (const examId of examineeUserIds) {
      // Skip students already added as supervisor role to avoid duplicates
      if (students.some(s => s.id === examId && s.role === 'examiner')) continue;
      // Look up name and profile
      const assignment = assignments.find(a => a.student_id === examId);
      const profileEntry = examineesViaProfile.find(p => p.user_id === examId);
      const profile = profileEntry || await StudentProfile.findOne({ where: { user_id: examId } });
      const name = assignment?.student?.name || profileEntry?.studentUser?.name;
      if (!name) continue;
      const phase = assignment?.phase || profile?.current_phase || 'CSP600';
      students.push({ id: examId, name, role: 'examiner', phase, student_id: profile?.student_id });
    }

    res.json({ success: true, data: students });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/my — current evaluator's forms ─────────────────────
export const getMyEvaluationForms = async (req, res) => {
  try {
    const where = { evaluator_id: req.user.id };
    if (req.query.form_type) where.form_type = req.query.form_type;
    if (req.query.phase) where.phase = req.query.phase;
    if (req.query.status) where.status = req.query.status;

    const forms = await EvaluationForm.findAll({
      where,
      include: [{ model: User, as: 'student', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: forms });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/student/:studentId — all forms for a student (coord) ─
export const getStudentForms = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const coordinatorStudentIds = await getCoordinatorStudentIds(req.user.id);
    if (!coordinatorStudentIds.includes(studentId)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const forms = await EvaluationForm.findAll({
      where: { student_id: studentId },
      include: [{ model: User, as: 'evaluator', attributes: ['id', 'name'] }],
      order: [['form_type', 'ASC'], ['evaluator_role', 'ASC']]
    });
    res.json({ success: true, data: forms });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── POST /evaluation-forms — create/update (upsert by student+evaluator+type) ─
export const upsertEvaluationForm = async (req, res) => {
  try {
    const { student_id, form_type, scores, comments, presentation_date } = req.body;
    const evaluatorId = req.user.id;

    const role = await resolveEvaluatorRole(evaluatorId, student_id);
    if (!role) return res.status(403).json({ success: false, error: 'You are not authorized to evaluate this student.' });

    const template = await RubricTemplate.findOne({ where: { form_type } });
    if (!template) return res.status(404).json({ success: false, error: 'Unknown form type.' });

    const isSupervisor = role === 'supervisor';
    const { total, maxTotal } = computeScores(template.criteria, scores, isSupervisor);

    const profile = await StudentProfile.findOne({ where: { user_id: student_id } });
    const phase = ['F7', 'F8', 'F3', 'F4'].includes(form_type) ? 'CSP600' : 'CSP650';

    const [form, created] = await EvaluationForm.findOrCreate({
      where: { student_id, evaluator_id: evaluatorId, form_type },
      defaults: {
        phase,
        evaluator_role: role,
        scores: scores || {},
        total_score: total,
        max_score: maxTotal,
        comments: comments || null,
        presentation_date: presentation_date || null,
        status: 'draft'
      }
    });

    if (!created) {
      await form.update({
        scores: scores || form.scores,
        total_score: total,
        max_score: maxTotal,
        comments: comments !== undefined ? comments : form.comments,
        presentation_date: presentation_date !== undefined ? presentation_date : form.presentation_date,
      });
    }

    res.json({ success: true, data: form, message: 'Evaluation form saved.' });
  } catch (e) {
    console.error('Upsert eval form error:', e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── PUT /evaluation-forms/:id — update an existing form ──────────────────────
export const updateEvaluationForm = async (req, res) => {
  try {
    const form = await EvaluationForm.findByPk(req.params.id);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found.' });
    if (form.evaluator_id !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied.' });
    if (form.status === 'submitted') return res.status(400).json({ success: false, error: 'Cannot edit a submitted form.' });

    const { scores, comments, presentation_date, status } = req.body;
    const updates = {};

    if (scores !== undefined) {
      const template = await RubricTemplate.findOne({ where: { form_type: form.form_type } });
      const isSup = form.evaluator_role === 'supervisor';
      const { total, maxTotal } = computeScores(template.criteria, scores, isSup);
      updates.scores = scores;
      updates.total_score = total;
      updates.max_score = maxTotal;
    }
    if (comments !== undefined) updates.comments = comments;
    if (presentation_date !== undefined) updates.presentation_date = presentation_date;
    if (status === 'submitted') {
      updates.status = 'submitted';
      updates.submitted_at = new Date();
    }

    await form.update(updates);
    res.json({ success: true, data: form, message: 'Form updated.' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── POST /evaluation-forms/:id/sign ──────────────────────────────────────────
export const signEvaluationForm = async (req, res) => {
  try {
    const form = await EvaluationForm.findByPk(req.params.id);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found.' });
    if (form.evaluator_id !== req.user.id) return res.status(403).json({ success: false, error: 'Access denied.' });

    const evaluator = await User.findByPk(req.user.id, { attributes: ['signature'] });
    if (!evaluator.signature) {
      return res.status(400).json({ success: false, error: 'No signature set. Please save your signature in Settings first.' });
    }

    await form.update({
      signature_img: evaluator.signature,
      signed_at: new Date(),
      status: 'submitted',
      submitted_at: form.submitted_at || new Date(),
    });
    res.json({ success: true, data: form, message: 'Form signed and submitted.' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/:id/download — generate + download PDF ──────────────
export const downloadEvaluationFormPDF = async (req, res) => {
  try {
    const form = await EvaluationForm.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        { model: User, as: 'evaluator', attributes: ['id', 'name'] },
      ]
    });
    if (!form) return res.status(404).json({ success: false, error: 'Form not found.' });

    let canAccess = form.evaluator_id === req.user.id;
    if (!canAccess && req.user.role === 'coordinator') {
      const coordinatorStudentIds = await getCoordinatorStudentIds(req.user.id);
      canAccess = coordinatorStudentIds.includes(form.student_id);
    }
    if (!canAccess) return res.status(403).json({ success: false, error: 'Access denied.' });

    const template = await RubricTemplate.findOne({ where: { form_type: form.form_type } });
    const studentProfile = await StudentProfile.findOne({ where: { user_id: form.student_id } });

    // Get supervisor name
    let supervisorName = '';
    if (studentProfile?.current_supervisor_id) {
      const sup = await User.findByPk(studentProfile.current_supervisor_id, { attributes: ['name'] });
      supervisorName = sup?.name || '';
    }

    const relativePath = await generateEvalForm({
      form,
      template,
      student: { id: form.student.id, name: form.student.name },
      studentProfile: { student_id: studentProfile?.student_id, programme: studentProfile?.programme },
      supervisorName,
      projectTitle: studentProfile?.fyp_title || '',
      evaluatorName: form.evaluator.name,
    });

    const filePath = path.join(__dirname, '../uploads', relativePath);
    res.download(filePath, `${form.form_type}_${form.student.name.replace(/\s+/g, '_')}_${form.evaluator_role}.pdf`);
  } catch (e) {
    console.error('Download eval form PDF error:', e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/coordinator/students — all students in coord's classes ─
export const getCoordinatorEvaluableStudents = async (req, res) => {
  try {
    const coordinatorId = req.user.id;
    const classes = await Class.findAll({
      where: { coordinator_id: coordinatorId },
      include: [{
        model: StudentProfile,
        as: 'students',
        include: [{ model: User, as: 'studentUser', attributes: ['id', 'name'] }]
      }]
    });

    const students = [];
    for (const cls of classes) {
      for (const profile of cls.students) {
        students.push({
          id: profile.user_id,
          name: profile.studentUser.name,
          student_id: profile.student_id,
          phase: profile.current_phase || 'CSP600',
          class_name: cls.name,
        });
      }
    }

    res.json({ success: true, data: students });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── GET /evaluation-forms/coordinator/all — every submitted form for the coordinator's classes ─
export const getClassEvaluationForms = async (req, res) => {
  try {
    const studentIds = await getCoordinatorStudentIds(req.user.id);
    if (studentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const where = { student_id: { [Op.in]: studentIds }, status: 'submitted' };
    if (req.query.form_type) where.form_type = req.query.form_type;
    if (req.query.phase) where.phase = req.query.phase;
    if (req.query.student_id) where.student_id = parseInt(req.query.student_id, 10);

    const forms = await EvaluationForm.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        { model: User, as: 'evaluator', attributes: ['id', 'name'] },
      ],
      order: [['submitted_at', 'DESC']]
    });
    res.json({ success: true, data: forms });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

const COORDINATOR_FORM_TYPES = ['F3', 'F4', 'F9', 'F13'];

// ── POST /evaluation-forms/coordinator — coordinator creates eval form ─────────
export const coordinatorUpsertEvaluationForm = async (req, res) => {
  try {
    const { student_id, form_type, scores, comments, presentation_date } = req.body;
    const evaluatorId = req.user.id;

    if (!COORDINATOR_FORM_TYPES.includes(form_type)) {
      return res.status(400).json({ success: false, error: `Coordinators can only evaluate: ${COORDINATOR_FORM_TYPES.join(', ')}.` });
    }

    // Verify the student belongs to one of this coordinator's classes
    const studentProfile = await StudentProfile.findOne({ where: { user_id: student_id } });
    if (!studentProfile?.class_id) {
      return res.status(403).json({ success: false, error: 'Student is not in any class.' });
    }
    const cls = await Class.findByPk(studentProfile.class_id);
    if (!cls || cls.coordinator_id !== evaluatorId) {
      return res.status(403).json({ success: false, error: 'Student is not in your class.' });
    }

    const template = await RubricTemplate.findOne({ where: { form_type } });
    if (!template) return res.status(404).json({ success: false, error: 'Unknown form type.' });

    const { total, maxTotal } = computeScores(template.criteria, scores, true);
    const phase = ['F3', 'F4'].includes(form_type) ? 'CSP600' : 'CSP650';

    const [form, created] = await EvaluationForm.findOrCreate({
      where: { student_id, evaluator_id: evaluatorId, form_type },
      defaults: {
        phase,
        evaluator_role: 'coordinator',
        scores: scores || {},
        total_score: total,
        max_score: maxTotal,
        comments: comments || null,
        presentation_date: presentation_date || null,
        status: 'draft',
      }
    });

    if (!created) {
      await form.update({
        scores: scores || form.scores,
        total_score: total,
        max_score: maxTotal,
        comments: comments !== undefined ? comments : form.comments,
        presentation_date: presentation_date !== undefined ? presentation_date : form.presentation_date,
      });
    }

    res.json({ success: true, data: form, message: 'Evaluation form saved.' });
  } catch (e) {
    console.error('Coordinator upsert eval form error:', e);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── DELETE /evaluation-forms/:id ─────────────────────────────────────────────
export const deleteEvaluationForm = async (req, res) => {
  try {
    const form = await EvaluationForm.findByPk(req.params.id);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found.' });
    if (form.evaluator_id !== req.user.id && req.user.role !== 'coordinator') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    if (form.status === 'submitted') {
      return res.status(400).json({ success: false, error: 'Cannot delete a submitted form.' });
    }
    await form.destroy();
    res.json({ success: true, message: 'Form deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
