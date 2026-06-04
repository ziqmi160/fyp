import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StudentProfile = sequelize.define('StudentProfile', {
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
  student_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  programme: {
    type: DataTypes.STRING(100)
  },
  group_name: {
    type: DataTypes.STRING(10)
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'classes', key: 'id' }
  },
  current_supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  examiner_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  current_phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    defaultValue: 'CSP600'
  },
  fyp_title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  fyp_status: {
    type: DataTypes.ENUM('no_supervisor', 'pending_approval', 'active', 'submitted', 'completed'),
    defaultValue: 'no_supervisor'
  },
  project_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  title_status: {
    type: DataTypes.ENUM('not_submitted', 'pending', 'approved', 'rejected'),
    defaultValue: 'not_submitted'
  },
  title_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'student_profiles',
  timestamps: true,
  underscored: true
});

export default StudentProfile;
