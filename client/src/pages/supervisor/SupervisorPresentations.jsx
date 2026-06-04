import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Calendar, Clock, MapPin, User, Users, CheckCircle, AlertCircle, Video } from 'lucide-react';

const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-gray-100 text-gray-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
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

function SlotCard({ slot }) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h4 className="text-lg font-semibold">
              {getSessionTypeLabel(slot.PresentationSession?.session_type)}
            </h4>
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
              {slot.PresentationSession?.phase}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(slot.status)}`}>
              {slot.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span className="ml-1 capitalize">{slot.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {slot.PresentationSession?.date
                    ? new Date(slot.PresentationSession.date).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{slot.start_time} – {slot.end_time}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{slot.room || slot.PresentationSession?.venue || '—'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Student: {slot.student?.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Supervisor: {slot.supervisor?.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Examiner: {slot.examiner?.name}</span>
              </div>
            </div>
          </div>

          {slot.PresentationSession?.title && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Video className="w-4 h-4" />
              <span>Session: {slot.PresentationSession.title}</span>
            </div>
          )}

          {slot.notes && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800"><strong>Notes:</strong> {slot.notes}</p>
            </div>
          )}

          {slot.student_confirmed && (
            <div className="mt-3 flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Student confirmed attendance</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupervisorPresentations() {
  const { user } = useAuth();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['supervisor-presentation-slots'],
    queryFn: async () => {
      const { data } = await api.get('/presentation-sessions/my-slots');
      return data || [];
    },
  });

  const supervisingSlots = slots.filter(s => s.supervisor_id === user?.id);
  const examinerSlots = slots.filter(s => s.examiner_id === user?.id);

  const upcoming = (list) => list.filter(s =>
    ['scheduled', 'confirmed'].includes(s.status) &&
    new Date(`${s.PresentationSession?.date}T${s.start_time}`) > new Date()
  );

  const past = (list) => list.filter(s =>
    s.status === 'completed' ||
    new Date(`${s.PresentationSession?.date}T${s.start_time}`) <= new Date()
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
      </div>
    );
  }

  const EmptyState = ({ message }) => (
    <div className="bg-card rounded-xl border p-8 text-center">
      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">My Presentations</h2>
        <div className="flex space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span>As Supervisor: {supervisingSlots.length}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            <span>As Examiner: {examinerSlots.length}</span>
          </span>
        </div>
      </div>

      {/* As Supervisor */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700 flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span>As Supervisor</span>
        </h3>

        {upcoming(supervisingSlots).length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Upcoming</p>
            {upcoming(supervisingSlots).map(s => <SlotCard key={s.id} slot={s} />)}
          </div>
        )}

        {past(supervisingSlots).length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Past</p>
            {past(supervisingSlots).map(s => <SlotCard key={s.id} slot={s} />)}
          </div>
        )}

        {supervisingSlots.length === 0 && (
          <EmptyState message="No presentations scheduled for your supervised students." />
        )}
      </section>

      {/* As Examiner */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700 flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
          <span>As Examiner</span>
        </h3>

        {upcoming(examinerSlots).length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Upcoming</p>
            {upcoming(examinerSlots).map(s => <SlotCard key={s.id} slot={s} />)}
          </div>
        )}

        {past(examinerSlots).length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Past</p>
            {past(examinerSlots).map(s => <SlotCard key={s.id} slot={s} />)}
          </div>
        )}

        {examinerSlots.length === 0 && (
          <EmptyState message="You have not been assigned as an examiner for any presentations." />
        )}
      </section>
    </div>
  );
}
