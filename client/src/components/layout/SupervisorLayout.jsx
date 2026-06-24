import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Inbox, Users, FileText, Calendar, Settings, ClipboardList } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'requests', label: 'Supervision Requests', icon: Inbox },
  { path: 'students', label: 'My Students', icon: Users },
  { path: 'submissions', label: 'Submission Review', icon: FileText },
  { path: 'evaluation-forms', label: 'Evaluation', icon: ClipboardList },
  // { path: 'amendments', label: 'Amendments', icon: Edit3 },
  // { path: 'presentations', label: 'Presentations', icon: Video },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
  { path: 'settings', label: 'Settings', icon: Settings },
];

const titles = {
  dashboard: 'Dashboard',
  requests: 'Supervision Requests',
  students: 'My Students',
  submissions: 'Submission Review',
  'evaluation-forms': 'Evaluation',
  amendments: 'Amendments',
  presentations: 'Presentations',
  meetings: 'Meetings',
  settings: 'Settings'
};

export default function SupervisorLayout() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || 'dashboard';
  return (
    <MainLayout navItems={navItems} basePath="/supervisor" title={titles[segment] || 'Supervisor Portal'}>
      <Outlet />
    </MainLayout>
  );
}
