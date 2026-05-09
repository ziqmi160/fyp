import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PresentationSchedule = sequelize.define('PresentationSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  presentation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  presentation_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  }
}, {
  tableName: 'presentation_schedules',
  timestamps: true,
  underscored: true
});

export default PresentationSchedule;
