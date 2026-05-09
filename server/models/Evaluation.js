import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Evaluation = sequelize.define('Evaluation', {
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
    type: DataTypes.ENUM('F7', 'F8', 'F9', 'F10', 'F11', 'F13'),
    allowNull: false
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  rubric_scores: {
    type: DataTypes.JSON,
    allowNull: false
  },
  total_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'evaluations',
  timestamps: true,
  underscored: true
});

export default Evaluation;
