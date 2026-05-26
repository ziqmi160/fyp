import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExhibitionAttendance = sequelize.define('ExhibitionAttendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  exhibition_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exhibitions',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  attended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  check_in_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'exhibition_attendance',
  timestamps: true,
  underscored: true
});

export default ExhibitionAttendance;
