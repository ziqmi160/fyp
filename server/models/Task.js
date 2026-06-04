import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'classes', key: 'id' }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  order_index: {
    // controls display order within a class (e.g. Chapter 1 before Chapter 2)
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true
});

export default Task;
