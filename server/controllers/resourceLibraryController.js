import { ResourceLibrary } from '../models/index.js';

export const getResourceLibrary = async (req, res) => {
  try {
    const { type, specialization } = req.query;
    const where = {};
    
    if (type) where.type = type;
    if (specialization) where.specialization = specialization;

    const resources = await ResourceLibrary.findAll({
      where,
      order: [['year', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Get resource library error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const createResource = async (req, res) => {
  try {
    const { title, year, specialization, description, type } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, error: 'Title and type are required.' });
    }

    const resource = await ResourceLibrary.create({
      title,
      year,
      specialization,
      description,
      type
    });

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource added to library.'
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, year, specialization, description, type } = req.body;

    const resource = await ResourceLibrary.findByPk(id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found.' });
    }

    await resource.update({
      title: title || resource.title,
      year: year || resource.year,
      specialization: specialization || resource.specialization,
      description: description || resource.description,
      type: type || resource.type
    });

    res.json({
      success: true,
      data: resource,
      message: 'Resource updated.'
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await ResourceLibrary.findByPk(id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found.' });
    }

    await resource.destroy();

    res.json({
      success: true,
      message: 'Resource deleted.'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
