import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Users, FileSearch } from 'lucide-react';

export default function MyStudents() {
  const [activeTab, setActiveTab] = useState('supervisees');

  const { data: supervisees = [] } = useQuery({
    queryKey: ['supervisor-students'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/students');
      return data.data || [];
    },
  });

  const { data: examining = [] } = useQuery({
    queryKey: ['supervisor-examining'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/examining');
      return data.data || [];
    },
  });

  const displayList = activeTab === 'supervisees' ? supervisees : examining;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-semibold">Student Management</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('supervisees')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'supervisees' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-secondary'
            }`}
          >
            My Supervisees
          </button>
          <button
            onClick={() => setActiveTab('examining')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'examining' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-secondary'
            }`}
          >
            Students I'm Examining
          </button>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState 
            icon={activeTab === 'supervisees' ? Users : FileSearch} 
            message={activeTab === 'supervisees' ? "No students assigned yet" : "No students assigned for examination"} 
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayList.map((s) => (
            <div key={s.id} className="bg-card rounded-xl p-6 border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-secondary">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.student_number} • {s.programme}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Phase: </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s.current_phase || 'CSP600'}</span>
                </div>
                <p className="text-sm mt-2 line-clamp-2">{s.fyp_title || 'No title'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={s.fyp_status} />
                {activeTab === 'examining' && (
                  <button 
                    onClick={() => {
                      const formType = s.current_phase === 'CSP600' ? 'F7' : 'F10';
                      const criteria = prompt(`Evaluate ${s.name} (${formType})\nEnter score out of 100:`);
                      if (criteria) {
                        api.post('/evaluations', {
                          student_id: s.user_id,
                          form_type: formType,
                          phase: s.current_phase || 'CSP600',
                          rubric_scores: { "overall": criteria },
                          comments: "Evaluated from quick action"
                        }).then(() => alert('Evaluation saved!'))
                        .catch(e => alert('Failed to save evaluation'));
                      }
                    }}
                    className="text-xs px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-light transition-colors"
                  >
                    Evaluate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
