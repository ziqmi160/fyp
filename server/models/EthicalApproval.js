import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EthicalApproval = sequelize.define('EthicalApproval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether ethical approval is needed for this student'
  },
  rec_form_file: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to submitted REC form'
  },
  status: {
    type: DataTypes.ENUM('not_required', 'pending', 'approved', 'waived'),
    defaultValue: 'not_required'
  },
  approval_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  coordinator_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ethical_approvals',
  timestamps: true,
  underscored: true
});

export default EthicalApproval;
