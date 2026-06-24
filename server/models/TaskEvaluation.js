import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaskEvaluation = sequelize.define('TaskEvaluation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tasks', key: 'id' }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'submissions', key: 'id' }
  },
  evaluator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  // Snapshot of the rubric used at time of evaluation (criteria may have changed)
  rubric_snapshot: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // [{criterion_index: 0, score: 7}, ...]
  criteria_scores: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  total_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted'),
    defaultValue: 'draft'
  },
  document_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'task_evaluations',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['task_id', 'student_id'] }
  ]
});

export default TaskEvaluation;
