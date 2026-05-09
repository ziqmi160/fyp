import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupervisorProfile = sequelize.define('SupervisorProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' }
  },
  staff_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  expertise: {
    type: DataTypes.TEXT
  },
  max_students: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  current_student_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_accepting: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'supervisor_profiles',
  timestamps: true,
  underscored: true
});

export default SupervisorProfile;
