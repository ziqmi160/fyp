import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import { Users, Inbox, FileText, Calendar } from 'lucide-react';

export default function SupervisorDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['requests-incoming'],
    queryFn: async () => {
      const { data } = await api.get('/requests/incoming');
      return data.data || [];
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-pending'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/pending');
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date());

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-secondary">Welcome, {user?.name}!</h2>

      <div className="grid gap-4 md:grid-cols-4">
            <Link to="/supervisor/students" className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
              <Users className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold text-secondary">{profile?.current_student_count || 0}</p>
              <p className="text-sm text-gray-500">Students</p>
            </Link>
            <Link to="/supervisor/requests" className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
              <Inbox className="w-8 h-8 text-amber-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{pendingRequests.length}</p>
              <p className="text-sm text-gray-500">Pending Requests</p>
            </Link>
            <Link to="/supervisor/submissions" className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{submissions.length}</p>
              <p className="text-sm text-gray-500">Pending Reviews</p>
            </Link>
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <Calendar className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{upcomingMeetings.length}</p>
              <p className="text-sm text-gray-500">Upcoming Meetings</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">Pending Submissions</h3>
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending reviews</p>
              ) : (
                <ul className="space-y-2">
                  {submissions.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span className="font-medium">{s.title}</span>
                      <span className="text-sm text-gray-500">{s.student?.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">Upcoming Meetings</h3>
              {upcomingMeetings.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming meetings</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingMeetings.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex justify-between">
                      <span>{new Date(m.meeting_date).toLocaleDateString()}</span>
                      <span className="text-gray-500">{m.student?.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
    </div>
  );
}
