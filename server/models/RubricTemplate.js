import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RubricTemplate = sequelize.define('RubricTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  form_type: {
    type: DataTypes.ENUM('F2', 'F3', 'F4', 'F7', 'F8', 'F9', 'F10', 'F11', 'F13'),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // Array of { id, name, description, weight, score_min, score_max, supervisor_only, group }
  criteria: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'rubric_templates',
  timestamps: true,
  underscored: true
});

export default RubricTemplate;
