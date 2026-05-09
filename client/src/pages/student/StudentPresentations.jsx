import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Users, User, CheckCircle, AlertCircle, Video } from 'lucide-react';

export default function StudentPresentations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ['student-presentations'],
    queryFn: async () => {
      const { data } = await api.get('/presentation-sessions/my-slots');
      return data.data || [];
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (slotId) => {
      const { data } = await api.put(`/presentation-sessions/slots/${slotId}/confirm`);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Presentation slot confirmed successfully!');
      queryClient.invalidateQueries(['student-presentations']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to confirm presentation'),
  });

  const handleConfirmSlot = (slotId) => {
    if (window.confirm('Are you sure you want to confirm this presentation slot? This will notify your supervisor and examiner.')) {
      confirmMutation.mutate(slotId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getSessionTypeLabel = (type) => {
    switch (type) {
      case 'proposal': return 'Proposal Defense';
      case 'progress': return 'Progress Presentation';
      case 'final': return 'Final Presentation';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">My Presentations</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingPresentations = presentations.filter(p => 
    ['scheduled', 'confirmed'].includes(p.status) && 
    new Date(`${p.PresentationSession?.date} ${p.start_time}`) > new Date()
  );

  const pastPresentations = presentations.filter(p => 
    p.status === 'completed' || 
    new Date(`${p.PresentationSession?.date} ${p.start_time}`) <= new Date()
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-secondary">My Presentations</h2>

      {/* Upcoming Presentations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Presentations</h3>
        
        {upcomingPresentations.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Presentations</h3>
            <p className="text-gray-500">
              You don't have any scheduled presentations. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingPresentations.map((presentation) => (
              <div key={presentation.id} className="bg-card rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-semibold">
                        {getSessionTypeLabel(presentation.PresentationSession?.session_type)}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(presentation.status)}`}>
                        {getStatusIcon(presentation.status)}
                        <span>{presentation.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(presentation.PresentationSession?.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{presentation.start_time} - {presentation.end_time}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{presentation.room || presentation.PresentationSession?.venue}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Supervisor: {presentation.supervisor?.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Examiner: {presentation.examiner?.name}</span>
                        </div>
                        
                        {presentation.PresentationSession?.title && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Video className="w-4 h-4" />
                            <span>Session: {presentation.PresentationSession.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {presentation.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Notes:</strong> {presentation.notes}
                        </p>
                      </div>
                    )}

                    {!presentation.student_confirmed && presentation.status === 'scheduled' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 text-amber-800">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-sm">
                            Please confirm your attendance for this presentation slot.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {!presentation.student_confirmed && presentation.status === 'scheduled' && (
                      <button
                        onClick={() => handleConfirmSlot(presentation.id)}
                        disabled={confirmMutation.isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        {confirmMutation.isLoading ? 'Confirming...' : 'Confirm Attendance'}
                      </button>
                    )}
                    
                    {presentation.student_confirmed && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Confirmed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Presentations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Presentation History</h3>
        
        {pastPresentations.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Presentation History</h3>
            <p className="text-gray-500">
              Your completed presentations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastPresentations.map((presentation) => (
              <div key={presentation.id} className="bg-card rounded-xl border p-6 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-semibold">
                        {getSessionTypeLabel(presentation.PresentationSession?.session_type)}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(presentation.status)}`}>
                        {getStatusIcon(presentation.status)}
                        <span>{presentation.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(presentation.PresentationSession?.date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{presentation.start_time} - {presentation.end_time}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{presentation.room || presentation.PresentationSession?.venue}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Supervisor: {presentation.supervisor?.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Examiner: {presentation.examiner?.name}</span>
                        </div>
                        
                        {presentation.student_confirmed && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Attendance confirmed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-secondary">{upcomingPresentations.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-secondary">{pastPresentations.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center space-x-3">
            <Video className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-secondary">{presentations.length}</p>
              <p className="text-sm text-gray-500">Total Presentations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
