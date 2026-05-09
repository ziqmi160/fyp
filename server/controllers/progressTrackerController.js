import { User, StudentProfile, SupervisionRequest, Submission, MeetingLog, ExaminerAssignment, EvaluationForm, PresentationSlot, Amendment } from '../models/index.js';
import { Op } from 'sequelize';

export const getStudentProgress = async (req, res) => {
  try {
    const studentId = req.user.id;

    const studentProfile = await StudentProfile.findOne({
      where: { user_id: studentId },
      include: [
        {
          model: User,
          as: 'studentUser',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get supervision request status
    const supervisionRequest = await SupervisionRequest.findOne({
      where: { student_id: studentId },
      include: [
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get all submissions
    const submissions = await Submission.findAll({
      where: { student_id: studentId },
      order: [['submitted_at', 'DESC']]
    });

    // Get meeting logs
    const meetingLogs = await MeetingLog.findAll({
      where: { student_id: studentId },
      order: [['meeting_date', 'DESC']]
    });

    // Get examiner assignments
    const examinerAssignments = await ExaminerAssignment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Get evaluation forms
    const evaluationForms = await EvaluationForm.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get presentation slots
    const presentationSlots = await PresentationSlot.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'examiner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['start_time', 'ASC']]
    });

    // Get amendments
    const amendments = await Amendment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Build progress timeline based on current phase
    const timeline = buildProgressTimeline(studentProfile, {
      supervisionRequest,
      submissions,
      meetingLogs,
      examinerAssignments,
      evaluationForms,
      presentationSlots,
      amendments
    });

    res.json({
      studentProfile,
      timeline,
      supervisionRequest,
      submissions,
      meetingLogs,
      examinerAssignments,
      evaluationForms,
      presentationSlots,
      amendments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student progress', error: error.message });
  }
};

function buildProgressTimeline(studentProfile, data) {
  const phase = studentProfile.current_phase;
  const timeline = [];

  if (phase === 'CSP600') {
    // CSP600 Timeline
    timeline.push(
      {
        id: 'register',
        title: 'FYP Registration',
        description: 'Register for FYP and access the system',
        status: 'completed',
        completedAt: studentProfile.created_at
      },
      {
        id: 'find_supervisor',
        title: 'Find Supervisor (F1)',
        description: 'Submit supervision request and get supervisor approval',
        status: data.supervisionRequest?.status === 'accepted' ? 'completed' : 
               data.supervisionRequest?.status === 'pending' ? 'in_progress' : 'pending',
        completedAt: data.supervisionRequest?.updated_at
      },
      {
        id: 'f2_motivation',
        title: 'Project Motivation Evaluation (F2)',
        description: 'Submit F2 form for evaluation',
        status: getSubmissionStatus(data.submissions, 'F2'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'F2')
      },
      {
        id: 'f3_literature',
        title: 'Literature Review Evaluation (F3)',
        description: 'Submit F3 form for evaluation',
        status: getSubmissionStatus(data.submissions, 'F3'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'F3')
      },
      {
        id: 'f4_methodology',
        title: 'Methodology Evaluation (F4)',
        description: 'Submit F4 form for evaluation',
        status: getSubmissionStatus(data.submissions, 'F4'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'F4')
      },
      {
        id: 'f5_consultations',
        title: 'F5 Consultation Meetings',
        description: 'Complete consultation meetings with supervisor',
        status: data.meetingLogs?.length > 0 ? 'completed' : 'pending',
        completedAt: data.meetingLogs?.[0]?.meeting_date
      },
      {
        id: 'bmc_submission',
        title: 'Business Model Canvas',
        description: 'Submit BMC for coordinator review',
        status: getSubmissionStatus(data.submissions, 'BMC'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'BMC')
      },
      {
        id: 'plagiarism_check',
        title: 'Plagiarism Screening',
        description: 'Complete plagiarism check for proposal',
        status: 'pending',
        completedAt: null
      },
      {
        id: 'f6a_submission',
        title: 'Proposal Report Submission (F6a)',
        description: 'Submit proposal report for evaluation',
        status: getSubmissionStatus(data.submissions, 'F6a'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'F6a')
      },
      {
        id: 'proposal_defense',
        title: 'Proposal Defense Presentation',
        description: 'Present and defend your proposal',
        status: getPresentationStatus(data.presentationSlots, 'proposal'),
        completedAt: getPresentationCompletionDate(data.presentationSlots, 'proposal')
      },
      {
        id: 'proposal_amendments',
        title: 'Proposal Amendments',
        description: 'Complete required amendments after defense',
        status: getAmendmentStatus(data.amendments, 'proposal'),
        completedAt: getAmendmentCompletionDate(data.amendments, 'proposal')
      }
    );
  } else if (phase === 'CSP650') {
    // CSP650 Timeline
    timeline.push(
      {
        id: 'register_csp650',
        title: 'FYP Project Registration',
        description: 'Register for CSP650 project phase',
        status: 'completed',
        completedAt: studentProfile.created_at
      },
      {
        id: 'f5_consultations_csp650',
        title: 'F5 Consultation Meetings',
        description: 'Continue consultation meetings with supervisor',
        status: data.meetingLogs?.length > 0 ? 'completed' : 'pending',
        completedAt: data.meetingLogs?.[0]?.meeting_date
      },
      {
        id: 'lmc_submission',
        title: 'Lean Model Canvas (LMC)',
        description: 'Submit LMC for evaluation using F13',
        status: getSubmissionStatus(data.submissions, 'LMC'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'LMC')
      },
      {
        id: 'progress_presentation',
        title: 'Progress Presentation',
        description: 'Present project progress to supervisor',
        status: getPresentationStatus(data.presentationSlots, 'progress'),
        completedAt: getPresentationCompletionDate(data.presentationSlots, 'progress')
      },
      {
        id: 'plagiarism_check_csp650',
        title: 'Plagiarism Screening',
        description: 'Complete plagiarism check for final report',
        status: 'pending',
        completedAt: null
      },
      {
        id: 'f6b_submission',
        title: 'Final Report Submission (F6b)',
        description: 'Submit final FYP report for evaluation',
        status: getSubmissionStatus(data.submissions, 'F6b'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'F6b')
      },
      {
        id: 'final_presentation',
        title: 'Final Presentation & Exhibition',
        description: 'Present final project and participate in exhibition',
        status: getPresentationStatus(data.presentationSlots, 'final'),
        completedAt: getPresentationCompletionDate(data.presentationSlots, 'final')
      },
      {
        id: 'final_amendments',
        title: 'Final Report Amendments',
        description: 'Complete required amendments and F12 form',
        status: getAmendmentStatus(data.amendments, 'final_report'),
        completedAt: getAmendmentCompletionDate(data.amendments, 'final_report')
      },
      {
        id: 'final_deliverables',
        title: 'Final Deliverables Package',
        description: 'Submit complete final package (report, slides, poster, etc.)',
        status: getSubmissionStatus(data.submissions, 'final_package'),
        completedAt: getSubmissionCompletionDate(data.submissions, 'final_package')
      }
    );
  }

  return timeline;
}

function getSubmissionStatus(submissions, type) {
  const submission = submissions?.find(s => s.submission_type === type);
  if (!submission) return 'pending';
  if (submission.status === 'approved') return 'completed';
  if (submission.status === 'revision_required') return 'in_progress';
  return 'in_progress';
}

function getSubmissionCompletionDate(submissions, type) {
  const submission = submissions?.find(s => s.submission_type === type);
  return submission?.status === 'approved' ? submission.reviewed_at : null;
}

function getPresentationStatus(presentationSlots, type) {
  const slot = presentationSlots?.find(s => {
    const session = s.PresentationSession;
    return session?.session_type === type;
  });
  if (!slot) return 'pending';
  if (slot.status === 'completed') return 'completed';
  if (slot.status === 'confirmed') return 'in_progress';
  return 'pending';
}

function getPresentationCompletionDate(presentationSlots, type) {
  const slot = presentationSlots?.find(s => {
    const session = s.PresentationSession;
    return session?.session_type === type;
  });
  return slot?.status === 'completed' ? slot.updated_at : null;
}

function getAmendmentStatus(amendments, type) {
  const amendment = amendments?.find(a => a.amendment_type === type);
  if (!amendment) return 'pending';
  if (amendment.f12_status === 'completed') return 'completed';
  if (amendment.f12_status !== 'pending') return 'in_progress';
  return 'pending';
}

function getAmendmentCompletionDate(amendments, type) {
  const amendment = amendments?.find(a => a.amendment_type === type);
  return amendment?.f12_status === 'completed' ? amendment.completed_at : null;
}
