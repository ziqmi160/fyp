import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Users, Search, Check, X, Inbox } from 'lucide-react';

export default function StudentSupervision() {
  const [tab, setTab] = useState('students');

  const { data: requests = [] } = useQuery({
    queryKey: ['requests-incoming'],
    queryFn: async () => {
      const { data } = await api.get('/requests/incoming');
      return data.data || [];
    },
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-semibold">Student Supervision</h2>
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab('students')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> My Students
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox className="w-4 h-4" /> Requests
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs">{pendingCount}</span>
          )}
        </button>
      </div>

      {tab === 'students' ? <MyStudentsTab /> : <RequestsTab requests={requests} />}
    </div>
  );
}

function MyStudentsTab() {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  const { data: supervisees = [] } = useQuery({
    queryKey: ['supervisor-students'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/students');
      return data.data || [];
    },
  });

  const filtered = supervisees.filter((s) => {
    if (phaseFilter && (s.current_phase || 'CSP600') !== phaseFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q) ||
      (s.fyp_title || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, matric, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border"
          />
        </div>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-white text-sm sm:w-44"
        >
          <option value="">All phases</option>
          <option value="CSP600">CSP600</option>
          <option value="CSP650">CSP650</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Users} message={supervisees.length === 0 ? 'No students assigned yet' : 'No students match your filters'} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-card rounded-xl p-6 border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-secondary">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.student_id} • {s.programme}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Phase: </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s.current_phase || 'CSP600'}</span>
                </div>
                <p className="text-sm mt-2 line-clamp-2">{s.fyp_title || 'No title'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={s.fyp_status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestsTab({ requests }) {
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (!search) return true;
    const haystack = `${r.student?.name || ''} ${r.title_proposed || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
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
      qc.invalidateQueries(['supervisor-students']);
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
      <div className="flex flex-wrap gap-2 justify-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or title..."
            className="pl-9 pr-4 py-2 rounded-lg border text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
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
            {filtered.map((r) => (
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
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">No requests match your search.</p>
        )}
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
