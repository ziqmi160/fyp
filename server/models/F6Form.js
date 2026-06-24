import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const F6Form = sequelize.define('F6Form', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'submissions', key: 'id' }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  phase: {
    type: DataTypes.ENUM('CSP600', 'CSP650'),
    allowNull: false,
    defaultValue: 'CSP600'
  },
  handover_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  similarity_index: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  ai_index: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  supervisor_signature_img: {
    type: DataTypes.TEXT('medium'),
    allowNull: true
  },
  supervisor_signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  document_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'f6_forms',
  timestamps: true,
  underscored: true
});

export default F6Form;
