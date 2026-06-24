import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Users } from 'lucide-react';

export default function MyStudents() {
  const { data: supervisees = [] } = useQuery({
    queryKey: ['supervisor-students'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/students');
      return data.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-semibold">Student Management</h2>
      </div>

      {supervisees.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={Users} message="No students assigned yet" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supervisees.map((s) => (
            <div key={s.id} className="bg-card rounded-xl p-6 border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-secondary">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.student_id} • {s.programme}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Phase: </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s.current_phase || 'CSP600'}</span>
                </div>
                <p className="text-sm mt-2 line-clamp-2">{s.fyp_title || 'No title'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={s.fyp_status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
