import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import PhaseTracker from '../../components/common/PhaseTracker';
import {
  FileText, Calendar, UserCheck, PlusCircle,
  CheckCircle2, Circle, Clock, AlertCircle, User, Users, Eye, TrendingUp,
  BookOpen, X, Edit2
} from 'lucide-react';

function FypProposalCard({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const openForm = () => {
    setTitle(profile?.fyp_title || '');
    setDescription(profile?.project_description || '');
    setErrors({});
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => api.put('/users/profile/fyp-title', { fyp_title: title, project_description: description }),
    onSuccess: () => {
      toast.success('FYP title saved.');
      setEditing(false);
      onUpdate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!title.trim()) e2.title = 'Title is required.';
    setErrors(e2);
    if (Object.keys(e2).length === 0) saveMutation.mutate();
  };

  const hasTitle = !!profile?.fyp_title;

  if (editing) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary">FYP Title</h3>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FYP Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart Attendance System Using Face Recognition"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project — its problem statement, objectives, and expected outcomes..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">This description is used to match you with supervisors in the marketplace.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 ${hasTitle ? 'bg-card border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookOpen className={`w-5 h-5 mt-0.5 shrink-0 ${hasTitle ? 'text-primary' : 'text-amber-500'}`} />
          <div>
            <p className="font-semibold text-secondary text-sm">FYP Title</p>
            {hasTitle ? (
              <>
                <p className="text-sm text-gray-800 mt-0.5">{profile.fyp_title}</p>
                {profile.project_description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{profile.project_description}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-amber-700 mt-0.5">Register your FYP title and description to enable supervisor matching.</p>
            )}
          </div>
        </div>
        <button
          onClick={openForm}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5" />
          {hasTitle ? 'Edit' : 'Register'}
        </button>
      </div>
    </div>
  );
}

const statusIcons = {
  completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  in_progress: <Clock className="w-5 h-5 text-yellow-600" />,
  pending: <Circle className="w-5 h-5 text-gray-400" />
};

const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-my'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/my');
      return data.data || [];
    },
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-my'],
    queryFn: async () => {
      const { data } = await api.get('/meetings/my');
      return data.data || [];
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules-my'],
    queryFn: async () => {
      const { data } = await api.get('/users/schedules');
      return data.data || [];
    },
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: async () => {
      const { data } = await api.get('/progress/my-progress');
      return data.data;
    },
  });

  const pendingSubs = submissions.filter(s => s.status === 'pending' || s.status === 'revision_required');
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date()).slice(0, 3);

  const { studentProfile, timeline, supervisionRequest } = progressData || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">Here&apos;s your FYP overview</p>
      </div>

      <FypProposalCard profile={profile} onUpdate={() => qc.invalidateQueries(['user-profile'])} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <StatusBadge status={profile?.fyp_status || 'no_supervisor'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">FYP Status</p>
              <p className="font-semibold text-secondary">{profile?.fyp_title || 'No title yet'}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Submissions</p>
              <p className="text-2xl font-bold text-secondary">{pendingSubs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming Meetings</p>
              <p className="text-2xl font-bold text-secondary">{upcomingMeetings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* <PhaseTracker profile={profile} submissions={submissions} /> */}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <h3 className="font-semibold text-secondary mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/student/submissions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <PlusCircle className="w-5 h-5 text-primary" />
              <span>Submit Progress</span>
            </Link>
            <Link to="/student/meetings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Book Meeting</span>
            </Link>
            <Link to="/student/supervisor" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>View Supervisor</span>
            </Link>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border shadow-sm">
          <h3 className="font-semibold text-secondary mb-4">Upcoming Meetings & Presentations</h3>

          <div className="space-y-4">
            {schedules.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Presentation Slot</h4>
                {schedules.map(sch => (
                  <div key={sch.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-900">{sch.presentation_date} • {sch.presentation_time?.slice(0, 5)}</span>
                    <span className="text-blue-700">{sch.venue} ({sch.phase})</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              {upcomingMeetings.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming meetings</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingMeetings.map((m) => (
                    <li key={m.id} className="flex justify-between text-sm">
                      <span>{new Date(m.meeting_date).toLocaleDateString()} {m.meeting_time?.slice(0, 5)}</span>
                      <span className="text-gray-500">{m.location || 'TBD'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracker Section */}
    </div>
  );
}
