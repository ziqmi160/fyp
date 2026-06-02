import { EvaluationForm, User, StudentProfile, SupervisorProfile, ExaminerAssignment, PresentationSlot, Amendment } from '../models/index.js';
import { Op } from 'sequelize';

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
