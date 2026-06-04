import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  coordinator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  academic_year: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  semester: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'classes',
  timestamps: true,
  underscored: true
});

export default Class;
