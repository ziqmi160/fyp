import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlagiarismCheck = sequelize.define('PlagiarismCheck', {
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
  report_file: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Path to uploaded plagiarism report/screenshot'
  },
  similarity_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Plagiarism similarity percentage if extracted'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'flagged'),
    defaultValue: 'pending'
  },
  coordinator_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checked_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'plagiarism_checks',
  timestamps: true,
  underscored: true
});

export default PlagiarismCheck;
