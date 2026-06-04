import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileBarChart, Calendar, Eye, Package, UserCog, BookOpen, ClipboardList } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'classes', label: 'Classes', icon: BookOpen },
  { path: 'tasks', label: 'Tasks', icon: ClipboardList },
  { path: 'students', label: 'Students', icon: Users },
  { path: 'supervisors', label: 'Supervisors', icon: UserCheck },
  { path: 'approvals', label: 'Pending Approvals', icon: UserCog },
  { path: 'examiner-assignments', label: 'Examiner Assignments', icon: Eye },
  { path: 'presentation-sessions', label: 'Presentation Sessions', icon: Calendar },
  // { path: 'schedules', label: 'Schedules', icon: Calendar },
  { path: 'reports', label: 'Reports', icon: FileBarChart },
  // { path: 'resource-library', label: 'Resource Library', icon: BookOpen }, // not needed for my project
  // { path: 'plagiarism-checks', label: 'Plagiarism Checks', icon: Shield }, // not needed for my project
  // { path: 'ethical-approval', label: 'Ethical Approval', icon: ClipboardCheck }, // not needed for my project
  { path: 'deliverables', label: 'Deliverables', icon: Package },
  // { path: 'exhibition', label: 'Exhibition', icon: Award },
];

const titles = {
  dashboard: 'Dashboard',
  classes: 'Class Management',
  tasks: 'Tasks',
  students: 'Students',
  supervisors: 'Supervisors',
  approvals: 'Pending Approvals',
  'examiner-assignments': 'Examiner Assignments',
  'presentation-sessions': 'Presentation Sessions',
  schedules: 'Schedules',
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
