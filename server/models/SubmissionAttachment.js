import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SubmissionAttachment = sequelize.define('SubmissionAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'submissions', key: 'id' },
    onDelete: 'CASCADE'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'submission_attachments',
  timestamps: false,
  underscored: true
});

export default SubmissionAttachment;
