import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Exhibition = sequelize.define('Exhibition', {
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
  event_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  phase_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'phases',
      key: 'id'
    }
  },
  coordinator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  briefing_announced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  briefing_content: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'exhibitions',
  timestamps: true,
  underscored: true
});

export default Exhibition;
