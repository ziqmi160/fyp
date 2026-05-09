import { EvaluationForm, User, Submission, ExaminerAssignment } from '../models/index.js';
import { Op } from 'sequelize';

// Define rubric templates for each form type
const RUBRIC_TEMPLATES = {
  F7: {
    name: 'Proposal Presentation Form',
    max_score: 100,
    criteria: [
      { name: 'Problem Statement & Objectives', max_score: 20 },
      { name: 'Literature Review', max_score: 15 },
      { name: 'Methodology', max_score: 20 },
      { name: 'Feasibility & Planning', max_score: 15 },
      { name: 'Presentation Skills', max_score: 15 },
      { name: 'Q&A Handling', max_score: 15 }
    ]
  },
  F8: {
    name: 'Proposal Report Evaluation Form',
    max_score: 100,
    criteria: [
      { name: 'Introduction & Problem Statement', max_score: 15 },
      { name: 'Literature Review Quality', max_score: 20 },
      { name: 'Methodology & Design', max_score: 25 },
      { name: 'Writing Quality & Structure', max_score: 20 },
      { name: 'References & Citations', max_score: 10 },
      { name: 'Overall Quality', max_score: 10 }
    ]
  },
  F9: {
    name: 'Progress Presentation Form',
    max_score: 100,
    criteria: [
      { name: 'Project Progress', max_score: 25 },
      { name: 'Technical Implementation', max_score: 20 },
      { name: 'Problem Solving', max_score: 20 },
      { name: 'Documentation', max_score: 15 },
      { name: 'Presentation Skills', max_score: 10 },
      { name: 'Future Planning', max_score: 10 }
    ]
  },
  F10: {
    name: 'Final Presentation Form',
    max_score: 100,
    criteria: [
      { name: 'Project Completion', max_score: 25 },
      { name: 'Technical Achievement', max_score: 25 },
      { name: 'Innovation & Creativity', max_score: 20 },
      { name: 'Presentation Quality', max_score: 15 },
      { name: 'Demonstration', max_score: 15 }
    ]
  },
  F11: {
    name: 'Final Report Evaluation Form',
    max_score: 100,
    criteria: [
      { name: 'Content & Structure', max_score: 20 },
      { name: 'Technical Quality', max_score: 25 },
      { name: 'Analysis & Results', max_score: 20 },
      { name: 'Writing Quality', max_score: 15 },
      { name: 'Contribution & Originality', max_score: 10 },
      { name: 'References & Appendices', max_score: 10 }
    ]
  },
  F13: {
    name: 'Lean Model Canvas Evaluation Form',
    max_score: 100,
    criteria: [
      { name: 'Customer Segments', max_score: 15 },
      { name: 'Value Proposition', max_score: 20 },
      { name: 'Channels', max_score: 10 },
      { name: 'Customer Relationships', max_score: 10 },
      { name: 'Revenue Streams', max_score: 15 },
      { name: 'Key Activities', max_score: 10 },
      { name: 'Key Resources', max_score: 10 },
      { name: 'Key Partnerships', max_score: 5 },
      { name: 'Cost Structure', max_score: 5 }
    ]
  }
};

export const getRubricTemplate = async (req, res) => {
  try {
    const { formType } = req.params;
    const template = RUBRIC_TEMPLATES[formType];
    
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rubric template', error: error.message });
  }
};

export const getEvaluationForms = async (req, res) => {
  try {
    const { student_id, form_type, phase, status } = req.query;
    const whereClause = {};
    
    if (student_id) whereClause.student_id = student_id;
    if (form_type) whereClause.form_type = form_type;
    if (phase) whereClause.phase = phase;
    if (status) whereClause.status = status;

    const forms = await EvaluationForm.findAll({
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
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluation forms', error: error.message });
  }
};

export const createEvaluationForm = async (req, res) => {
  try {
    const { student_id, form_type, phase, scores, comments, recommendations } = req.body;
    const evaluator_id = req.user.id;

    // Check if evaluator is assigned to evaluate this student
    if (req.user.role === 'supervisor') {
      const assignment = await ExaminerAssignment.findOne({
        where: {
          student_id,
          examiner_id: evaluator_id,
          phase,
          status: 'active'
        }
      });

      if (!assignment && form_type !== 'F9') { // F9 can be done by supervisor
        return res.status(403).json({ message: 'You are not assigned as examiner for this student' });
      }
    }

    const template = RUBRIC_TEMPLATES[form_type];
    if (!template) {
      return res.status(400).json({ message: 'Invalid form type' });
    }

    // Calculate total score
    let totalScore = 0;
    for (const criterion of template.criteria) {
      const score = scores[criterion.name] || 0;
      totalScore += parseFloat(score);
    }

    const form = await EvaluationForm.create({
      student_id,
      evaluator_id,
      form_type,
      phase,
      scores,
      total_score: totalScore,
      max_score: template.max_score,
      comments,
      recommendations,
      status: 'draft'
    });

    const createdForm = await EvaluationForm.findByPk(form.id, {
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
        }
      ]
    });

    res.status(201).json(createdForm);
  } catch (error) {
    res.status(500).json({ message: 'Error creating evaluation form', error: error.message });
  }
};

export const updateEvaluationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { scores, comments, recommendations, status } = req.body;

    const form = await EvaluationForm.findByPk(id);
    if (!form) {
      return res.status(404).json({ message: 'Evaluation form not found' });
    }

    // Check permissions
    if (form.evaluator_id !== req.user.id && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'You can only update your own evaluation forms' });
    }

    const updateData = {};
    if (scores) {
      const template = RUBRIC_TEMPLATES[form.form_type];
      let totalScore = 0;
      for (const criterion of template.criteria) {
        const score = scores[criterion.name] || 0;
        totalScore += parseFloat(score);
      }
      updateData.scores = scores;
      updateData.total_score = totalScore;
    }
    
    if (comments !== undefined) updateData.comments = comments;
    if (recommendations !== undefined) updateData.recommendations = recommendations;
    
    if (status === 'submitted') {
      updateData.status = 'submitted';
      updateData.submitted_at = new Date();
    } else if (status) {
      updateData.status = status;
    }

    await form.update(updateData);

    const updatedForm = await EvaluationForm.findByPk(id, {
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
        }
      ]
    });

    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Error updating evaluation form', error: error.message });
  }
};

export const getMyEvaluationForms = async (req, res) => {
  try {
    const evaluatorId = req.user.id;
    const { status, form_type, phase } = req.query;
    
    const whereClause = { evaluator_id: evaluatorId };
    if (status) whereClause.status = status;
    if (form_type) whereClause.form_type = form_type;
    if (phase) whereClause.phase = phase;

    const forms = await EvaluationForm.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluation forms', error: error.message });
  }
};

export const getStudentEvaluationForms = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { form_type, phase } = req.query;
    
    const whereClause = { student_id: studentId };
    if (form_type) whereClause.form_type = form_type;
    if (phase) whereClause.phase = phase;

    const forms = await EvaluationForm.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluation forms', error: error.message });
  }
};

export const deleteEvaluationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await EvaluationForm.findByPk(id);
    
    if (!form) {
      return res.status(404).json({ message: 'Evaluation form not found' });
    }

    // Check permissions
    if (form.evaluator_id !== req.user.id && req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'You can only delete your own evaluation forms' });
    }

    if (form.status === 'submitted') {
      return res.status(400).json({ message: 'Cannot delete submitted evaluation forms' });
    }

    await form.destroy();
    res.json({ message: 'Evaluation form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting evaluation form', error: error.message });
  }
};
