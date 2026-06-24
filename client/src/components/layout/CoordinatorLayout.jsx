import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileBarChart, UserCog, BookOpen, ClipboardList, ClipboardCheck, FileText, FolderDown, Award } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'classes', label: 'Classes', icon: BookOpen },
  { path: 'tasks', label: 'Tasks', icon: ClipboardList },
  { path: 'students', label: 'Students', icon: Users },
  { path: 'supervisors', label: 'Supervisors', icon: UserCheck },
  { path: 'approvals', label: 'Supervisor Registrations', icon: UserCog },
  // Examiner assignment is handled inline in the Students page (edit student modal)
  // { path: 'examiner-assignments', label: 'Examiner Assignments', icon: Eye },
  // { path: 'presentation-sessions', label: 'Presentation Sessions', icon: Calendar },
  // { path: 'schedules', label: 'Schedules', icon: Calendar },
  { path: 'evaluation-forms', label: 'Evaluation', icon: FileText },
  { path: 'marks', label: 'Marks', icon: Award },
  { path: 'student-documents', label: 'Student Documents', icon: FolderDown },
  { path: 'rubric-templates', label: 'Rubric Templates', icon: ClipboardCheck },
  { path: 'reports', label: 'Reports', icon: FileBarChart },
];

const titles = {
  dashboard: 'Dashboard',
  classes: 'Class Management',
  tasks: 'Tasks',
  students: 'Students',
  supervisors: 'Supervisors',
  approvals: 'Supervisor Registrations',
  'examiner-assignments': 'Examiner Assignments',
  'presentation-sessions': 'Presentation Sessions',
  schedules: 'Schedules',
  'evaluation-forms': 'Evaluation',
  marks: 'Student Marks',
  'student-documents': 'Student Documents',
  'rubric-templates': 'Rubric Templates',
  reports: 'Reports',
  'resource-library': 'Resource Library',
  'plagiarism-checks': 'Plagiarism Checks',
  'ethical-approval': 'Ethical Approval',
  deliverables: 'Deliverables',
  exhibition: 'Exhibition',
};

export default function CoordinatorLayout() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || 'dashboard';
  return (
    <MainLayout navItems={navItems} basePath="/coordinator" title={titles[segment] || 'Coordinator Portal'}>
      <Outlet />
    </MainLayout>
  );
}
