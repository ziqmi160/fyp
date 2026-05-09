import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuotaBar from '../../components/common/QuotaBar';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import { Search, UserPlus } from 'lucide-react';

const requestSchema = z.object({
  title_proposed: z.string().min(1, 'Title required'),
  message: z.string().optional(),
});

export default function SupervisorMarketplace() {
  const [search, setSearch] = useState('');
  const [expertise, setExpertise] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors', expertise, availableOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (expertise) params.set('expertise', expertise);
      if (availableOnly) params.set('available_only', 'true');
      const { data } = await api.get(`/supervisors?${params}`);
      return data.data || [];
    },
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['requests-my'],
    queryFn: async () => {
      const { data } = await api.get('/requests/my');
      return data.data || [];
    },
  });

  const createRequest = useMutation({
    mutationFn: (body) => api.post('/requests', { ...body, supervisor_id: selectedSupervisor?.user_id }),
    onSuccess: () => {
      toast.success('Request sent!');
      setShowModal(false);
      setSelectedSupervisor(null);
      qc.invalidateQueries(['requests-my']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send'),
  });

  const filtered = supervisors.filter(s =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.expertise || '').toLowerCase().includes(search.toLowerCase())
  );

  const hasPending = myRequests.some(r => r.status === 'pending');
  const hasSupervisor = myRequests.some(r => r.status === 'accepted');

  const canRequest = (sup) => {
    if (hasSupervisor || hasPending) return false;
    if (!sup.is_accepting || sup.current_student_count >= sup.max_students) return false;
    const existing = myRequests.find(r => r.supervisor_id === sup.user_id);
    return !existing;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or expertise..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border"
          />
        </div>
        <input
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="Filter by expertise"
          className="px-4 py-2 rounded-lg border"
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          Available only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState message="No supervisors found" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sup) => (
            <div key={sup.id} className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-secondary">{sup.name}</h3>
                  <p className="text-sm text-gray-500">{sup.staff_id}</p>
                </div>
                {sup.is_accepting && sup.current_student_count < sup.max_students ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Available</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Full</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(sup.expertise || '').split(',').map((e, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{e.trim()}</span>
                ))}
              </div>
              <div className="mt-4">
                <QuotaBar current={sup.current_student_count} max={sup.max_students} />
              </div>
              <button
                onClick={() => {
                  setSelectedSupervisor(sup);
                  setShowModal(true);
                }}
                disabled={!canRequest(sup)}
                className="mt-4 w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Request Supervision
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSupervisor && (
        <RequestModal
          supervisor={selectedSupervisor}
          onClose={() => { setShowModal(false); setSelectedSupervisor(null); }}
          onSubmit={(d) => createRequest.mutate(d)}
          loading={createRequest.isPending}
        />
      )}
    </div>
  );
}

function RequestModal({ supervisor, onClose, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">Request: {supervisor.name}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Proposed FYP Title</label>
            <input {...register('title_proposed')} className="w-full px-4 py-2 rounded-lg border" />
            {errors.title_proposed && <p className="text-red-500 text-sm">{errors.title_proposed.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea {...register('message')} rows={3} className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-primary text-white">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
