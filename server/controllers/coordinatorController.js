import { Op } from 'sequelize';
import { User, Class, StudentProfile, SupervisorProfile, Submission, SupervisionRequest, PresentationSchedule, Evaluation } from '../models/index.js';
import { generateProgressReport } from '../services/pdfService.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export const getStats = async (req, res) => {
  try {
    const totalStudents = await StudentProfile.count();
    const totalSupervisors = await SupervisorProfile.count();
    const activePairs = await StudentProfile.count({
      where: { current_supervisor_id: { [Op.ne]: null } }
    });
    const noSupervisor = await StudentProfile.count({
      where: { current_supervisor_id: null }
    });

    const submissionCounts = await Submission.findAll({
      attributes: ['submission_type', 'status'],
      raw: true
    });

    const statusCounts = await StudentProfile.findAll({
      attributes: ['fyp_status'],
      raw: true
    });

    const submissionsByType = {};
    const submissionsByStatus = {};
    const fypStatusDist = {};

    submissionCounts.forEach(s => {
      submissionsByType[s.submission_type] = (submissionsByType[s.submission_type] || 0) + 1;
      submissionsByStatus[s.status] = (submissionsByStatus[s.status] || 0) + 1;
    });

    statusCounts.forEach(s => {
      fypStatusDist[s.fyp_status] = (fypStatusDist[s.fyp_status] || 0) + 1;
    });

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const submissions = await Submission.findAll({
      where: { submitted_at: { [Op.gte]: eightWeeksAgo } },
      attributes: ['submitted_at'],
      raw: true
    });

    const weeklyData = {};
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(eightWeeksAgo);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const key = weekStart.toISOString().slice(0, 10);
      weeklyData[key] = submissions.filter(s => {
        const d = new Date(s.submitted_at);
        return d >= weekStart && d < weekEnd;
      }).length;
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        totalSupervisors,
        activePairs,
        noSupervisor,
        submissionsByType,
        submissionsByStatus,
        fypStatusDist,
        submissionsPerWeek: Object.entries(weeklyData).map(([week, count]) => ({ week, count }))
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getStudents = async (req, res) => {
  try {
    const { search, group, class_id, programme, status, supervisor } = req.query;

    const where = {};
    if (req.user.coordinator_phase) where.current_phase = req.user.coordinator_phase;
    if (class_id) where.class_id = class_id;
    else if (group) where.group_name = group;
    if (programme) where.programme = programme;
    if (status) where.fyp_status = status;
    if (supervisor) where.current_supervisor_id = supervisor;

    const profiles = await StudentProfile.findAll({
      where,
      include: [
        'supervisor',
        'examiner',
        { model: Class, as: 'class', attributes: ['id', 'name', 'phase'] }
      ]
    });

    const userIds = profiles.map(p => p.user_id);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'name', 'email']
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    let result = profiles.map(p => ({
      ...p.toJSON(),
      name: userMap[p.user_id]?.name,
      email: userMap[p.user_id]?.email,
      supervisor_name: p.supervisor?.name,
      examiner_name: p.examiner?.name,
      class_name: p.class?.name || p.group_name
    }));

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r =>
        (r.name || '').toLowerCase().includes(s) ||
        (r.student_id || '').toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getSupervisors = async (req, res) => {
  try {
    const profiles = await SupervisorProfile.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    const result = profiles.map(p => ({
      ...p.toJSON(),
      name: p.User?.name,
      email: p.User?.email
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateSupervisorQuota = async (req, res) => {
  try {
    const profile = await SupervisorProfile.findByPk(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    const max_students = parseInt(req.body.max_students, 10);
    if (isNaN(max_students) || max_students < 0) {
      return res.status(400).json({ success: false, error: 'Invalid max_students value.' });
    }

    await profile.update({ max_students });

    res.json({ success: true, data: profile, message: 'Quota updated.' });
  } catch (error) {
    console.error('Update quota error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const generateReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date } = req.query;

    // Placeholder - in full implementation would generate PDFs
    if (type === 'cohort_progress') {
      const students = await StudentProfile.findAll({
        include: ['supervisor']
      });
      const userIds = students.map(s => s.user_id);
      const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name'] });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      const csv = ['Name,Student No,Programme,Group,Supervisor,FYP Status,FYP Title'];
      students.forEach(s => {
        csv.push([
          userMap[s.user_id]?.name || '',
          s.student_id || '',
          s.programme || '',
          s.group_name || '',
          s.supervisor?.name || 'None',
          s.fyp_status || '',
          (s.fyp_title || '').replace(/,/g, ';')
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cohort_progress_${Date.now()}.csv`);
      res.send(csv.join('\n'));
      return;
    }

    if (type === 'no_supervisor') {
      const students = await StudentProfile.findAll({
        where: { current_supervisor_id: null },
        include: []
      });
      const users = await User.findAll({ where: { id: students.map(s => s.user_id) }, attributes: ['id', 'name', 'email'] });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      const csv = ['Name,Student No,Programme,Group,Email'];
      students.forEach(s => {
        csv.push([
          userMap[s.user_id]?.name || '',
          s.student_id || '',
          s.programme || '',
          s.group_name || '',
          userMap[s.user_id]?.email || ''
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=no_supervisor_${Date.now()}.csv`);
      res.send(csv.join('\n'));
      return;
    }

    if (type === 'submission_status') {
      const submissions = await Submission.findAll({
        include: [
          { model: User, as: 'student', attributes: ['name'] },
          { model: User, as: 'supervisor', attributes: ['name'] }
        ]
      });

      const csv = ['Title,Type,Student,Supervisor,Status,Submitted At'];
      submissions.forEach(s => {
        csv.push([
          (s.title || '').replace(/,/g, ';'),
          s.submission_type || '',
          s.student?.name || '',
          s.supervisor?.name || '',
          s.status || '',
          s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : ''
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=submission_status_${Date.now()}.csv`);
      res.send(csv.join('\n'));
      return;
    }

    if (type === 'marks') {
      const evaluations = await Evaluation.findAll({
        include: [
          { model: User, as: 'student', attributes: ['name'] },
          { model: User, as: 'evaluator', attributes: ['name'] }
        ]
      });

      const csv = ['Student,Evaluator,Form Type,Phase,Total Score,Comments,Submitted At'];
      evaluations.forEach(e => {
        csv.push([
          (e.student?.name || '').replace(/,/g, ';'),
          (e.evaluator?.name || '').replace(/,/g, ';'),
          e.form_type || '',
          e.phase || '',
          e.total_score || '0',
          (e.comments || '').replace(/,/g, ';').replace(/\n/g, ' '),
          e.created_at ? new Date(e.created_at).toLocaleDateString() : ''
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=student_marks_${Date.now()}.csv`);
      res.send(csv.join('\n'));
      return;
    }

    res.status(400).json({ success: false, error: 'Invalid report type.' });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateStudentPhaseAndExaminer = async (req, res) => {
  try {
    const { id } = req.params;
    const { examiner_id } = req.body;

    const profile = await StudentProfile.findOne({ where: { user_id: id } });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const updates = {};
    if (examiner_id !== undefined) updates.examiner_id = examiner_id;

    await profile.update(updates);

    res.json({ success: true, data: profile, message: 'Student profile updated successfully.' });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const createPresentationSchedule = async (req, res) => {
  try {
    const { student_id, presentation_date, presentation_time, venue, phase } = req.body;
    
    // Check if one already exists
    const existing = await PresentationSchedule.findOne({ where: { student_id, phase } });
    if (existing) {
      await existing.update({ presentation_date, presentation_time, venue });
      return res.json({ success: true, data: existing, message: 'Schedule updated.' });
    }

    const schedule = await PresentationSchedule.create({
      student_id, presentation_date, presentation_time, venue, phase
    });

    res.status(201).json({ success: true, data: schedule, message: 'Schedule created.' });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getPresentationSchedules = async (req, res) => {
  try {
    const schedules = await PresentationSchedule.findAll({
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] }
      ]
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getPendingSupervisors = async (req, res) => {
  try {
    const pending = await User.findAll({
      where: { role: 'supervisor', approval_status: 'pending' },
      attributes: ['id', 'name', 'email', 'created_at'],
      include: [{
        model: SupervisorProfile,
        attributes: ['staff_id']
      }],
      order: [['created_at', 'ASC']]
    });

    const result = pending.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      staff_id: u.SupervisorProfile?.staff_id,
      registered_at: u.created_at
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get pending supervisors error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateSupervisorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be approve or reject.' });
    }

    const user = await User.findOne({ where: { id, role: 'supervisor' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    if (action === 'approve') {
      await user.update({ is_active: true, approval_status: 'approved' });
      return res.json({ success: true, message: 'Supervisor approved.' });
    }

    await user.update({ is_active: false, approval_status: 'rejected' });
    res.json({ success: true, message: 'Supervisor rejected.' });
  } catch (error) {
    console.error('Update supervisor approval error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// Parse a simple CSV buffer into an array of objects using the first row as headers.
const parseCsv = (buffer) => {
  const lines = buffer.toString('utf8').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
};

export const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded.' });
    }

    const rows = parseCsv(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'CSV is empty or has no data rows.' });
    }

    const created = [];
    const skipped = [];

    // Cache class lookups within this import batch to avoid repeated queries.
    const classCache = {};
    const resolveClass = async (groupName) => {
      if (!groupName) return null;
      if (classCache[groupName] !== undefined) return classCache[groupName];
      let cls = await Class.findOne({ where: { name: groupName, coordinator_id: req.user.id } });
      if (!cls) {
        cls = await Class.create({
          name: groupName,
          phase: req.user.coordinator_phase || 'CSP600',
          coordinator_id: req.user.id,
          is_active: true
        });
      }
      classCache[groupName] = cls.id;
      return cls.id;
    };

    for (const row of rows) {
      const { student_id, name, email, programme, group } = row;

      if (!student_id || !name || !email) {
        skipped.push({ row, reason: 'Missing required fields (student_id, name, email)' });
        continue;
      }

      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        skipped.push({ student_id, email, reason: 'Email already exists' });
        continue;
      }

      // Initial password is the matric number; students should change it after first login.
      const hashedPassword = await bcrypt.hash(student_id, 10);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        is_active: true,
        approval_status: null
      });

      const classId = await resolveClass(group);

      await StudentProfile.create({
        user_id: user.id,
        student_id,
        programme: programme || null,
        group_name: group || null,
        class_id: classId
      });

      created.push({ student_id, name, email: email.toLowerCase() });
    }

    res.status(201).json({
      success: true,
      data: { created, skipped },
      message: `${created.length} student(s) imported. ${skipped.length} skipped.`
    });
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── Class management ──────────────────────────────────────────────────────────

export const getClasses = async (req, res) => {
  try {
    const where = {};
    // Coordinators only see classes assigned to them (or all if super_admin/no filter)
    if (req.user.role === 'coordinator') where.coordinator_id = req.user.id;

    const classes = await Class.findAll({
      where,
      include: [
        { model: User, as: 'coordinator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['name', 'ASC']]
    });

    // Attach student counts
    const withCounts = await Promise.all(classes.map(async (c) => {
      const count = await StudentProfile.count({ where: { class_id: c.id } });
      return { ...c.toJSON(), student_count: count };
    }));

    res.json({ success: true, data: withCounts });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, phase, academic_year, semester } = req.body;
    if (!name || !phase) {
      return res.status(400).json({ success: false, error: 'name and phase are required.' });
    }

    const existing = await Class.findOne({
      where: { name, phase, coordinator_id: req.user.id }
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A class with this name already exists for this phase.' });
    }

    const cls = await Class.create({
      name,
      phase,
      academic_year: academic_year || null,
      semester: semester || null,
      coordinator_id: req.user.id,
      is_active: true
    });

    res.status(201).json({ success: true, data: cls, message: 'Class created.' });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const cls = await Class.findOne({ where: { id: req.params.id, coordinator_id: req.user.id } });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });

    const { name, phase, academic_year, semester, is_active } = req.body;
    await cls.update({
      name: name ?? cls.name,
      phase: phase ?? cls.phase,
      academic_year: academic_year ?? cls.academic_year,
      semester: semester ?? cls.semester,
      is_active: is_active ?? cls.is_active
    });

    res.json({ success: true, data: cls, message: 'Class updated.' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOne({ where: { id: req.params.id, coordinator_id: req.user.id } });
    if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });

    const studentCount = await StudentProfile.count({ where: { class_id: cls.id } });
    if (studentCount > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete: ${studentCount} student(s) are in this class. Reassign them first.` });
    }

    await cls.destroy();
    res.json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

// ── FYP title review ──────────────────────────────────────────────────────────

export const getPendingTitles = async (req, res) => {
  try {
    // Find students in classes that belong to this coordinator
    const classes = await Class.findAll({
      where: { coordinator_id: req.user.id },
      attributes: ['id']
    });
    const classIds = classes.map(c => c.id);

    const profiles = await StudentProfile.findAll({
      where: {
        title_status: 'pending',
        ...(classIds.length > 0 ? { class_id: classIds } : {})
      },
      include: [
        { model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] },
        { model: Class, as: 'class', attributes: ['id', 'name', 'phase'] }
      ],
      order: [['updated_at', 'ASC']]
    });

    const result = profiles.map(p => ({
      user_id: p.user_id,
      student_id: p.student_id,
      name: p.studentUser?.name,
      email: p.studentUser?.email,
      fyp_title: p.fyp_title,
      project_description: p.project_description,
      class_name: p.class?.name,
      submitted_at: p.updated_at
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get pending titles error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const reviewTitle = async (req, res) => {
  try {
    const { id } = req.params; // user_id of the student
    const { action, feedback } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action must be approve or reject.' });
    }
    if (action === 'reject' && !feedback?.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback is required when rejecting.' });
    }

    const profile = await StudentProfile.findOne({ where: { user_id: id } });
    if (!profile) return res.status(404).json({ success: false, error: 'Student not found.' });
    if (profile.title_status !== 'pending') {
      return res.status(400).json({ success: false, error: 'No pending title to review.' });
    }

    await profile.update({
      title_status: action === 'approve' ? 'approved' : 'rejected',
      title_feedback: action === 'reject' ? feedback.trim() : null
    });

    res.json({ success: true, message: `Title ${action === 'approve' ? 'approved' : 'rejected'}.` });
  } catch (error) {
    console.error('Review title error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const assignStudentToClass = async (req, res) => {
  try {
    const { student_user_id, class_id } = req.body;
    if (!student_user_id) {
      return res.status(400).json({ success: false, error: 'student_user_id is required.' });
    }

    const profile = await StudentProfile.findOne({ where: { user_id: student_user_id } });
    if (!profile) return res.status(404).json({ success: false, error: 'Student not found.' });

    if (class_id) {
      const cls = await Class.findOne({ where: { id: class_id, coordinator_id: req.user.id } });
      if (!cls) return res.status(404).json({ success: false, error: 'Class not found.' });
      await profile.update({ class_id, group_name: cls.name });
    } else {
      await profile.update({ class_id: null });
    }

    res.json({ success: true, message: 'Student class updated.' });
  } catch (error) {
    console.error('Assign student to class error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
