import bcrypt from 'bcryptjs';
import { User, StudentProfile, SupervisorProfile, SupervisionRequest, Submission, SubmissionAttachment, MeetingLog, Notification } from '../models/index.js';

const hashedPassword = bcrypt.hashSync('password123', 10);

async function seed() {
  try {
    await User.destroy({ where: {}, force: true });

    const users = await User.bulkCreate([
      { name: 'Coordinator Admin', email: 'coordinator@fyp.com', password: hashedPassword, role: 'coordinator' },
      { name: 'Dr. Ahmad Rahman', email: 'supervisor1@fyp.com', password: hashedPassword, role: 'supervisor' },
      { name: 'Dr. Siti Aminah', email: 'supervisor2@fyp.com', password: hashedPassword, role: 'supervisor' },
      { name: 'Dr. Mohammed Yusof', email: 'supervisor3@fyp.com', password: hashedPassword, role: 'supervisor' },
      { name: 'Ali bin Abu', email: 'student@fyp.com', password: hashedPassword, role: 'student' },
      { name: 'Fatimah Hassan', email: 'student2@fyp.com', password: hashedPassword, role: 'student' },
      { name: 'Ahmad Zaki', email: 'student3@fyp.com', password: hashedPassword, role: 'student' },
      { name: 'Nurul Izzah', email: 'student4@fyp.com', password: hashedPassword, role: 'student' },
      { name: 'Lee Wei Ming', email: 'student5@fyp.com', password: hashedPassword, role: 'student' },
      { name: 'Sarah Johnson', email: 'student6@fyp.com', password: hashedPassword, role: 'student' }
    ]);

    await SupervisorProfile.bulkCreate([
      { user_id: users[1].id, staff_id: 'S001', expertise: 'Artificial Intelligence, Machine Learning', max_students: 5, current_student_count: 2, is_accepting: true },
      { user_id: users[2].id, staff_id: 'S002', expertise: 'Web Development, Cloud Computing', max_students: 4, current_student_count: 4, is_accepting: true },
      { user_id: users[3].id, staff_id: 'S003', expertise: 'Cybersecurity, Network Systems', max_students: 5, current_student_count: 0, is_accepting: true }
    ]);

    await StudentProfile.bulkCreate([
      { user_id: users[4].id, student_number: '2020123456', programme: 'CS230', group_name: 'CS5A', current_supervisor_id: users[1].id, fyp_title: 'AI-based Recommendation System', fyp_status: 'active' },
      { user_id: users[5].id, student_number: '2020123457', programme: 'CS230', group_name: 'CS5A', current_supervisor_id: users[1].id, fyp_title: 'Machine Learning for Fraud Detection', fyp_status: 'active' },
      { user_id: users[6].id, student_number: '2020123458', programme: 'CS230', group_name: 'CS5B', current_supervisor_id: users[2].id, fyp_title: 'Cloud-based E-commerce Platform', fyp_status: 'active' },
      { user_id: users[7].id, student_number: '2020123459', programme: 'CS230', group_name: 'CS5B', current_supervisor_id: null, fyp_title: null, fyp_status: 'pending_approval' },
      { user_id: users[8].id, student_number: '2020123460', programme: 'CS230', group_name: 'CS5C', current_supervisor_id: null, fyp_title: null, fyp_status: 'no_supervisor' },
      { user_id: users[9].id, student_number: '2020123461', programme: 'CS230', group_name: 'CS5C', current_supervisor_id: users[2].id, fyp_title: 'Mobile App for Campus Services', fyp_status: 'completed' }
    ]);

    await SupervisionRequest.bulkCreate([
      { student_id: users[7].id, supervisor_id: users[3].id, title_proposed: 'Network Security Monitoring Tool', message: 'I am interested in this area.', status: 'pending' },
      { student_id: users[8].id, supervisor_id: users[1].id, title_proposed: 'NLP for Malay Language', message: 'Please consider my request.', status: 'pending' }
    ]);

    const submissions = await Submission.bulkCreate([
      { student_id: users[4].id, supervisor_id: users[1].id, title: 'Proposal Draft', submission_type: 'proposal', status: 'approved', submitted_at: new Date() },
      { student_id: users[5].id, supervisor_id: users[1].id, title: 'Progress Report 1', submission_type: 'progress_report', status: 'pending', submitted_at: new Date() },
      { student_id: users[6].id, supervisor_id: users[2].id, title: 'Chapter 1-3 Draft', submission_type: 'draft', status: 'revision_required', submitted_at: new Date(), supervisor_feedback: 'Please revise section 2.3' },
      { student_id: users[4].id, supervisor_id: users[1].id, title: 'Final Submission', submission_type: 'final', status: 'approved', submitted_at: new Date() }
    ]);

    await MeetingLog.bulkCreate([
      { student_id: users[4].id, supervisor_id: users[1].id, meeting_date: '2025-03-25', meeting_time: '10:00:00', location: 'Online - Google Meet', agenda: 'Proposal discussion', status: 'scheduled', created_by: users[4].id },
      { student_id: users[5].id, supervisor_id: users[1].id, meeting_date: '2025-03-20', meeting_time: '14:00:00', location: 'Faculty Room', agenda: 'Progress review', status: 'completed', created_by: users[1].id },
      { student_id: users[6].id, supervisor_id: users[2].id, meeting_date: '2025-03-22', meeting_time: '11:00:00', location: 'Online - Teams', agenda: 'Draft feedback', status: 'scheduled', created_by: users[6].id }
    ]);

    await Notification.bulkCreate([
      { user_id: users[1].id, title: 'New Submission', message: 'Ali bin Abu submitted Progress Report 1', type: 'info', is_read: false },
      { user_id: users[4].id, title: 'Submission Approved', message: 'Your proposal has been approved', type: 'success', is_read: false },
      { user_id: users[7].id, title: 'Request Pending', message: 'Your supervision request is under review', type: 'info', is_read: true },
      { user_id: users[2].id, title: 'Meeting Reminder', message: 'Meeting with Ahmad Zaki tomorrow', type: 'warning', is_read: false },
      { user_id: users[6].id, title: 'Revision Required', message: 'Your draft needs revision in section 2.3', type: 'warning', is_read: false }
    ]);

    console.log('Seed completed. Test accounts:');
    console.log('  coordinator@fyp.com / password123');
    console.log('  supervisor1@fyp.com / password123');
    console.log('  supervisor2@fyp.com / password123');
    console.log('  supervisor3@fyp.com / password123');
    console.log('  student@fyp.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
