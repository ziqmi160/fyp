import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuotaBar from '../../components/common/QuotaBar';

export default function CoordinatorSupervisors() {
  const [editingQuota, setEditingQuota] = useState(null);
  const [quotaVal, setQuotaVal] = useState('');
  const qc = useQueryClient();

  const { data: supervisors = [] } = useQuery({
    queryKey: ['coordinator-supervisors'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/supervisors');
      return data.data || [];
    },
  });

  const updateQuota = useMutation({
    mutationFn: ({ id, max_students }) => api.put(`/coordinator/supervisors/${id}/quota`, { max_students }),
    onSuccess: () => {
      toast.success('Quota updated');
      setEditingQuota(null);
      qc.invalidateQueries(['coordinator-supervisors']);
    },
  });

  const handleSaveQuota = (sup) => {
    const v = parseInt(quotaVal, 10);
    if (!isNaN(v) && v >= 0) {
      updateQuota.mutate({ id: sup.id, max_students: v });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Supervisor Management</h2>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Expertise</th>
              <th className="text-left p-4">Load</th>
              <th className="text-left p-4">Availability</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {supervisors.map((sup) => (
              <tr key={sup.id} className="border-t">
                <td className="p-4 font-medium">{sup.name}</td>
                <td className="p-4 text-sm">
                  {Array.isArray(sup.expertise) && sup.expertise.length > 0
                    ? sup.expertise.join(', ')
                    : '-'}
                </td>
                <td className="p-4 w-32">
                  <QuotaBar current={sup.current_student_count} max={sup.max_students} />
                </td>
                <td className="p-4">
                  <span className={sup.is_accepting ? 'text-green-600' : 'text-gray-500'}>
                    {sup.is_accepting ? 'Accepting' : 'Not accepting'}
                  </span>
                </td>
                <td className="p-4">
                  {editingQuota === sup.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={quotaVal}
                        onChange={(e) => setQuotaVal(e.target.value)}
                        className="w-20 px-2 py-1 rounded border"
                      />
                      <button onClick={() => handleSaveQuota(sup)} className="text-primary text-sm">Save</button>
                      <button onClick={() => setEditingQuota(null)} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingQuota(sup.id); setQuotaVal(sup.max_students); }} className="text-primary text-sm hover:underline">
                      Edit quota
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
