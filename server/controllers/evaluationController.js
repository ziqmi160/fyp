import { Evaluation, User } from '../models/index.js';

export const submitEvaluation = async (req, res) => {
  try {
    const evaluator_id = req.user.id;
    const { student_id, form_type, phase, rubric_scores, comments } = req.body;

    // Calculate total score based on rubric_scores
    let total_score = 0;
    if (rubric_scores) {
      Object.values(rubric_scores).forEach(score => {
        total_score += parseFloat(score) || 0;
      });
    }

    const evaluation = await Evaluation.create({
      student_id,
      evaluator_id,
      form_type,
      phase,
      rubric_scores,
      total_score,
      comments
    });

    res.status(201).json({ success: true, data: evaluation, message: 'Evaluation submitted successfully.' });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getStudentEvaluations = async (req, res) => {
  try {
    const { student_id } = req.params;
    const evaluations = await Evaluation.findAll({
      where: { student_id },
      include: [{ model: User, as: 'evaluator', attributes: ['name', 'email'] }]
    });

    res.json({ success: true, data: evaluations });
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
