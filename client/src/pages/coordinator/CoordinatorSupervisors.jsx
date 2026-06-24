import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuotaBar from '../../components/common/QuotaBar';
import { Search } from 'lucide-react';

export default function CoordinatorSupervisors() {
  const [editingQuota, setEditingQuota] = useState(null);
  const [quotaVal, setQuotaVal] = useState('');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const qc = useQueryClient();

  const { data: supervisors = [] } = useQuery({
    queryKey: ['coordinator-supervisors'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/supervisors');
      return data.data || [];
    },
  });

  const filtered = supervisors.filter((sup) => {
    if (availability === 'accepting' && !sup.is_accepting) return false;
    if (availability === 'not_accepting' && sup.is_accepting) return false;
    if (!search) return true;
    const expertiseText = Array.isArray(sup.expertise) ? sup.expertise.join(' ') : (sup.expertise || '');
    return (sup.name || '').toLowerCase().includes(search.toLowerCase()) ||
      expertiseText.toLowerCase().includes(search.toLowerCase());
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h2 className="text-xl font-semibold">Supervisor Management</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or expertise..."
              className="pl-9 pr-4 py-2 rounded-lg border text-sm"
            />
          </div>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            <option value="">All availability</option>
            <option value="accepting">Accepting</option>
            <option value="not_accepting">Not accepting</option>
          </select>
        </div>
      </div>

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
            {filtered.map((sup) => (
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
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">No supervisors match your search.</p>
        )}
      </div>
    </div>
  );
}
