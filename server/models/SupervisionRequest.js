import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupervisionRequest = sequelize.define('SupervisionRequest', {
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
  title_proposed: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  rejected_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'supervision_requests',
  timestamps: true,
  underscored: true
});

export default SupervisionRequest;
