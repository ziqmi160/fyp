import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Phase = sequelize.define('Phase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  semester: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'phases',
  timestamps: true,
  underscored: true
});

export default Phase;
