import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Task, TaskEvaluation, User, StudentProfile, SupervisorProfile, Submission } from '../models/index.js';
import { generateEvaluationForm } from '../services/pdfService.js';
import { DEFAULT_RUBRICS } from '../constants/defaultRubrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /tasks/coordinator/:taskId/evaluations
// Returns all evaluations for a task, keyed by student_id
export const getTaskEvaluations = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.taskId, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const evaluations = await TaskEvaluation.findAll({
      where: { task_id: task.id },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }]
    });

    res.json({ success: true, data: evaluations });
  } catch (error) {
    console.error('Get task evaluations error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /tasks/coordinator/:taskId/evaluations/:studentId
export const getStudentEvaluation = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.taskId, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const evaluation = await TaskEvaluation.findOne({
      where: { task_id: task.id, student_id: req.params.studentId }
    });

    res.json({ success: true, data: evaluation || null });
  } catch (error) {
    console.error('Get student evaluation error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /tasks/coordinator/:taskId/evaluations/:studentId
// Create or update an evaluation (upsert)
export const saveEvaluation = async (req, res) => {
  try {
    const { criteria_scores, status, submission_id } = req.body;

    const task = await Task.findOne({ where: { id: req.params.taskId, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
    if (!task.rubric || !task.form_type) {
      return res.status(400).json({ success: false, error: 'This task has no rubric attached.' });
    }

    // Calculate total_marks = sum(weight * score) for each criterion
    const rubric = task.rubric;
    let total = 0;
    (criteria_scores || []).forEach(({ criterion_index, score }) => {
      const criterion = rubric[criterion_index];
      if (criterion && score !== null && score !== undefined) {
        total += criterion.weight * Number(score);
      }
    });

    const [evaluation, created] = await TaskEvaluation.upsert({
      task_id: task.id,
      student_id: req.params.studentId,
      submission_id: submission_id || null,
      evaluator_id: req.user.id,
      rubric_snapshot: rubric,
      criteria_scores: criteria_scores || [],
      total_marks: total,
      status: status || 'draft',
    }, { returning: true });

    res.json({
      success: true,
      data: evaluation,
      message: created ? 'Evaluation saved.' : 'Evaluation updated.'
    });
  } catch (error) {
    console.error('Save evaluation error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// POST /tasks/coordinator/:taskId/evaluations/:studentId/generate-pdf
export const generateEvaluationPDF = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.taskId, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
    if (!task.form_type) return res.status(400).json({ success: false, error: 'Task has no evaluation form type.' });

    const evaluation = await TaskEvaluation.findOne({
      where: { task_id: task.id, student_id: req.params.studentId }
    });
    if (!evaluation) return res.status(404).json({ success: false, error: 'No evaluation found. Save scores first.' });

    // Fetch student info
    const student = await User.findByPk(req.params.studentId, { attributes: ['id', 'name', 'email'] });
    const studentProfile = await StudentProfile.findOne({ where: { user_id: req.params.studentId } });
    const supervisor = studentProfile?.current_supervisor_id
      ? await User.findByPk(studentProfile.current_supervisor_id, { attributes: ['id', 'name'] })
      : null;
    const evaluator = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });

    const pdfPath = await generateEvaluationForm({
      formType: task.form_type,
      student: { id: student.id, name: student.name, email: student.email },
      studentProfile: { student_id: studentProfile?.student_id, programme: studentProfile?.programme },
      supervisorName: supervisor?.name || '',
      evaluatorName: evaluator?.name || '',
      projectTitle: studentProfile?.fyp_title || '',
      rubric: evaluation.rubric_snapshot,
      criteriaScores: evaluation.criteria_scores,
      totalMarks: evaluation.total_marks,
      date: new Date()
    });

    // Persist document path on evaluation
    await evaluation.update({ document_path: pdfPath, status: 'submitted' });

    res.json({ success: true, data: { document_path: pdfPath }, message: 'PDF generated.' });
  } catch (error) {
    console.error('Generate evaluation PDF error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /tasks/coordinator/:taskId/evaluations/:studentId/download
export const downloadEvaluationPDF = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.taskId, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const evaluation = await TaskEvaluation.findOne({
      where: { task_id: task.id, student_id: req.params.studentId }
    });
    if (!evaluation?.document_path) {
      return res.status(404).json({ success: false, error: 'No PDF generated yet.' });
    }

    const filePath = path.join(__dirname, '../uploads', evaluation.document_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on disk.' });
    }

    res.download(filePath, path.basename(evaluation.document_path));
  } catch (error) {
    console.error('Download evaluation PDF error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /tasks/default-rubric/:formType — returns the default rubric for a form type
export const getDefaultRubric = async (req, res) => {
  const rubric = DEFAULT_RUBRICS[req.params.formType];
  if (!rubric) return res.status(404).json({ success: false, error: 'Unknown form type.' });
  res.json({ success: true, data: rubric });
};
