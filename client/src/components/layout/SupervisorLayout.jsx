import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, FileText, Calendar, Settings, ClipboardList } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'students', label: 'Student Supervision', icon: Users },
  { path: 'submissions', label: 'Submission Review', icon: FileText },
  { path: 'evaluation-forms', label: 'Evaluation', icon: ClipboardList },
  // { path: 'amendments', label: 'Amendments', icon: Edit3 },
  // { path: 'presentations', label: 'Presentations', icon: Video },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
  { path: 'settings', label: 'Settings', icon: Settings },
];

const titles = {
  dashboard: 'Dashboard',
  students: 'Student Supervision',
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
