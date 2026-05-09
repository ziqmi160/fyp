import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OfficialDocument = sequelize.define('OfficialDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  document_type: {
    type: DataTypes.ENUM('mutual_acceptance', 'progress_report_form', 'evaluation_form'),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'official_documents',
  timestamps: true,
  underscored: true
});

export default OfficialDocument;
