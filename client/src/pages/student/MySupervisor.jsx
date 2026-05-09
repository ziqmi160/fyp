import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import { UserCheck } from 'lucide-react';

export default function MySupervisor() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data;
    },
  });

  const profile = data?.profile;
  const supervisor = profile?.supervisor;

  if (profile && !supervisor) {
    return (
      <div className="bg-card rounded-xl p-8 border">
        <EmptyState
          icon={UserCheck}
          message="You don't have a supervisor yet. Browse the marketplace to send a request."
          actionLabel="Browse Supervisors"
          onAction={() => navigate('/student/supervisors')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-card rounded-xl p-8 border shadow-sm">
        <h2 className="text-xl font-semibold text-secondary mb-6">My Supervisor</h2>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-500">Name</span>
            <p className="font-medium">{supervisor?.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p className="font-medium">{supervisor?.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Staff ID</span>
            <p className="font-medium">{profile?.supervisor?.staff_id || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Expertise</span>
            <p className="font-medium">{profile?.supervisor?.expertise || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">FYP Title</span>
            <p className="font-medium">{profile?.fyp_title || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
