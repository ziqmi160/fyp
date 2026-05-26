import { Exhibition, ExhibitionAttendance, Phase, User } from '../models/index.js';

export const createExhibition = async (req, res) => {
  try {
    const { title, description, event_date, venue, start_time, end_time, phase_id } = req.body;
    const coordinator_id = req.user.id;

    if (!title || !event_date || !venue || !phase_id) {
      return res.status(400).json({ success: false, error: 'Title, event date, venue, and phase are required.' });
    }

    const phase = await Phase.findByPk(phase_id);
    if (!phase) {
      return res.status(404).json({ success: false, error: 'Phase not found.' });
    }

    const exhibition = await Exhibition.create({
      title,
      description,
      event_date,
      venue,
      start_time,
      end_time,
      phase_id,
      coordinator_id
    });

    res.status(201).json({
      success: true,
      data: exhibition,
      message: 'Exhibition created successfully.'
    });
  } catch (error) {
    console.error('Create exhibition error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getExhibitions = async (req, res) => {
  try {
    const { phase_id } = req.query;
    const where = {};

    if (phase_id) where.phase_id = phase_id;

    const exhibitions = await Exhibition.findAll({
      where,
      include: [
        {
          model: Phase,
          attributes: ['id', 'name', 'phase_name']
        },
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExhibitionAttendance,
          attributes: ['id', 'student_id', 'attended', 'check_in_time']
        }
      ],
      order: [['event_date', 'DESC']]
    });

    res.json({
      success: true,
      data: exhibitions
    });
  } catch (error) {
    console.error('Get exhibitions error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getExhibitionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const exhibition = await Exhibition.findByPk(id, {
      include: [
        {
          model: Phase,
          attributes: ['id', 'name', 'phase_name']
        },
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExhibitionAttendance,
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    res.json({
      success: true,
      data: exhibition
    });
  } catch (error) {
    console.error('Get exhibition detail error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateExhibition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, venue, start_time, end_time } = req.body;

    const exhibition = await Exhibition.findByPk(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    await exhibition.update({
      title: title || exhibition.title,
      description: description || exhibition.description,
      event_date: event_date || exhibition.event_date,
      venue: venue || exhibition.venue,
      start_time: start_time || exhibition.start_time,
      end_time: end_time || exhibition.end_time
    });

    res.json({
      success: true,
      data: exhibition,
      message: 'Exhibition updated.'
    });
  } catch (error) {
    console.error('Update exhibition error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const announceExhibitionBriefing = async (req, res) => {
  try {
    const { id } = req.params;
    const { briefing_content } = req.body;

    const exhibition = await Exhibition.findByPk(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    await exhibition.update({
      briefing_content,
      briefing_announced: true
    });

    res.json({
      success: true,
      data: exhibition,
      message: 'Exhibition briefing announced.'
    });
  } catch (error) {
    console.error('Announce briefing error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const registerExhibitionAttendance = async (req, res) => {
  try {
    const { exhibition_id } = req.params;
    const student_id = req.user.id;

    const exhibition = await Exhibition.findByPk(exhibition_id);
    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    let attendance = await ExhibitionAttendance.findOne({
      where: { exhibition_id, student_id }
    });

    if (!attendance) {
      attendance = await ExhibitionAttendance.create({
        exhibition_id,
        student_id,
        attended: false
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Exhibition attendance registered.'
    });
  } catch (error) {
    console.error('Register attendance error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const checkInExhibition = async (req, res) => {
  try {
    const { exhibition_id } = req.params;
    const student_id = req.user.id;

    let attendance = await ExhibitionAttendance.findOne({
      where: { exhibition_id, student_id }
    });

    if (!attendance) {
      attendance = await ExhibitionAttendance.create({
        exhibition_id,
        student_id,
        attended: true,
        check_in_time: new Date()
      });
    } else {
      await attendance.update({
        attended: true,
        check_in_time: new Date()
      });
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Exhibition check-in recorded.'
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const getExhibitionAttendanceReport = async (req, res) => {
  try {
    const { id } = req.params;

    const exhibition = await Exhibition.findByPk(id, {
      include: [
        {
          model: ExhibitionAttendance,
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    const totalRegistered = exhibition.ExhibitionAttendances.length;
    const totalAttended = exhibition.ExhibitionAttendances.filter(a => a.attended).length;

    res.json({
      success: true,
      data: {
        exhibition,
        attendanceStats: {
          totalRegistered,
          totalAttended,
          attendanceRate: totalRegistered > 0 ? ((totalAttended / totalRegistered) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deleteExhibition = async (req, res) => {
  try {
    const { id } = req.params;

    const exhibition = await Exhibition.findByPk(id);
    if (!exhibition) {
      return res.status(404).json({ success: false, error: 'Exhibition not found.' });
    }

    // Delete associated attendance records first
    await ExhibitionAttendance.destroy({
      where: { exhibition_id: id }
    });

    await exhibition.destroy();

    res.json({
      success: true,
      message: 'Exhibition deleted.'
    });
  } catch (error) {
    console.error('Delete exhibition error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
