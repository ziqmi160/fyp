import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileText, Calendar, Video, Package, Award, ClipboardList } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'tasks', label: 'My Tasks', icon: ClipboardList },
  { path: 'forms', label: 'Evaluation Forms', icon: FileText },
  { path: 'presentations', label: 'Presentations & Amendments', icon: Video },
  { path: 'supervisors', label: 'Supervisor Marketplace', icon: Users },
  { path: 'supervisor', label: 'My Supervisor', icon: UserCheck },
  { path: 'submissions', label: 'Submissions', icon: FileText },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
  { path: 'deliverables', label: 'Deliverables', icon: Package },
  // { path: 'exhibition', label: 'Exhibition', icon: Award }, not needed for my project
];

const titles = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  forms: 'Evaluation Forms',
  presentations: 'Presentations & Amendments',
  supervisors: 'Supervisor Marketplace',
  supervisor: 'My Supervisor',
  submissions: 'Submissions',
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
