import { ExaminerAssignment, User, StudentProfile, SupervisorProfile } from '../models/index.js';
import { Op } from 'sequelize';

export const getExaminerAssignments = async (req, res) => {
  try {
    const { assignment_type } = req.query;
    const whereClause = {};

    if (req.user.coordinator_phase) whereClause.phase = req.user.coordinator_phase;
    if (assignment_type) whereClause.assignment_type = assignment_type;

    const assignments = await ExaminerAssignment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: StudentProfile,
            attributes: ['student_id', 'fyp_title']
          }]
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching examiner assignments', error: error.message });
  }
};

export const createExaminerAssignment = async (req, res) => {
  try {
    const { student_id, examiner_id, assignment_type } = req.body;
    const assigned_by = req.user.id;
    const phase = req.user.coordinator_phase;

    if (!phase) {
      return res.status(400).json({ message: 'Coordinator has no assigned phase.' });
    }

    // Check if student exists and has a supervisor
    const student = await StudentProfile.findOne({
      where: { user_id: student_id },
      include: [{
        model: User,
        as: 'supervisor'
      }]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.supervisor) {
      return res.status(400).json({ message: 'Student must have a supervisor before assigning an examiner' });
    }

    // Ensure examiner is not the student's supervisor
    if (student.current_supervisor_id === examiner_id) {
      return res.status(400).json({ message: 'Examiner cannot be the student\'s supervisor' });
    }

    // Check if examiner exists and is a supervisor
    const examiner = await User.findOne({
      where: { id: examiner_id, role: 'supervisor' }
    });

    if (!examiner) {
      return res.status(404).json({ message: 'Examiner not found or not a supervisor' });
    }

    // Check for existing assignment
    const existingAssignment = await ExaminerAssignment.findOne({
      where: {
        student_id,
        phase,
        assignment_type,
        status: 'active'
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'Examiner assignment already exists for this student, phase, and type' });
    }

    const assignment = await ExaminerAssignment.create({
      student_id,
      examiner_id,
      phase,
      assignment_type,
      assigned_by
    });

    // Update student profile with examiner ID
    await student.update({ examiner_id });

    const createdAssignment = await ExaminerAssignment.findByPk(assignment.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating examiner assignment', error: error.message });
  }
};

export const updateExaminerAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { examiner_id, status } = req.body;

    const assignment = await ExaminerAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (examiner_id && examiner_id !== assignment.examiner_id) {
      // Validate new examiner
      const examiner = await User.findOne({
        where: { id: examiner_id, role: 'supervisor' }
      });

      if (!examiner) {
        return res.status(404).json({ message: 'New examiner not found or not a supervisor' });
      }

      // Ensure new examiner is not the student's supervisor
      const student = await StudentProfile.findOne({
        where: { user_id: assignment.student_id }
      });

      if (student.current_supervisor_id === examiner_id) {
        return res.status(400).json({ message: 'Examiner cannot be the student\'s supervisor' });
      }

      await assignment.update({ examiner_id });

      // Update student profile
      await student.update({ examiner_id });
    }

    if (status) {
      await assignment.update({ status });
    }

    const updatedAssignment = await ExaminerAssignment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating examiner assignment', error: error.message });
  }
};

export const deleteExaminerAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await ExaminerAssignment.findByPk(id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Remove examiner from student profile
    await StudentProfile.update(
      { examiner_id: null },
      { where: { user_id: assignment.student_id } }
    );

    await assignment.destroy();
    res.json({ message: 'Examiner assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting examiner assignment', error: error.message });
  }
};

export const getMyExaminerAssignments = async (req, res) => {
  try {
    const examinerId = req.user.id;
    const { phase, assignment_type } = req.query;
    
    const whereClause = {
      examiner_id: examinerId,
      status: 'active'
    };
    
    if (phase) whereClause.phase = phase;
    if (assignment_type) whereClause.assignment_type = assignment_type;

    const assignments = await ExaminerAssignment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: StudentProfile,
            attributes: ['student_id', 'fyp_title', 'current_phase']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching examiner assignments', error: error.message });
  }
};

export const getAvailableExaminers = async (req, res) => {
  try {
    const { student_id } = req.query;

    let excludeSupervisorId = 0;
    if (student_id) {
      const student = await StudentProfile.findOne({
        where: { user_id: student_id }
      });
      excludeSupervisorId = student?.current_supervisor_id || 0;
    }

    const availableExaminers = await User.findAll({
      where: {
        role: 'supervisor',
        is_active: true,
        ...(excludeSupervisorId ? { id: { [Op.ne]: excludeSupervisorId } } : {})
      },
      attributes: ['id', 'name', 'email'],
      include: [{
        model: SupervisorProfile,
        attributes: ['expertise', 'max_students']
      }],
      order: [['name', 'ASC']]
    });

    res.json(availableExaminers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available examiners', error: error.message });
  }
};
