import { Outlet, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';
import { Users } from 'lucide-react';

const navItems = [
  { path: 'coordinators', label: 'Manage Coordinators', icon: Users },
];

const titles = {
  coordinators: 'Manage Coordinators',
};

export default function SuperAdminLayout() {
  const { pathname } = useLocation();
  const segment = pathname.split('/').pop() || 'coordinators';
  return (
    <MainLayout navItems={navItems} basePath="/admin" title={titles[segment] || 'Super Admin'}>
      <Outlet />
    </MainLayout>
  );
}
