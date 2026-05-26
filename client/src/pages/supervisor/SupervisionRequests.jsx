import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Check, X } from 'lucide-react';

export default function SupervisionRequests() {
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['requests-incoming'],
    queryFn: async () => {
      const { data } = await api.get('/requests/incoming');
      return data.data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.put(`/requests/${id}/accept`),
    onSuccess: () => {
      toast.success('Request accepted!');
      qc.invalidateQueries(['requests-incoming']);
      qc.invalidateQueries(['user-profile']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/requests/${id}/reject`, { rejected_reason: reason }),
    onSuccess: () => {
      toast.success('Request rejected');
      setRejectModal(null);
      setRejectReason('');
      qc.invalidateQueries(['requests-incoming']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const canAccept = (r) => {
    if (r.status !== 'pending') return false;
    return (profile?.current_student_count || 0) < (profile?.max_students || 5);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Supervision Requests</h2>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Student</th>
              <th className="text-left p-4">Proposed Title</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-4">
                  <p className="font-medium">{r.student?.name}</p>
                  <p className="text-sm text-gray-500">{r.student_profile?.student_id}</p>
                </td>
                <td className="p-4">{r.title_proposed}</td>
                <td className="p-4">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-4"><StatusBadge status={r.status} /></td>
                <td className="p-4">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptMutation.mutate(r.id)}
                        disabled={!canAccept(r)}
                        title={!canAccept(r) ? 'Quota full' : ''}
                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRejectModal(r)}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold mb-2">Reject Request</h3>
            <p className="text-sm text-gray-600 mb-4">Reason (optional)</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2 rounded-lg border">Cancel</button>
              <button onClick={() => rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })} className="flex-1 py-2 rounded-lg bg-red-600 text-white">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
