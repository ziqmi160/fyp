import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileText, Calendar, ClipboardList } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'tasks', label: 'My Tasks', icon: ClipboardList },
  // Evaluation forms are shown inside tasks; no separate page needed
  // { path: 'forms', label: 'Evaluation Forms', icon: FileText },
  // Presentations and amendments pages removed; feedback is visible in tasks
  // { path: 'presentations', label: 'Presentations & Amendments', icon: Video },
  { path: 'supervisors', label: 'Supervisor Marketplace', icon: Users },
  { path: 'supervisor', label: 'My Supervisor', icon: UserCheck },
  { path: 'submissions', label: 'My Submissions', icon: FileText },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
];

const titles = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  forms: 'Evaluation Forms',
  presentations: 'Presentations & Amendments',
  supervisors: 'Supervisor Marketplace',
  supervisor: 'My Supervisor',
  submissions: 'My Submissions',
  meetings: 'Meetings',
  deliverables: 'Deliverables',
  exhibition: 'Exhibition',
};

export default function StudentLayout() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || 'dashboard';
  return (
    <MainLayout navItems={navItems} basePath="/student" title={titles[segment] || 'Student Portal'}>
      <Outlet />
    </MainLayout>
  );
}
