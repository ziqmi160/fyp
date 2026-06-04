import { Op } from 'sequelize';
import { Task, Class, Submission, SubmissionAttachment, StudentProfile, User } from '../models/index.js';

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
      order: [['class_id', 'ASC'], ['order_index', 'ASC'], ['created_at', 'ASC']]
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
    const { title, description, class_id, due_date, order_index } = req.body;

    if (!title || !class_id) {
      return res.status(400).json({ success: false, error: 'title and class_id are required.' });
    }

    // Verify the class belongs to this coordinator
    const cls = await Class.findOne({ where: { id: class_id, coordinator_id: req.user.id } });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });

    const task = await Task.create({
      title,
      description: description || null,
      class_id,
      due_date: due_date || null,
      created_by: req.user.id,
      order_index: order_index ?? 0,
      is_active: true
    });

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

    const { title, description, due_date, order_index, is_active } = req.body;
    await task.update({
      title: title ?? task.title,
      description: description !== undefined ? description : task.description,
      due_date: due_date !== undefined ? due_date : task.due_date,
      order_index: order_index ?? task.order_index,
      is_active: is_active ?? task.is_active
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
      order: [['order_index', 'ASC'], ['created_at', 'ASC']]
    });

    // For each task, check if this student has submitted
    const taskIds = tasks.map(t => t.id);
    const mySubmissions = await Submission.findAll({
      where: { student_id: req.user.id, task_id: { [Op.in]: taskIds } },
      attributes: ['id', 'task_id', 'status', 'submitted_at', 'title']
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
