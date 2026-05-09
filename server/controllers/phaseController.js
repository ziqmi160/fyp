import { Phase, StudentProfile } from '../models/index.js';
import { Op } from 'sequelize';

export const getPhases = async (req, res) => {
  try {
    const phases = await Phase.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(phases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching phases', error: error.message });
  }
};

export const createPhase = async (req, res) => {
  try {
    const { name, academic_year, semester, start_date, end_date, description } = req.body;

    // Deactivate all existing phases of the same type
    await Phase.update(
      { is_active: false },
      { where: { name } }
    );

    const phase = await Phase.create({
      name,
      academic_year,
      semester,
      start_date,
      end_date,
      description,
      is_active: true
    });

    res.status(201).json(phase);
  } catch (error) {
    res.status(500).json({ message: 'Error creating phase', error: error.message });
  }
};

export const updatePhase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, academic_year, semester, start_date, end_date, description, is_active } = req.body;

    const phase = await Phase.findByPk(id);
    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    // If activating this phase, deactivate all others of the same type
    if (is_active) {
      await Phase.update(
        { is_active: false },
        { 
          where: { 
            name: name || phase.name,
            id: { [Op.ne]: id }
          }
        }
      );
    }

    await phase.update({
      name,
      academic_year,
      semester,
      start_date,
      end_date,
      description,
      is_active
    });

    res.json(phase);
  } catch (error) {
    res.status(500).json({ message: 'Error updating phase', error: error.message });
  }
};

export const deletePhase = async (req, res) => {
  try {
    const { id } = req.params;
    const phase = await Phase.findByPk(id);
    
    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    // Check if any students are in this phase
    const studentsInPhase = await StudentProfile.count({
      where: { current_phase: phase.name }
    });

    if (studentsInPhase > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete phase. Students are currently assigned to this phase.' 
      });
    }

    await phase.destroy();
    res.json({ message: 'Phase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting phase', error: error.message });
  }
};

export const getActivePhase = async (req, res) => {
  try {
    const { phaseName } = req.query;
    const whereClause = { is_active: true };
    
    if (phaseName) {
      whereClause.name = phaseName;
    }

    const activePhase = await Phase.findOne({
      where: whereClause
    });

    res.json(activePhase);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active phase', error: error.message });
  }
};

export const advanceStudentPhase = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { targetPhase } = req.body;

    const studentProfile = await StudentProfile.findOne({
      where: { user_id: studentId }
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Verify the target phase exists and is active
    const targetPhaseData = await Phase.findOne({
      where: { name: targetPhase, is_active: true }
    });

    if (!targetPhaseData) {
      return res.status(400).json({ message: 'Target phase is not active' });
    }

    await studentProfile.update({ current_phase: targetPhase });
    res.json({ message: 'Student phase updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student phase', error: error.message });
  }
};
