import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'supervisor', 'coordinator', 'super_admin'),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  approval_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: true,
    defaultValue: null
  },
  coordinator_phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: true,
    defaultValue: null
  },
  signature: {
    type: DataTypes.TEXT('medium'),
    allowNull: true,
    defaultValue: null
  },
  is_multi_role: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

export default User;
