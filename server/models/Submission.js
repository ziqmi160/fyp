import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  submission_type: {
    type: DataTypes.ENUM('proposal', 'progress_report', 'draft', 'final', 'F2', 'F3', 'F4', 'BMC', 'LMC', 'F6a', 'F6b', 'final_package'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  external_link: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'approved', 'revision_required'),
    defaultValue: 'pending'
  },
  supervisor_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'submissions',
  timestamps: true,
  underscored: true
});

export default Submission;
