import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Deliverable = sequelize.define('Deliverable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'submissions',
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
  type: {
    type: DataTypes.ENUM('report_pdf', 'report_docx', 'slides', 'poster', 'raw_data', 'system_files', 'apk_exe'),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'deliverables',
  timestamps: true,
  underscored: true
});

export default Deliverable;
