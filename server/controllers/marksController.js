import { EvaluationForm, User, StudentProfile, SupervisorProfile, ExaminerAssignment, PresentationSlot, Amendment, Class, Task, TaskEvaluation } from '../models/index.js';
import { Op } from 'sequelize';

// Human-readable names for each F-form, used in the marks breakdown.
const FORM_NAMES = {
  F2: 'Project Motivation',
  F3: 'Literature Review',
  F4: 'Methodology',
  F7: 'Project Formulation Presentation',
  F8: 'Project Formulation Report',
  F9: 'Progress Presentation',
  F10: 'Final Presentation',
  F11: 'Project Report',
  F13: 'Lean Canvas Model',
};

// Returns the user_ids of every student in the coordinator's classes,
// keyed for quick lookup with class/profile context.
async function getCoordinatorStudentContext(coordinatorId) {
  const classes = await Class.findAll({
    where: { coordinator_id: coordinatorId },
    include: [{
      model: StudentProfile,
      as: 'students',
      include: [{ model: User, as: 'studentUser', attributes: ['id', 'name', 'email'] }],
    }],
  });
  const context = {};
  for (const cls of classes) {
    for (const profile of cls.students) {
      context[profile.user_id] = { profile, cls };
    }
  }
  return context;
}

// GET /marks/coordinator — consolidated marks for the coordinator's own
// students, one row per student with each submitted evaluation form listed.
export const getCoordinatorMarks = async (req, res) => {
  try {
    const { phase, class_id, student_id } = req.query;
    const context = await getCoordinatorStudentContext(req.user.id);
    let studentIds = Object.keys(context).map(Number);

    if (class_id) {
      studentIds = studentIds.filter(id => String(context[id].cls.id) === String(class_id));
    }
    if (student_id) {
      studentIds = studentIds.filter(id => String(id) === String(student_id));
    }

    if (studentIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const byStudent = {};
    for (const id of studentIds) {
      const { profile, cls } = context[id];
      byStudent[id] = {
        student_id: id,
        name: profile.studentUser?.name || '',
        matric: profile.student_id || '',
        programme: profile.programme || '',
        class_name: cls.name,
        phase: profile.current_phase || cls.phase,
        forms: [],
        total_score: 0,
        max_score: 0,
      };
    }

    // ── Evaluation-form pipeline (F7–F11, F13) ──────────────────────────────
    const evalWhere = { student_id: { [Op.in]: studentIds }, status: 'submitted' };
    if (phase) evalWhere.phase = phase;
    const evalForms = await EvaluationForm.findAll({
      where: evalWhere,
      include: [{ model: User, as: 'evaluator', attributes: ['id', 'name'] }],
      order: [['form_type', 'ASC'], ['evaluator_role', 'ASC']],
    });

    for (const f of evalForms) {
      const row = byStudent[f.student_id];
      if (!row) continue;
      const total = parseFloat(f.total_score) || 0;
      const max = parseFloat(f.max_score) || 0;
      row.forms.push({
        id: `ef-${f.id}`,
        form_type: f.form_type,
        form_name: FORM_NAMES[f.form_type] || f.form_type,
        evaluator_role: f.evaluator_role,
        evaluator_name: f.evaluator?.name || '',
        total_score: total,
        max_score: max,
        percentage: max > 0 ? Math.round((total / max) * 1000) / 10 : null,
      });
      row.total_score += total;
      row.max_score += max;
    }

    // ── Task-graded forms (F2/F3/F4) via TaskEvaluation ─────────────────────
    const taskEvals = await TaskEvaluation.findAll({
      where: { student_id: { [Op.in]: studentIds }, status: 'submitted' },
      include: [
        { model: Task, as: 'task', attributes: ['id', 'form_type'], where: { form_type: { [Op.ne]: null } } },
        { model: User, as: 'evaluator', attributes: ['id', 'name'] },
      ],
    });

    for (const te of taskEvals) {
      const row = byStudent[te.student_id];
      if (!row) continue;
      const formType = te.task?.form_type;
      if (!formType) continue;
      const total = parseFloat(te.total_marks) || 0;
      // Max = sum of weight * score_max from the rubric snapshot used at grading.
      const max = (te.rubric_snapshot || []).reduce(
        (sum, c) => sum + (parseFloat(c.weight) || 0) * (parseFloat(c.score_max) || 0), 0
      );
      row.forms.push({
        id: `te-${te.id}`,
        form_type: formType,
        form_name: FORM_NAMES[formType] || formType,
        evaluator_role: 'coordinator',
        evaluator_name: te.evaluator?.name || '',
        total_score: total,
        max_score: max,
        percentage: max > 0 ? Math.round((total / max) * 1000) / 10 : null,
      });
      row.total_score += total;
      row.max_score += max;
    }

    // Sort each student's forms by F-number for a stable, readable breakdown.
    const formOrder = (ft) => parseInt(String(ft).replace(/\D/g, ''), 10) || 0;

    const data = Object.values(byStudent)
      .map(r => ({
        ...r,
        forms: r.forms.sort((a, b) => formOrder(a.form_type) - formOrder(b.form_type)),
        percentage: r.max_score > 0 ? Math.round((r.total_score / r.max_score) * 1000) / 10 : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get coordinator marks error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const { student_id, phase, semester } = req.query;
    const whereClause = {};
    
    if (student_id) whereClause.student_id = student_id;
    if (phase) whereClause.phase = phase;

    // Filter by user role
    if (req.user.role === 'student') {
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'supervisor') {
      const supervisedStudents = await StudentProfile.findAll({
        where: { current_supervisor_id: req.user.id },
        attributes: ['user_id']
      });
      whereClause.student_id = {
        [Op.in]: supervisedStudents.map(s => s.user_id)
      };
    } else if (req.user.role === 'examiner') {
      const examinedStudents = await ExaminerAssignment.findAll({
        where: { examiner_id: req.user.id },
        attributes: ['student_id']
      });
      whereClause.student_id = {
        [Op.in]: examinedStudents.map(a => a.student_id)
      };
    }

    const evaluationForms = await EvaluationForm.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_id', 'current_phase']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(evaluationForms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student marks', error: error.message });
  }
};

export const getConsolidatedMarks = async (req, res) => {
  try {
    const { phase, academic_year } = req.query;
    const whereClause = {};
    
    if (phase) whereClause.phase = phase;

    // Get all evaluation forms for the specified phase
    const evaluationForms = await EvaluationForm.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_id', 'current_phase']
        }
      ],
      order: [['student_id', 'ASC'], ['form_type', 'ASC']]
    });

    // Group by student and calculate totals
    const studentMarks = {};
    
    evaluationForms.forEach(form => {
      const studentId = form.student_id;
      if (!studentMarks[studentId]) {
        studentMarks[studentId] = {
          student: form.student,
          studentProfile: form.StudentProfile,
          evaluations: [],
          totalScore: 0,
          maxScore: 0,
          averageScore: 0
        };
      }
      
      studentMarks[studentId].evaluations.push(form);
      studentMarks[studentId].totalScore += form.total_score || 0;
      studentMarks[studentId].maxScore += form.max_score || 0;
    });

    // Calculate averages
    Object.keys(studentMarks).forEach(studentId => {
      const student = studentMarks[studentId];
      student.averageScore = student.maxScore > 0 ? (student.totalScore / student.maxScore) * 100 : 0;
    });

    res.json(Object.values(studentMarks));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consolidated marks', error: error.message });
  }
};

export const exportMarksReport = async (req, res) => {
  try {
    const { phase, format } = req.query;
    const whereClause = {};
    
    if (phase) whereClause.phase = phase;

    const evaluationForms = await EvaluationForm.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: StudentProfile,
          as: 'StudentProfile',
          attributes: ['student_id', 'current_phase']
        }
      ],
      order: [['student_id', 'ASC'], ['form_type', 'ASC']]
    });

    if (format === 'res') {
      // RES-compatible CSV: one row per student with consolidated total marks
      const studentMap = {};
      evaluationForms.forEach(form => {
        const sid = form.student_id;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            student_id: form.StudentProfile?.student_id || '',
            name: form.student?.name || '',
            programme: form.StudentProfile?.programme || '',
            group: form.StudentProfile?.group_name || '',
            course_code: form.phase || phase || '',
            total_score: 0,
            max_score: 0
          };
        }
        studentMap[sid].total_score += parseFloat(form.total_score) || 0;
        studentMap[sid].max_score += parseFloat(form.max_score) || 0;
      });

      const csvHeader = 'Student ID,Name,Programme,Group,Course Code,Total Marks\n';
      const csvData = Object.values(studentMap).map(s => {
        const total = s.max_score > 0 ? ((s.total_score / s.max_score) * 100).toFixed(2) : '0.00';
        return `${s.student_id},"${s.name}","${s.programme}","${s.group}",${s.course_code},${total}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="RES_marks_${phase || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Student Number,Student Name,Form Type,Total Score,Max Score,Percentage,Evaluator,Evaluation Date\n';
      const csvData = evaluationForms.map(form => {
        const percentage = form.max_score > 0 ? ((form.total_score / form.max_score) * 100).toFixed(2) : '0';
        return `${form.StudentProfile?.student_id || ''},"${form.student?.name || ''}",${form.form_type},${form.total_score || 0},${form.max_score || 0},${percentage}%,"${form.evaluator?.name || ''}",${form.created_at ? new Date(form.created_at).toLocaleDateString() : ''}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="marks_report_${phase || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // Generate JSON report
      const report = {
        title: `FYP Marks Report - ${phase || 'All Phases'}`,
        generated: new Date().toISOString(),
        data: evaluationForms
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="marks_report_${phase || 'all'}_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(report);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error exporting marks report', error: error.message });
  }
};

export const getMarksStatistics = async (req, res) => {
  try {
    const { phase } = req.query;
    const whereClause = {};
    
    if (phase) whereClause.phase = phase;

    const stats = await EvaluationForm.findAll({
      where: whereClause,
      attributes: [
        [EvaluationForm.sequelize.fn('COUNT', EvaluationForm.sequelize.col('id')), 'total_evaluations'],
        [EvaluationForm.sequelize.fn('AVG', EvaluationForm.sequelize.literal('(total_score / max_score) * 100')), 'average_percentage'],
        [EvaluationForm.sequelize.fn('MIN', EvaluationForm.sequelize.literal('(total_score / max_score) * 100')), 'min_percentage'],
        [EvaluationForm.sequelize.fn('MAX', EvaluationForm.sequelize.literal('(total_score / max_score) * 100')), 'max_percentage'],
        [EvaluationForm.sequelize.fn('COUNT', EvaluationForm.sequelize.literal(`CASE WHEN (total_score / max_score) * 100 >= 70 THEN 1 END`)), 'pass_count'],
        [EvaluationForm.sequelize.fn('COUNT', EvaluationForm.sequelize.literal(`CASE WHEN (total_score / max_score) * 100 < 70 THEN 1 END`)), 'fail_count']
      ]
    });

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marks statistics', error: error.message });
  }
};
