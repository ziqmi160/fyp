import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Amendment = sequelize.define('Amendment', {
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
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'submissions', key: 'id' }
  },
  evaluator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  amendment_type: {
    type: DataTypes.ENUM('proposal', 'final_report'),
    allowNull: false
  },
  original_feedback: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amended_submission_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'submissions', key: 'id' }
  },
  f12_status: {
    type: DataTypes.ENUM('pending', 'examiner_approved', 'supervisor_approved', 'completed'),
    defaultValue: 'pending'
  },
  examiner_signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supervisor_signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  examiner_signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  supervisor_signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'amendments',
  timestamps: true,
  underscored: true
});

export default Amendment;
