import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import EmptyState from '../../components/common/EmptyState';
import { UserCheck, Download, FlaskConical } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

async function downloadF1() {
  try {
    const { data: f1Res } = await api.get('/documents/my/f1');
    const docId = f1Res.data?.id;
    if (!docId) throw new Error('No document returned');
    const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'F1_Mutual_Acceptance.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to download F1 form.');
  }
}

export default function MySupervisor() {
  const { user } = useAuth();
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
    <div className="max-w-2xl space-y-4">
      {user?.is_multi_role && supervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Testing mode: this is your own account acting as your supervisor. On the real system,
            students are supervised by a separate supervisor account.
          </p>
        </div>
      )}
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

        <div className="pt-4 border-t mt-4">
          <button
            onClick={downloadF1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition"
          >
            <Download className="w-4 h-4" />
            Download F1 Form
          </button>
        </div>
      </div>
    </div>
  );
}
