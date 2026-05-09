import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExaminerAssignment = sequelize.define('ExaminerAssignment', {
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
  examiner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  assignment_type: {
    type: DataTypes.ENUM('proposal', 'final'),
    allowNull: false
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('active', 'completed'),
    defaultValue: 'active'
  }
}, {
  tableName: 'examiner_assignments',
  timestamps: true,
  underscored: true
});

export default ExaminerAssignment;
