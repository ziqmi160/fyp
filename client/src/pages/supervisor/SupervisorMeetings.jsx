import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Calendar } from 'lucide-react';

export default function SupervisorMeetings() {
  const qc = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-my'],
    queryFn: async () => {
      const { data } = await api.get('/meetings/my');
      return data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/meetings/${id}`, d),
    onSuccess: () => qc.invalidateQueries(['meetings-my']),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete(`/meetings/${id}`),
    onSuccess: () => {
      toast.success('Meeting cancelled');
      qc.invalidateQueries(['meetings-my']);
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Meetings</h2>
      {meetings.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Calendar} message="No meetings yet" />
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((m) => (
            <div key={m.id} className="bg-card rounded-xl p-6 border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{new Date(m.meeting_date).toLocaleDateString()} {m.meeting_time?.slice(0, 5)}</h3>
                  <p className="text-sm text-gray-500">{m.student?.name} • {m.location || 'TBD'}</p>
                  <p className="text-sm mt-2">{m.agenda || 'No agenda'}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              {m.status === 'completed' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Supervisor notes</label>
                  <textarea
                    defaultValue={m.supervisor_notes}
                    onBlur={(e) => updateMutation.mutate({ id: m.id, supervisor_notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border text-sm"
                    rows={2}
                  />
                </div>
              )}
              {m.status === 'scheduled' && (
                <button
                  onClick={() => cancelMutation.mutate(m.id)}
                  className="mt-4 text-sm text-red-600 hover:underline"
                >
                  Cancel meeting
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
