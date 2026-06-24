import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import { Task, Class, Submission, SubmissionAttachment, StudentProfile, User } from '../models/index.js';
import { DEFAULT_RUBRICS } from '../constants/defaultRubrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const fileSafe = (s) => (s || 'unknown').replace(/[^a-z0-9]+/gi, '_');

// ── Coordinator ───────────────────────────────────────────────────────────────

export const getCoordinatorTasks = async (req, res) => {
  try {
    const { class_id } = req.query;

    // Find all classes that belong to this coordinator
    const classWhere = { coordinator_id: req.user.id };
    if (class_id) classWhere.id = class_id;

    const classes = await Class.findAll({ where: classWhere, attributes: ['id'] });
    const classIds = classes.map(c => c.id);

    if (classIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const tasks = await Task.findAll({
      where: { class_id: { [Op.in]: classIds } },
      include: [{ model: Class, as: 'class', attributes: ['id', 'name', 'phase'] }],
      order: [['class_id', 'ASC'], ['created_at', 'ASC']]
    });

    // Attach submission counts per task
    const withCounts = await Promise.all(tasks.map(async (t) => {
      const submissionCount = await Submission.count({ where: { task_id: t.id } });
      // Total students in that class
      const studentCount = await StudentProfile.count({ where: { class_id: t.class_id } });
      return { ...t.toJSON(), submission_count: submissionCount, student_count: studentCount };
    }));

    res.json({ success: true, data: withCounts });
  } catch (error) {
    console.error('Get coordinator tasks error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, class_id, due_date, form_type, rubric, apply_to_all } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required.' });
    }

    // If a form_type is given but no custom rubric, use the default
    const resolvedRubric = form_type
      ? (rubric || DEFAULT_RUBRICS[form_type] || null)
      : null;

    const baseFields = {
      title,
      description: description || null,
      due_date: due_date || null,
      created_by: req.user.id,
      form_type: form_type || null,
      rubric: resolvedRubric,
      is_active: true
    };

    // Apply to all of the coordinator's classes
    if (apply_to_all) {
      const classes = await Class.findAll({ where: { coordinator_id: req.user.id }, attributes: ['id'] });
      if (classes.length === 0) {
        return res.status(404).json({ success: false, error: 'You have no classes.' });
      }
      const created = await Task.bulkCreate(
        classes.map(c => ({ ...baseFields, class_id: c.id }))
      );
      return res.status(201).json({
        success: true,
        data: created,
        message: `Task created in ${created.length} class${created.length !== 1 ? 'es' : ''}.`
      });
    }

    if (!class_id) {
      return res.status(400).json({ success: false, error: 'class_id is required.' });
    }

    const cls = await Class.findOne({ where: { id: class_id, coordinator_id: req.user.id } });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });

    const task = await Task.create({ ...baseFields, class_id });

    res.status(201).json({ success: true, data: task, message: 'Task created.' });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const { title, description, due_date, is_active, form_type, rubric } = req.body;

    const updatedFormType = form_type !== undefined ? (form_type || null) : task.form_type;
    let updatedRubric = task.rubric;
    if (rubric !== undefined) {
      updatedRubric = rubric;
    } else if (form_type !== undefined && form_type && !task.rubric) {
      updatedRubric = DEFAULT_RUBRICS[form_type] || null;
    }

    await task.update({
      title: title ?? task.title,
      description: description !== undefined ? description : task.description,
      due_date: due_date !== undefined ? due_date : task.due_date,
      is_active: is_active ?? task.is_active,
      form_type: updatedFormType,
      rubric: updatedRubric
    });

    res.json({ success: true, data: task, message: 'Task updated.' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const submissionCount = await Submission.count({ where: { task_id: task.id } });
    if (submissionCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete: ${submissionCount} submission(s) exist for this task.`
      });
    }

    await task.destroy();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getTaskSubmissions = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const submissions = await Submission.findAll({
      where: { task_id: task.id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        SubmissionAttachment
      ],
      order: [['submitted_at', 'DESC']]
    });

    // Also list students with no submission
    const students = await StudentProfile.findAll({
      where: { class_id: task.class_id },
      include: [{ model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] }]
    });

    const submittedIds = new Set(submissions.map(s => s.student_id));
    const notSubmitted = students
      .filter(p => !submittedIds.has(p.user_id))
      .map(p => ({ user_id: p.user_id, name: p.studentUser?.name, email: p.studentUser?.email, student_id: p.student_id }));

    res.json({ success: true, data: { task, submissions, not_submitted: notSubmitted } });
  } catch (error) {
    console.error('Get task submissions error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// GET /tasks/coordinator/:id/submissions/download
// Bundles every submitted file for a task into a single ZIP, one folder per student.
export const downloadTaskSubmissions = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, created_by: req.user.id } });
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const submissions = await Submission.findAll({
      where: { task_id: task.id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        SubmissionAttachment
      ],
    });

    const hasFiles = submissions.some(s => (s.SubmissionAttachments || []).length > 0);
    if (!hasFiles) {
      return res.status(404).json({ success: false, error: 'No file submissions for this task.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileSafe(task.title)}_submissions.zip"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const sub of submissions) {
      const studentFolder = fileSafe(sub.student?.name || `student_${sub.student_id}`);
      for (const att of sub.SubmissionAttachments || []) {
        const absPath = path.join(UPLOADS_DIR, att.file_path);
        if (fs.existsSync(absPath)) {
          archive.file(absPath, { name: `${studentFolder}/${att.file_name}` });
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Download task submissions error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Server error.' });
    }
  }
};

// ── Student ───────────────────────────────────────────────────────────────────

export const getMyClassTasks = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile?.class_id) {
      return res.json({ success: true, data: [] });
    }

    const tasks = await Task.findAll({
      where: { class_id: profile.class_id, is_active: true },
      include: [{ model: Class, as: 'class', attributes: ['id', 'name', 'phase'] }],
      order: [['created_at', 'ASC']]
    });

    // For each task, check if this student has submitted
    const taskIds = tasks.map(t => t.id);
    const mySubmissions = await Submission.findAll({
      where: { student_id: req.user.id, task_id: { [Op.in]: taskIds } },
      attributes: ['id', 'task_id', 'status', 'submitted_at', 'title', 'supervisor_feedback']
    });
    const submissionMap = Object.fromEntries(mySubmissions.map(s => [s.task_id, s]));

    const result = tasks.map(t => ({
      ...t.toJSON(),
      my_submission: submissionMap[t.id] || null
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get my class tasks error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── Helper: auto-create default tasks for a newly-created class ────────────────

const CSP600_DEFAULT_TASKS = [
  { title: 'Chapter 1', description: 'Submit your Chapter 1 document.', order_index: 1 },
  { title: 'Chapter 2', description: 'Submit your Chapter 2 document.', order_index: 2 },
  { title: 'Chapter 3', description: 'Submit your Chapter 3 document.', order_index: 3 },
  { title: 'Final Proposal Report', description: 'Submit your complete final proposal report.', order_index: 4 },
];

const CSP650_DEFAULT_TASKS = [
  { title: 'Final Report', description: 'Submit your complete final project report.', order_index: 1 },
];

export const createDefaultTasksForClass = async (classId, phase, createdBy) => {
  const templates = phase === 'CSP650' ? CSP650_DEFAULT_TASKS : CSP600_DEFAULT_TASKS;
  for (const t of templates) {
    const existing = await Task.findOne({ where: { class_id: classId, title: t.title } });
    if (!existing) {
      await Task.create({
        title: t.title,
        description: t.description,
        class_id: classId,
        created_by: createdBy,
        order_index: t.order_index,
        is_active: true,
      });
    }
  }
};
