import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EvaluationForm = sequelize.define('EvaluationForm', {
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
  evaluator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  form_type: {
    type: DataTypes.ENUM('F3', 'F4', 'F7', 'F8', 'F9', 'F10', 'F11', 'F13'),
    allowNull: false
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  evaluator_role: {
    type: DataTypes.ENUM('supervisor', 'examiner', 'coordinator'),
    allowNull: false,
    defaultValue: 'supervisor'
  },
  scores: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  total_score: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  max_score: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  presentation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted'),
    defaultValue: 'draft'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  signature_img: {
    type: DataTypes.TEXT('medium'),
    allowNull: true
  },
  signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'evaluation_forms',
  timestamps: true,
  underscored: true
});

export default EvaluationForm;
