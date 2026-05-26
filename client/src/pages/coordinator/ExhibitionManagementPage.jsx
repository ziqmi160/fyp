import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';

export default function ExhibitionManagementPage() {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    venue: '',
    start_time: '',
    end_time: '',
    phase_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [phases, setPhases] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);

  useEffect(() => {
    fetchExhibitions();
    fetchPhases();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const { data } = await api.get('/api/exhibitions');
      setExhibitions(data.data);
    } catch (err) {
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    try {
      const { data } = await api.get('/api/phases');
      setPhases(data.data || []);
    } catch (err) {
      toast.error('Failed to load phases');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !form.venue || !form.phase_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/api/exhibitions', form);
      setExhibitions([data.data, ...exhibitions]);
      toast.success('Exhibition created');
      setForm({
        title: '',
        description: '',
        event_date: '',
        venue: '',
        start_time: '',
        end_time: '',
        phase_id: ''
      });
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create exhibition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exhibition?')) return;
    try {
      await api.delete(`/api/exhibitions/${id}`);
      setExhibitions(exhibitions.filter(e => e.id !== id));
      toast.success('Exhibition deleted');
    } catch (err) {
      toast.error('Failed to delete exhibition');
    }
  };

  const handleAnnounceBriefing = async (id) => {
    const briefing = prompt('Enter briefing content:');
    if (!briefing) return;

    try {
      const { data } = await api.post(`/api/exhibitions/${id}/announce-briefing`, {
        briefing_content: briefing
      });
      setExhibitions(exhibitions.map(e => e.id === id ? data.data : e));
      toast.success('Briefing announced');
    } catch (err) {
      toast.error('Failed to announce briefing');
    }
  };

  const viewAttendanceReport = async (id) => {
    try {
      const { data } = await api.get(`/api/exhibitions/${id}/attendance-report`);
      setSelectedExhibition(data.data);
    } catch (err) {
      toast.error('Failed to load attendance report');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (selectedExhibition) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedExhibition(null)}
          className="mb-4 px-4 py-2 bg-gray-300 rounded font-medium"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-6">{selectedExhibition.exhibition.title} - Attendance Report</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <p className="text-gray-600 text-sm">Total Registered</p>
            <p className="text-3xl font-bold">{selectedExhibition.attendanceStats.totalRegistered}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-gray-600 text-sm">Attended</p>
            <p className="text-3xl font-bold text-green-600">{selectedExhibition.attendanceStats.totalAttended}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-gray-600 text-sm">Attendance Rate</p>
            <p className="text-3xl font-bold">{selectedExhibition.attendanceStats.attendanceRate}%</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Student List</h2>
        <div className="space-y-2">
          {selectedExhibition.exhibition.ExhibitionAttendances.map(attendance => (
            <div key={attendance.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">{attendance.student.name}</p>
                <p className="text-sm text-gray-600">{attendance.student.email}</p>
              </div>
              <div>
                {attendance.attended ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    ✓ Attended
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    Not Checked In
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Exhibition Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded font-medium"
        >
          {showForm ? 'Cancel' : 'Create Exhibition'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Exhibition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Venue"
              className="px-4 py-2 border rounded"
            />
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="px-4 py-2 border rounded"
            />
            <select
              value={form.phase_id}
              onChange={(e) => setForm({ ...form, phase_id: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="">Select Phase</option>
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>{phase.name}</option>
              ))}
            </select>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              placeholder="Start Time"
              className="px-4 py-2 border rounded"
            />
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              placeholder="End Time"
              className="px-4 py-2 border rounded"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            rows="3"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Exhibition'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {exhibitions.map(exhibition => (
          <div key={exhibition.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{exhibition.title}</h3>
                <p className="text-gray-600">{exhibition.venue}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {new Date(exhibition.event_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">{exhibition.start_time || 'TBD'}</p>
              </div>
            </div>

            {exhibition.briefing_announced && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm font-medium">📢 Briefing Active</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleAnnounceBriefing(exhibition.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                {exhibition.briefing_announced ? 'Edit Briefing' : 'Announce Briefing'}
              </button>
              <button
                onClick={() => viewAttendanceReport(exhibition.id)}
                className="px-4 py-2 bg-green-500 text-white rounded text-sm"
              >
                View Report
              </button>
              <button
                onClick={() => handleDelete(exhibition.id)}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
