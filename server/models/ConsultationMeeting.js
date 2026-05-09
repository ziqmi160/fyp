import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ConsultationMeeting = sequelize.define('ConsultationMeeting', {
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
    supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: true
    },
    meeting_type: {
      type: DataTypes.ENUM('proposal_discussion', 'progress_review', 'final_review', 'consultation'),
      defaultValue: 'consultation'
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    student_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    supervisor_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    f5_form_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    student_signed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    supervisor_signed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    student_signature_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    supervisor_signature_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    phase: {
      type: DataTypes.ENUM('CSP600', 'CSP650'),
      allowNull: false
    }
  }, {
    tableName: 'consultation_meetings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ConsultationMeeting;
};
