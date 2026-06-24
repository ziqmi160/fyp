import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MeetingLog = sequelize.define('MeetingLog', {
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
  meeting_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  meeting_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255)
  },
  agenda: {
    type: DataTypes.TEXT
  },
  student_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supervisor_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  outcome: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  completed_activity: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supervisor_signature_img: {
    type: DataTypes.TEXT('medium'),
    allowNull: true
  },
  student_signature_img: {
    type: DataTypes.TEXT('medium'),
    allowNull: true
  },
  supervisor_signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  student_signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'meeting_logs',
  timestamps: true,
  underscored: true
});

export default MeetingLog;
