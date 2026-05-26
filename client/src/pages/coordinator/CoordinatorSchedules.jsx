import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoordinatorSchedules() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['coordinator-schedules'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/schedules');
      return data.data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['coordinator-students-active'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/students?status=active');
      return data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/coordinator/schedules', payload),
    onSuccess: () => {
      toast.success('Schedule created');
      setShowModal(false);
      qc.invalidateQueries(['coordinator-schedules']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create schedule'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createMutation.mutate({
      student_id: fd.get('student_id'),
      presentation_date: fd.get('date'),
      presentation_time: fd.get('time'),
      venue: fd.get('venue'),
      phase: fd.get('phase'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Presentation Schedules</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Schedule Slot
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Student</th>
              <th className="text-left p-4 font-medium">Phase</th>
              <th className="text-left p-4 font-medium">Date & Time</th>
              <th className="text-left p-4 font-medium">Venue</th>
              <th className="text-left p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">{s.student?.name}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                    {s.phase}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{s.presentation_date} {s.presentation_time?.slice(0, 5)}</span>
                  </div>
                </td>
                <td className="p-4">{s.venue}</td>
                <td className="p-4 capitalize text-green-600 font-medium">{s.status}</td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">No schedules found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="font-semibold text-lg">Schedule Presentation</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select name="student_id" required className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.name} ({s.student_id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" name="date" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" name="time" required className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Venue</label>
                <input type="text" name="venue" required placeholder="e.g. DK 1, Webex Link" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phase</label>
                <select name="phase" required className="w-full px-4 py-2 border rounded-lg">
                  <option value="CSP600">CSP600 (Proposal)</option>
                  <option value="CSP650">CSP650 (Final)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
