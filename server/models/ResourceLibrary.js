import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ResourceLibrary = sequelize.define('ResourceLibrary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('title', 'specialization'),
    allowNull: false,
    defaultValue: 'title'
  }
}, {
  tableName: 'resource_library',
  timestamps: true,
  underscored: true
});

export default ResourceLibrary;
