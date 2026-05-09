import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileBarChart, Calendar, Layers, Eye } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'students', label: 'Students', icon: Users },
  { path: 'supervisors', label: 'Supervisors', icon: UserCheck },
  { path: 'phases', label: 'Phase Management', icon: Layers },
  { path: 'examiner-assignments', label: 'Examiner Assignments', icon: Eye },
  { path: 'presentation-sessions', label: 'Presentation Sessions', icon: Calendar },
  { path: 'schedules', label: 'Schedules', icon: Calendar },
  { path: 'reports', label: 'Reports', icon: FileBarChart },
];

const titles = { 
  dashboard: 'Dashboard', 
  students: 'Students', 
  supervisors: 'Supervisors', 
  phases: 'Phase Management',
  'examiner-assignments': 'Examiner Assignments',
  'presentation-sessions': 'Presentation Sessions',
  schedules: 'Schedules', 
  reports: 'Reports' 
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
