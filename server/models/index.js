import sequelize from '../config/database.js';
import User from './User.js';
import Class from './Class.js';
import Task from './Task.js';
import StudentProfile from './StudentProfile.js';
import SupervisorProfile from './SupervisorProfile.js';
import SupervisionRequest from './SupervisionRequest.js';
import Submission from './Submission.js';
import SubmissionAttachment from './SubmissionAttachment.js';
import MeetingLog from './MeetingLog.js';
import OfficialDocument from './OfficialDocument.js';
import Notification from './Notification.js';
import Evaluation from './Evaluation.js';
import PresentationSchedule from './PresentationSchedule.js';
import Phase from './Phase.js';
import ExaminerAssignment from './ExaminerAssignment.js';
import EvaluationForm from './EvaluationForm.js';
import PresentationSession from './PresentationSession.js';
import PresentationSlot from './PresentationSlot.js';
import Amendment from './Amendment.js';
import ConsultationMeetingFactory from './ConsultationMeeting.js';
import ResourceLibrary from './ResourceLibrary.js';
import PlagiarismCheck from './PlagiarismCheck.js';
import EthicalApproval from './EthicalApproval.js';
import Deliverable from './Deliverable.js';
import Exhibition from './Exhibition.js';
import ExhibitionAttendance from './ExhibitionAttendance.js';
const ConsultationMeeting = ConsultationMeetingFactory(sequelize);

// Class associations
Class.belongsTo(User, { foreignKey: 'coordinator_id', as: 'coordinator' });
User.hasMany(Class, { foreignKey: 'coordinator_id', as: 'classes' });
Class.hasMany(StudentProfile, { foreignKey: 'class_id', as: 'students' });
StudentProfile.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

// Task associations
Task.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Class.hasMany(Task, { foreignKey: 'class_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.hasMany(Submission, { foreignKey: 'task_id', as: 'submissions' });
Submission.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// User associations
User.hasOne(StudentProfile, { foreignKey: 'user_id' });
User.hasOne(SupervisorProfile, { foreignKey: 'user_id' });
User.hasMany(SupervisionRequest, { foreignKey: 'student_id' });
User.hasMany(SupervisionRequest, { foreignKey: 'supervisor_id' });
User.hasMany(Submission, { foreignKey: 'student_id' });
User.hasMany(Submission, { foreignKey: 'supervisor_id' });
User.hasMany(MeetingLog, { foreignKey: 'student_id' });
User.hasMany(MeetingLog, { foreignKey: 'supervisor_id' });
User.hasMany(MeetingLog, { foreignKey: 'created_by' });
User.hasMany(OfficialDocument, { foreignKey: 'student_id' });
User.hasMany(OfficialDocument, { foreignKey: 'supervisor_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });
User.hasMany(Evaluation, { foreignKey: 'student_id' });
User.hasMany(Evaluation, { foreignKey: 'evaluator_id' });

// New model associations
User.hasMany(ExaminerAssignment, { foreignKey: 'student_id' });
User.hasMany(ExaminerAssignment, { foreignKey: 'examiner_id' });
User.hasMany(ExaminerAssignment, { foreignKey: 'assigned_by' });
User.hasMany(EvaluationForm, { foreignKey: 'student_id' });
User.hasMany(EvaluationForm, { foreignKey: 'evaluator_id' });
User.hasMany(PresentationSession, { foreignKey: 'created_by' });
User.hasMany(PresentationSlot, { foreignKey: 'student_id' });
User.hasMany(PresentationSlot, { foreignKey: 'supervisor_id' });
User.hasMany(PresentationSlot, { foreignKey: 'examiner_id' });
User.hasMany(Amendment, { foreignKey: 'student_id',as: 'StudentAmendments'});
User.hasMany(Amendment, { foreignKey: 'evaluator_id' ,as: 'EvaluatedAmendments'});
User.hasMany(ConsultationMeeting, { foreignKey: 'student_id' });
User.hasMany(ConsultationMeeting, { foreignKey: 'supervisor_id' });

StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'studentUser' });
StudentProfile.belongsTo(User, { foreignKey: 'current_supervisor_id', as: 'supervisor' });
StudentProfile.belongsTo(User, { foreignKey: 'examiner_id', as: 'examiner' });
SupervisorProfile.belongsTo(User, { foreignKey: 'user_id' });

SupervisionRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
SupervisionRequest.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });

Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });
Submission.hasMany(SubmissionAttachment, { foreignKey: 'submission_id' });
SubmissionAttachment.belongsTo(Submission, { foreignKey: 'submission_id' });

MeetingLog.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
MeetingLog.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });
MeetingLog.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

OfficialDocument.belongsTo(User, { foreignKey: 'student_id' });
OfficialDocument.belongsTo(User, { foreignKey: 'supervisor_id' });

Notification.belongsTo(User, { foreignKey: 'user_id' });

Evaluation.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });

PresentationSchedule.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
User.hasMany(PresentationSchedule, { foreignKey: 'student_id' });

// New model relationships
ExaminerAssignment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ExaminerAssignment.belongsTo(User, { foreignKey: 'examiner_id', as: 'examiner' });
ExaminerAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

EvaluationForm.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
EvaluationForm.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });

PresentationSession.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PresentationSession.hasMany(PresentationSlot, { foreignKey: 'session_id' });
PresentationSlot.belongsTo(PresentationSession, { foreignKey: 'session_id' });

PresentationSlot.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
PresentationSlot.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });
PresentationSlot.belongsTo(User, { foreignKey: 'examiner_id', as: 'examiner' });

Amendment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Amendment.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });
Amendment.belongsTo(Submission, { foreignKey: 'submission_id' });
Amendment.belongsTo(Submission, { foreignKey: 'amended_submission_id', as: 'amendedSubmission' });

ConsultationMeeting.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ConsultationMeeting.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });

// Medium & Low Priority Features Associations
PlagiarismCheck.belongsTo(Submission, { foreignKey: 'submission_id' });
PlagiarismCheck.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.hasOne(PlagiarismCheck, { foreignKey: 'submission_id' });

EthicalApproval.belongsTo(User, { foreignKey: 'student_id' });
User.hasOne(EthicalApproval, { foreignKey: 'student_id' });

Deliverable.belongsTo(Submission, { foreignKey: 'submission_id' });
Deliverable.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.hasMany(Deliverable, { foreignKey: 'submission_id' });

Exhibition.belongsTo(Phase, { foreignKey: 'phase_id' });
Exhibition.belongsTo(User, { foreignKey: 'coordinator_id', as: 'coordinator' });
Phase.hasMany(Exhibition, { foreignKey: 'phase_id' });

ExhibitionAttendance.belongsTo(Exhibition, { foreignKey: 'exhibition_id' });
ExhibitionAttendance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Exhibition.hasMany(ExhibitionAttendance, { foreignKey: 'exhibition_id' });
User.hasMany(ExhibitionAttendance, { foreignKey: 'student_id' });

export {
  sequelize,
  User,
  Class,
  Task,
  StudentProfile,
  SupervisorProfile,
  SupervisionRequest,
  Submission,
  SubmissionAttachment,
  MeetingLog,
  OfficialDocument,
  Notification,
  Evaluation,
  PresentationSchedule,
  Phase,
  ExaminerAssignment,
  EvaluationForm,
  PresentationSession,
  PresentationSlot,
  Amendment,
  ConsultationMeeting,
  ResourceLibrary,
  PlagiarismCheck,
  EthicalApproval,
  Deliverable,
  Exhibition,
  ExhibitionAttendance
};
