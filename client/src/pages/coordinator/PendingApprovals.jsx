import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PendingApprovals() {
  const [rejectTarget, setRejectTarget] = useState(null);
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-supervisors'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/pending-supervisors');
      return data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/coordinator/supervisors/${id}/approval`, { action: 'approve' }),
    onSuccess: () => {
      toast.success('Supervisor approved.');
      qc.invalidateQueries(['pending-supervisors']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/coordinator/supervisors/${id}/approval`, { action: 'reject', reason }),
    onSuccess: () => {
      toast.success('Supervisor rejected.');
      setRejectTarget(null);
      qc.invalidateQueries(['pending-supervisors']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reject'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pending Supervisor Approvals</h2>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4" />
            {pending.length} pending
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No pending approvals</p>
          <p className="text-sm mt-1">All supervisor registrations have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Staff ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Registered</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((sup) => (
                <tr key={sup.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{sup.name}</td>
                  <td className="p-4 text-sm text-gray-600">{sup.email}</td>
                  <td className="p-4 text-sm">{sup.staff_id || '-'}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(sup.registered_at).toLocaleDateString('en-MY', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(sup.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(sup)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100"
                      >
                        <UserX className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject confirmation modal */}
      {rejectTarget && (
        <RejectModal
          supervisor={rejectTarget}
          onConfirm={(reason) => rejectMutation.mutate({ id: rejectTarget.id, reason })}
          onClose={() => setRejectTarget(null)}
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

function RejectModal({ supervisor, onConfirm, onClose, isPending }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-1">Reject Registration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Rejecting <span className="font-medium">{supervisor.name}</span>&apos;s registration. You can provide an optional reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Rejecting...' : 'Confirm Reject'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
