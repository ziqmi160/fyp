import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import { Users, Inbox, FileText, Calendar, Eye, ClipboardList } from 'lucide-react';
import { useState } from 'react';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('supervisees');

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

  const { data: examinerAssignments = [] } = useQuery({
    queryKey: ['examiner-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/examiner-assignments/my-assignments');
      return data.data || [];
    },
  });

  const { data: evaluationForms = [] } = useQuery({
    queryKey: ['evaluation-forms'],
    queryFn: async () => {
      const { data } = await api.get('/evaluation-forms/my-forms');
      return data.data || [];
    },
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meeting_date) >= new Date());
  const pendingEvaluations = evaluationForms.filter(f => f.status === 'draft');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-secondary">Welcome, {user?.name}!</h2>

      {/* Role Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('supervisees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'supervisees'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Supervisees
          </button>
          <button
            onClick={() => setActiveTab('examiner')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'examiner'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Students I'm Examining
          </button>
        </nav>
      </div>

      {activeTab === 'supervisees' && (
        <>
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
        </>
      )}

      {activeTab === 'examiner' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <Eye className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{examinerAssignments.length}</p>
              <p className="text-sm text-gray-500">Assigned Students</p>
            </div>
            <Link to="/supervisor/evaluation-forms" className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
              <ClipboardList className="w-8 h-8 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{pendingEvaluations.length}</p>
              <p className="text-sm text-gray-500">Pending Evaluations</p>
            </Link>
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <FileText className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="text-2xl font-bold text-secondary">{evaluationForms.length}</p>
              <p className="text-sm text-gray-500">Total Evaluations</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">Assigned Students</h3>
              {examinerAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm">No examiner assignments</p>
              ) : (
                <ul className="space-y-2">
                  {examinerAssignments.slice(0, 5).map((assignment) => (
                    <li key={assignment.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{assignment.student?.name}</span>
                        <span className="text-sm text-gray-500 block">
                          {assignment.student?.StudentProfile?.student_number} • {assignment.phase}
                        </span>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {assignment.assignment_type}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">Pending Evaluations</h3>
              {pendingEvaluations.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending evaluations</p>
              ) : (
                <ul className="space-y-2">
                  {pendingEvaluations.slice(0, 5).map((form) => (
                    <li key={form.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{form.form_type}</span>
                        <span className="text-sm text-gray-500 block">
                          {form.student?.name}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Draft
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
