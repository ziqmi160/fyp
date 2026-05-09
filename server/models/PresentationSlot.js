import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PresentationSlot = sequelize.define('PresentationSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'presentation_sessions', key: 'id' }
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
  examiner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  room: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  student_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'presentation_slots',
  timestamps: true,
  underscored: true
});

export default PresentationSlot;
