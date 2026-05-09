import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import PhaseTracker from '../../components/common/PhaseTracker';
import { FileText, Calendar, UserCheck, PlusCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

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

  const pendingSubs = submissions.filter(s => s.status === 'pending' || s.status === 'revision_required');
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date()).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">Here's your FYP overview</p>
      </div>

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
    </div>
  );
}
