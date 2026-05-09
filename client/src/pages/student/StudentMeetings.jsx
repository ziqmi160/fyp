import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Calendar, Plus } from 'lucide-react';

const schema = z.object({
  meeting_date: z.string().min(1, 'Date required'),
  meeting_time: z.string().min(1, 'Time required'),
  location: z.string().optional(),
  agenda: z.string().optional(),
});

const LOCATIONS = ['Online - Google Meet', 'Online - Teams', 'Faculty Room', 'Lab', 'Other'];

export default function StudentMeetings() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-my'],
    queryFn: async () => {
      const { data } = await api.get('/meetings/my');
      return data.data || [];
    },
  });

  const hasSupervisor = !!profile?.current_supervisor_id;

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/meetings', d),
    onSuccess: () => {
      toast.success('Meeting booked!');
      setShowForm(false);
      qc.invalidateQueries(['meetings-my']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/meetings/${id}`, d),
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries(['meetings-my']);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meeting Logbook</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!hasSupervisor}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Book Meeting
        </button>
      </div>

      {!hasSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          You need an active supervisor to book meetings.
        </div>
      )}

      {meetings.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Calendar} message="No meetings yet" actionLabel="Book Meeting" onAction={() => setShowForm(true)} />
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <div key={m.id} className="bg-card rounded-xl p-4 border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{new Date(m.meeting_date).toLocaleDateString()} {m.meeting_time?.slice(0, 5)}</h3>
                  <p className="text-sm text-gray-500">{m.location || 'TBD'} • {m.agenda || 'No agenda'}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              {m.status === 'completed' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Your notes</label>
                  <textarea
                    defaultValue={m.student_notes}
                    onBlur={(e) => updateMutation.mutate({ id: m.id, student_notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border text-sm"
                    rows={2}
                    placeholder="Add your meeting notes..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MeetingForm
          onClose={() => setShowForm(false)}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function MeetingForm({ onClose, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <div className="bg-card rounded-xl p-6 border">
      <h3 className="font-semibold mb-4">Book Meeting</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input {...register('meeting_date')} type="date" className="w-full px-4 py-2 rounded-lg border" />
            {errors.meeting_date && <p className="text-red-500 text-sm">{errors.meeting_date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input {...register('meeting_time')} type="time" className="w-full px-4 py-2 rounded-lg border" />
            {errors.meeting_time && <p className="text-red-500 text-sm">{errors.meeting_time.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select {...register('location')} className="w-full px-4 py-2 rounded-lg border">
            <option value="">Select...</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Agenda</label>
          <textarea {...register('agenda')} rows={3} className="w-full px-4 py-2 rounded-lg border" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white">Book</button>
        </div>
      </form>
    </div>
  );
}
