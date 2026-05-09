import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar, User, FileText, Users, Eye } from 'lucide-react';

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

export default function StudentProgress() {
  const { user } = useAuth();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: async () => {
      const { data } = await api.get('/progress/my-progress');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">FYP Progress Tracker</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { studentProfile, timeline, supervisionRequest, submissions, examinerAssignments, presentationSlots } = progressData || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary">FYP Progress Tracker</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Current Phase:</span>
          <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
            {studentProfile?.current_phase}
          </span>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-gray-500">Student</p>
              <p className="font-semibold">{studentProfile?.studentUser?.name}</p>
              <p className="text-sm text-gray-600">{studentProfile?.student_number}</p>
            </div>
          </div>
          
          {studentProfile?.supervisor && (
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Supervisor</p>
                <p className="font-semibold">{studentProfile.supervisor.name}</p>
                <p className="text-sm text-gray-600">{studentProfile.supervisor.email}</p>
              </div>
            </div>
          )}

          {studentProfile?.examiner && (
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Examiner</p>
                <p className="font-semibold">{studentProfile.examiner.name}</p>
                <p className="text-sm text-gray-600">{studentProfile.examiner.email}</p>
              </div>
            </div>
          )}
        </div>

        {studentProfile?.fyp_title && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">FYP Title</p>
            <p className="font-medium text-secondary">{studentProfile.fyp_title}</p>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-6">Progress Timeline</h3>
        
        <div className="space-y-4">
          {timeline?.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {statusIcons[step.status]}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-secondary">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[step.status]}`}>
                    {step.status.replace('_', ' ')}
                  </span>
                </div>
                
                {step.completedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Completed: {new Date(step.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border">
          <FileText className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-secondary">{submissions?.length || 0}</p>
          <p className="text-sm text-gray-500">Submissions</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border">
          <Calendar className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-secondary">{presentationSlots?.length || 0}</p>
          <p className="text-sm text-gray-500">Presentations</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border">
          <Eye className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-secondary">{examinerAssignments?.length || 0}</p>
          <p className="text-sm text-gray-500">Examiner Assignments</p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border">
          <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-secondary">
            {timeline?.filter(s => s.status === 'completed').length || 0}
          </p>
          <p className="text-sm text-gray-500">Completed Steps</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          {supervisionRequest && (
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium">Supervision Request</span>
                <span className="text-sm text-gray-500 ml-2">
                  {supervisionRequest.supervisor?.name}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                supervisionRequest.status === 'accepted' 
                  ? 'bg-green-100 text-green-800' 
                  : supervisionRequest.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {supervisionRequest.status}
              </span>
            </div>
          )}
          
          {submissions?.slice(0, 3).map((submission) => (
            <div key={submission.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium">{submission.title}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {submission.submission_type}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                submission.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : submission.status === 'revision_required'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {submission.status}
              </span>
            </div>
          ))}
          
          {presentationSlots?.slice(0, 2).map((slot) => (
            <div key={slot.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium">Presentation</span>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(slot.start_time).toLocaleString()}
                </span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                slot.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : slot.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {slot.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
