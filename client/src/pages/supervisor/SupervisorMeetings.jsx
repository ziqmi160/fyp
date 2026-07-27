import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import SignaturePad from '../../components/common/SignaturePad';
import {
  Calendar, Edit2, X, CheckCircle2, Plus, PenLine, FileText,
  Download, ClipboardList
} from 'lucide-react';

const LOCATIONS = ['Online - Google Meet', 'Online - Teams', 'Faculty Room', 'Lab', 'Other'];

export default function SupervisorMeetings() {
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [f5Target, setF5Target] = useState(null); // meeting to fill F5 data
  const qc = useQueryClient();

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-my'],
    queryFn: async () => {
      const { data } = await api.get('/meetings/my');
      return data.data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['my-students-list'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/students');
      return data.data || [];
    },
  });

  const { data: mySig } = useQuery({
    queryKey: ['my-signature'],
    queryFn: async () => {
      const { data } = await api.get('/users/signature');
      return data.data?.signature || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/meetings', d),
    onSuccess: () => { toast.success('Meeting booked.'); setShowForm(false); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/meetings/${id}`, d),
    onSuccess: () => { toast.success('Meeting updated.'); setEditingMeeting(null); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete(`/meetings/${id}`),
    onSuccess: () => { toast.success('Meeting cancelled.'); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const f5Mutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/meetings/${id}/f5`, d),
    onSuccess: () => { toast.success('F5 data saved.'); setF5Target(null); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const signMutation = useMutation({
    mutationFn: (id) => api.post(`/meetings/${id}/sign`),
    onSuccess: () => { toast.success('Meeting signed.'); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed — set your signature in Settings first.'),
  });

  const downloadF5 = async (studentId, studentName) => {
    try {
      const resp = await api.post(`/meetings/f5/${studentId}/generate`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `F5_${studentName?.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to generate F5 PDF.'); }
  };

  const upcoming = meetings.filter(m => m.status === 'scheduled');
  const past = meetings.filter(m => m.status !== 'scheduled');

  // Build unique student list from past meetings for F5 download
  const studentsWithMeetings = [...new Map(
    past.map(m => [m.student_id, { id: m.student_id, name: m.student?.name }])
  ).values()];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Meetings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and log meeting sessions with your students</p>
        </div>
        <div className="flex gap-2">
          {studentsWithMeetings.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <FileText className="w-4 h-4" />
                F5 Form
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 hidden group-hover:block min-w-40">
                {studentsWithMeetings.map(s => (
                  <button
                    key={s.id}
                    onClick={() => downloadF5(s.id, s.name)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {!mySig && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Signature not set.</strong> Go to Settings to save your signature so you can sign F5 meeting records.
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Calendar} message="No meetings yet" />
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    role="supervisor"
                    hasSig={!!mySig}
                    onEdit={() => setEditingMeeting(m)}
                    onCancel={() => cancelMutation.mutate(m.id)}
                    onMarkComplete={() => updateMutation.mutate({ id: m.id, status: 'completed' })}
                    onOpenF5={() => setF5Target(m)}
                    onSign={() => signMutation.mutate(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Past</h3>
              <div className="space-y-2">
                {past.map((m) => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    role="supervisor"
                    hasSig={!!mySig}
                    onOpenF5={() => setF5Target(m)}
                    onSign={() => signMutation.mutate(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MeetingFormModal
          title="Schedule Meeting"
          students={students}
          onClose={() => setShowForm(false)}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}

      {editingMeeting && (
        <MeetingFormModal
          title="Edit Meeting"
          initial={editingMeeting}
          students={students}
          onClose={() => setEditingMeeting(null)}
          onSubmit={(d) => updateMutation.mutate({ id: editingMeeting.id, ...d })}
          loading={updateMutation.isPending}
        />
      )}

      {f5Target && (
        <F5Modal
          meeting={f5Target}
          onClose={() => setF5Target(null)}
          onSave={(d) => f5Mutation.mutate({ id: f5Target.id, ...d })}
          loading={f5Mutation.isPending}
        />
      )}
    </div>
  );
}

// ─── MeetingCard ──────────────────────────────────────────────────────────────

function MeetingCard({ meeting: m, role, hasSig, onEdit, onCancel, onMarkComplete, onOpenF5, onSign }) {
  const isScheduled = m.status === 'scheduled';
  const isCompleted = m.status === 'completed';
  const isSupervisor = role === 'supervisor';
  const alreadySigned = isSupervisor ? !!m.supervisor_signed_at : !!m.student_signed_at;

  return (
    <div className="bg-card rounded-xl p-4 border">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">
              {new Date(m.meeting_date).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              {' '}{m.meeting_time?.slice(0, 5)}
            </span>
            <StatusBadge status={m.status} />
            {alreadySigned && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Signed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {isSupervisor ? m.student?.name : m.supervisor?.name} · {m.location || 'Location TBD'}
          </p>
          {m.agenda && <p className="text-sm text-gray-600 mt-0.5">{m.agenda}</p>}

          {/* F5 data */}
          {isCompleted && m.completed_activity && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1.5">
              <div>
                <span className="font-semibold text-blue-800">Completed:</span>
                <span className="text-blue-700 ml-1">{m.completed_activity}</span>
              </div>
              {m.supervisor_notes && (
                <div>
                  <span className="font-semibold text-blue-800">Supervisor notes:</span>
                  <span className="text-blue-700 ml-1">{m.supervisor_notes}</span>
                </div>
              )}
            </div>
          )}

          {m.student_notes && !isSupervisor && (
            <div className="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-700">
              <span className="font-medium">My notes: </span>{m.student_notes}
            </div>
          )}
        </div>

        {isScheduled && isSupervisor && (
          <div className="flex gap-1 ml-3 shrink-0">
            {onOpenF5 && (
              <button
                onClick={onOpenF5}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                title="Add meeting notes"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onMarkComplete}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600"
              title="Mark as completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            {onEdit && (
              <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onCancel && (
              <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* F5 actions for completed meetings */}
      {isCompleted && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {isSupervisor && (
            <button
              onClick={onOpenF5}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {m.completed_activity || m.supervisor_notes ? 'Edit Notes' : 'Add Notes'}
            </button>
          )}
          {!alreadySigned && (
            <button
              onClick={onSign}
              disabled={!hasSig}
              title={!hasSig ? 'Set your signature in Settings first' : 'Sign this meeting record'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PenLine className="w-3.5 h-3.5" />
              Sign Record
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── F5Modal ──────────────────────────────────────────────────────────────────

function F5Modal({ meeting, onClose, onSave, loading }) {
  const [completed_activity, setActivity] = useState(meeting.completed_activity || '');
  const [supervisor_notes, setNotes] = useState(meeting.supervisor_notes || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">F5 Meeting Record</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {meeting.student?.name} · {new Date(meeting.meeting_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completed Activity</label>
            <textarea
              value={completed_activity}
              onChange={(e) => setActivity(e.target.value)}
              rows={3}
              placeholder="What was accomplished in this meeting..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Notes / Next Activity</label>
            <textarea
              value={supervisor_notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Next steps or comments for the student..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onSave({ completed_activity, supervisor_notes })}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save F5 Record'}
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MeetingFormModal ─────────────────────────────────────────────────────────

function MeetingFormModal({ title, initial, students, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    student_id: initial?.student_id || '',
    meeting_date: initial?.meeting_date || '',
    meeting_time: initial?.meeting_time?.slice(0, 5) || '',
    location: initial?.location || '',
    agenda: initial?.agenda || '',
  });

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.meeting_date && form.meeting_time &&
        new Date(`${form.meeting_date}T${form.meeting_time}`) < new Date()) {
      toast.error('Meetings cannot be scheduled in the past.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initial && (
            <div>
              <label className="block text-sm font-medium mb-1">Student</label>
              <select
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.user_id || s.id} value={s.user_id || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" min={today} value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">Select location...</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agenda <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3}
              placeholder="What will be discussed..."
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Schedule Meeting'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
