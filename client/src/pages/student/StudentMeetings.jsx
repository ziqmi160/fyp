import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import SignaturePad from '../../components/common/SignaturePad';
import { Calendar, Plus, Edit2, X, PenLine, CheckCircle2, FileText, Save, ClipboardList } from 'lucide-react';

const LOCATIONS = ['Online - Google Meet', 'Online - Teams', 'Faculty Room', 'Lab', 'Other'];

export default function StudentMeetings() {
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [f5Target, setF5Target] = useState(null);
  const [showSigSetup, setShowSigSetup] = useState(false);
  const [pendingSig, setPendingSig] = useState(null);
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

  const { data: mySig } = useQuery({
    queryKey: ['my-signature'],
    queryFn: async () => {
      const { data } = await api.get('/users/signature');
      return data.data?.signature || null;
    },
  });

  const hasSupervisor = !!profile?.current_supervisor_id;

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/meetings', d),
    onSuccess: () => { toast.success('Meeting booked!'); setShowForm(false); qc.invalidateQueries(['meetings-my']); },
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
    onSuccess: () => { toast.success('F5 record saved.'); setF5Target(null); qc.invalidateQueries(['meetings-my']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const sigMutation = useMutation({
    mutationFn: (signature) => api.put('/users/signature', { signature }),
    onSuccess: () => {
      toast.success('Signature saved.');
      setPendingSig(null);
      setShowSigSetup(false);
      qc.invalidateQueries(['my-signature']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const downloadF5 = async () => {
    try {
      const resp = await api.get('/meetings/my/f5/download', { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'F5_meeting_log.pdf';
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download F5 PDF.'); }
  };

  const upcoming = meetings.filter(m => m.status === 'scheduled');
  const past = meetings.filter(m => m.status !== 'scheduled');
  const hasCompletedMeetings = past.some(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Meeting Logbook</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track meetings with your supervisor</p>
        </div>
        <div className="flex gap-2">
          {hasCompletedMeetings && (
            <button
              onClick={downloadF5}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              Download F5
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={!hasSupervisor}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Book Meeting
          </button>
        </div>
      </div>

      {!hasSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          You need an active supervisor to book meetings.
        </div>
      )}

      {/* Signature setup card */}
      {!mySig ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Signature not set</p>
              <p className="text-xs text-amber-700 mt-0.5">Set your signature so you can acknowledge meeting records signed by your supervisor.</p>
            </div>
            <button
              onClick={() => setShowSigSetup(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium shrink-0 ml-3"
            >
              <PenLine className="w-3.5 h-3.5" />
              Set Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3.5">
          <span className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Signature saved
          </span>
          <button onClick={() => setShowSigSetup(true)} className="text-xs text-green-700 hover:underline">Update</button>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Calendar} message="No meetings yet" actionLabel="Book Meeting" onAction={() => setShowForm(true)} />
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
                    onEdit={() => setEditingMeeting(m)}
                    onCancel={() => cancelMutation.mutate(m.id)}
                    onSaveNotes={(notes) => updateMutation.mutate({ id: m.id, student_notes: notes })}
                    onOpenF5={() => setF5Target(m)}
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
                    onSaveNotes={(notes) => updateMutation.mutate({ id: m.id, student_notes: notes })}
                    onOpenF5={() => setF5Target(m)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MeetingFormModal
          title="Book Meeting"
          onClose={() => setShowForm(false)}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}

      {editingMeeting && (
        <MeetingFormModal
          title="Edit Meeting"
          initial={editingMeeting}
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

      {showSigSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <PenLine className="w-5 h-5 text-primary" /> My Signature
              </h3>
              <button onClick={() => { setShowSigSetup(false); setPendingSig(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Draw your signature below using mouse or finger. It will be used to sign meeting records.</p>
            <SignaturePad
              key={mySig || 'empty'}
              initialValue={pendingSig ?? mySig ?? null}
              onChange={setPendingSig}
              width={380}
              height={150}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => sigMutation.mutate(pendingSig)}
                disabled={!pendingSig || sigMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {sigMutation.isPending ? 'Saving...' : 'Save Signature'}
              </button>
              <button onClick={() => { setShowSigSetup(false); setPendingSig(null); }}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MeetingCard ──────────────────────────────────────────────────────────────

function MeetingCard({ meeting: m, onEdit, onCancel, onSaveNotes, onOpenF5 }) {
  const isScheduled = m.status === 'scheduled';
  const isCompleted = m.status === 'completed';
  const supervisorSigned = !!m.supervisor_signed_at;

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
            {supervisorSigned && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Supervisor signed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {m.location || 'Location TBD'}
            {m.agenda ? ` · ${m.agenda}` : ''}
          </p>
          {m.supervisor?.name && (
            <p className="text-xs text-gray-400 mt-0.5">Supervisor: {m.supervisor.name}</p>
          )}

          {/* F5 record */}
          {isCompleted && m.completed_activity && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1.5">
              <div>
                <span className="font-semibold text-blue-800">Completed activity:</span>
                <span className="text-blue-700 ml-1">{m.completed_activity}</span>
              </div>
              {m.supervisor_notes && (
                <div>
                  <span className="font-semibold text-blue-800">Next activity:</span>
                  <span className="text-blue-700 ml-1">{m.supervisor_notes}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isScheduled && onEdit && (
          <div className="flex gap-1 ml-3 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Cancel">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isCompleted && (
        <div className="mt-3">
          <button
            onClick={onOpenF5}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {m.completed_activity ? 'Edit Meeting Record' : 'Add Meeting Record'}
          </button>
        </div>
      )}

      {isCompleted && onSaveNotes && (
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Your notes</label>
          <textarea
            defaultValue={m.student_notes}
            onBlur={(e) => onSaveNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            placeholder="Add your meeting notes..."
          />
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
          {new Date(meeting.meeting_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
          {meeting.supervisor?.name && ` · ${meeting.supervisor.name}`}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Activity / Comment</label>
            <textarea
              value={supervisor_notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Next steps or comments..."
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

function MeetingFormModal({ title, initial, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    meeting_date: initial?.meeting_date || '',
    meeting_time: initial?.meeting_time?.slice(0, 5) || '',
    location: initial?.location || '',
    agenda: initial?.agenda || '',
  });

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.meeting_date || !form.meeting_time) return;
    if (new Date(`${form.meeting_date}T${form.meeting_time}`) < new Date()) {
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
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Book Meeting'}
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
