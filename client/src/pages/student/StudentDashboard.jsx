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
  BookOpen, X, RotateCcw, Send
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

  const submitMutation = useMutation({
    mutationFn: () => api.put('/users/profile/fyp-proposal', { fyp_title: title, project_description: description }),
    onSuccess: () => {
      toast.success('FYP proposal submitted for review!');
      setEditing(false);
      onUpdate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => api.delete('/users/profile/fyp-proposal'),
    onSuccess: () => {
      toast.success('Proposal withdrawn.');
      onUpdate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) submitMutation.mutate();
  };

  const status = profile?.title_status || 'not_submitted';

  const statusConfig = {
    not_submitted: { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600', label: 'Not Submitted', icon: <BookOpen className="w-5 h-5 text-gray-400" /> },
    pending:       { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Under Review', icon: <Clock className="w-5 h-5 text-amber-500" /> },
    approved:      { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'Approved', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
    rejected:      { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'Rejected', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
  };

  const cfg = statusConfig[status];

  if (editing) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary">FYP Title Registration</h3>
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
              placeholder="Enter your FYP title"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, its objectives, and expected outcomes..."
              rows={5}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-400 mt-1">This description is also used by the system to match you with relevant supervisors.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
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
    <div className={`rounded-xl border p-5 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {cfg.icon}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-secondary text-sm">FYP Title Registration</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
            </div>
            {profile?.fyp_title ? (
              <p className="text-sm text-gray-700 mt-1">{profile.fyp_title}</p>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">Register your FYP title and project description to get started.</p>
            )}
            {status === 'rejected' && profile?.title_feedback && (
              <div className="mt-2 p-3 bg-red-100 rounded-lg border border-red-200">
                <p className="text-xs font-medium text-red-700 mb-0.5">Coordinator feedback:</p>
                <p className="text-sm text-red-700">{profile.title_feedback}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {(status === 'not_submitted' || status === 'rejected') && (
            <button
              onClick={openForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              {status === 'rejected' ? <RotateCcw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              {status === 'rejected' ? 'Resubmit' : 'Submit Title'}
            </button>
          )}
          {status === 'pending' && (
            <>
              <button
                onClick={openForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-white/50"
              >
                Edit
              </button>
              <button
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
              >
                Withdraw
              </button>
            </>
          )}
          {status === 'approved' && (
            <button onClick={openForm} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white/50 opacity-50 cursor-not-allowed" disabled>
              Locked
            </button>
          )}
        </div>
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

      <PhaseTracker profile={profile} submissions={submissions} />

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
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-secondary">FYP Progress Tracker</h3>
          </div>
          {studentProfile?.current_phase && (
            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
              {studentProfile.current_phase}
            </span>
          )}
        </div>

        {progressLoading ? (
          <div className="p-6 animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* People info */}
            {studentProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Student</p>
                    <p className="font-semibold text-sm">{studentProfile.studentUser?.name}</p>
                    <p className="text-xs text-gray-600">{studentProfile.student_id}</p>
                  </div>
                </div>
                {studentProfile.supervisor && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Supervisor</p>
                      <p className="font-semibold text-sm">{studentProfile.supervisor.name}</p>
                      <p className="text-xs text-gray-600">{studentProfile.supervisor.email}</p>
                    </div>
                  </div>
                )}
                {studentProfile.examiner && (
                  <div className="flex items-center space-x-3">
                    <Eye className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Examiner</p>
                      <p className="font-semibold text-sm">{studentProfile.examiner.name}</p>
                      <p className="text-xs text-gray-600">{studentProfile.examiner.email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            {timeline && timeline.length > 0 && (
              <div className="space-y-3">
                {timeline.map((step) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {statusIcons[step.status]}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-secondary text-sm">{step.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[step.status]}`}>
                          {step.status.replace('_', ' ')}
                        </span>
                      </div>
                      {step.completedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Completed: {new Date(step.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Supervision request status if no supervisor yet */}
            {supervisionRequest && !studentProfile?.supervisor && (
              <div className="flex items-center justify-between py-2 border-t pt-4">
                <div>
                  <span className="text-sm font-medium">Supervision Request</span>
                  <span className="text-xs text-gray-500 ml-2">{supervisionRequest.supervisor?.name}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  supervisionRequest.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  supervisionRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {supervisionRequest.status}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
