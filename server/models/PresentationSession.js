import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PresentationSession = sequelize.define('PresentationSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  session_type: {
    type: DataTypes.ENUM('proposal', 'progress', 'final'),
    allowNull: false
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'presentation_sessions',
  timestamps: true,
  underscored: true
});

export default PresentationSession;
