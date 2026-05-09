import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
    defaultValue: 'info'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  related_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Notification;
