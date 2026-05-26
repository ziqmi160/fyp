import { EthicalApproval, User } from '../models/index.js';

export const getEthicalApprovalStatus = async (req, res) => {
  try {
    const student_id = req.user.id;

    let ethicalApproval = await EthicalApproval.findOne({
      where: { student_id }
    });

    // Create record if doesn't exist
    if (!ethicalApproval) {
      ethicalApproval = await EthicalApproval.create({
        student_id,
        required: false,
        status: 'not_required'
      });
    }

    res.json({
      success: true,
      data: ethicalApproval
    });
  } catch (error) {
    console.error('Get ethical approval error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const submitRecForm = async (req, res) => {
  try {
    const student_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    let ethicalApproval = await EthicalApproval.findOne({
      where: { student_id }
    });

    if (!ethicalApproval) {
      ethicalApproval = await EthicalApproval.create({
        student_id,
        rec_form_file: req.file.path,
        status: 'pending'
      });
    } else {
      await ethicalApproval.update({
        rec_form_file: req.file.path,
        status: 'pending'
      });
    }

    res.json({
      success: true,
      data: ethicalApproval,
      message: 'REC form submitted for approval.'
    });
  } catch (error) {
    console.error('Submit REC form error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getAllEthicalApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) where.status = status;

    const approvals = await EthicalApproval.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Get ethical approvals error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateEthicalApprovalStatus = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { status, coordinator_notes } = req.body;

    const ethicalApproval = await EthicalApproval.findOne({
      where: { student_id }
    });

    if (!ethicalApproval) {
      return res.status(404).json({ success: false, error: 'Ethical approval record not found.' });
    }

    await ethicalApproval.update({
      status,
      coordinator_notes,
      approval_date: status === 'approved' || status === 'waived' ? new Date() : null
    });

    res.json({
      success: true,
      data: ethicalApproval,
      message: 'Ethical approval status updated.'
    });
  } catch (error) {
    console.error('Update ethical approval error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const setEthicalApprovalRequired = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { required } = req.body;

    let ethicalApproval = await EthicalApproval.findOne({
      where: { student_id }
    });

    if (!ethicalApproval) {
      ethicalApproval = await EthicalApproval.create({
        student_id,
        required,
        status: required ? 'pending' : 'not_required'
      });
    } else {
      await ethicalApproval.update({
        required,
        status: required ? (ethicalApproval.status === 'not_required' ? 'pending' : ethicalApproval.status) : 'not_required'
      });
    }

    res.json({
      success: true,
      data: ethicalApproval,
      message: `Ethical approval requirement ${required ? 'enabled' : 'disabled'}.`
    });
  } catch (error) {
    console.error('Set ethical approval required error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
