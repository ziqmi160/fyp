import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { LayoutDashboard, Users, UserCheck, FileText, Calendar, TrendingUp, Video, Edit3, BookOpen, Shield, ClipboardCheck, Package, Award } from 'lucide-react';

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'progress', label: 'Progress Tracker', icon: TrendingUp },
  { path: 'forms', label: 'Evaluation Forms', icon: FileText },
  { path: 'presentations', label: 'Presentations', icon: Video },
  { path: 'amendments', label: 'Amendments', icon: Edit3 },
  { path: 'supervisors', label: 'Supervisor Marketplace', icon: Users },
  { path: 'supervisor', label: 'My Supervisor', icon: UserCheck },
  { path: 'submissions', label: 'Submissions', icon: FileText },
  { path: 'meetings', label: 'Meetings', icon: Calendar },
  { path: 'resources', label: 'Resource Library', icon: BookOpen },
  { path: 'plagiarism-check', label: 'Plagiarism Check', icon: Shield },
  { path: 'ethical-approval', label: 'Ethical Approval', icon: ClipboardCheck },
  { path: 'deliverables', label: 'Deliverables', icon: Package },
  { path: 'exhibition', label: 'Exhibition', icon: Award },
];

const titles = {
  dashboard: 'Dashboard',
  progress: 'Progress Tracker',
  forms: 'Evaluation Forms',
  presentations: 'Presentations',
  amendments: 'Amendments',
  supervisors: 'Supervisor Marketplace',
  supervisor: 'My Supervisor',
  submissions: 'Submissions',
  meetings: 'Meetings',
  resources: 'Resource Library',
  'plagiarism-check': 'Plagiarism Check',
  'ethical-approval': 'Ethical Approval',
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
