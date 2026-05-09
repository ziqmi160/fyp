import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Inbox, Users, FileText, Calendar, Settings, ClipboardList, Edit3 } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'requests', label: 'Requests', icon: Inbox },
  { path: 'students', label: 'My Students', icon: Users },
  { path: 'submissions', label: 'Submissions', icon: FileText },
  { path: 'evaluation-forms', label: 'Evaluation Forms', icon: ClipboardList },
  { path: 'amendments', label: 'Amendments', icon: Edit3 },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
  { path: 'settings', label: 'Settings', icon: Settings },
];

const titles = { 
  dashboard: 'Dashboard', 
  requests: 'Requests', 
  students: 'My Students', 
  submissions: 'Submissions', 
  'evaluation-forms': 'Evaluation Forms',
  amendments: 'Amendments',
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
