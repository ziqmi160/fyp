import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { Edit2, X } from 'lucide-react';

export default function CoordinatorStudents() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ['coordinator-students', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/coordinator/students?${params}`);
      return data.data || [];
    },
  });

  const { data: supervisors = [] } = useQuery({
    queryKey: ['coordinator-supervisors'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/supervisors');
      return data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await api.put(`/coordinator/students/${id}/phase-examiner`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coordinator-students']);
      setEditingStudent(null);
    }
  });

  const filtered = students.filter(s =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ['Name', 'Student No', 'Programme', 'Group', 'Supervisor', 'Phase', 'Examiner', 'FYP Status'];
    const rows = filtered.map(s => [
      s.name, s.student_number, s.programme, s.group_name, 
      s.supervisor_name || 'None', s.current_phase || 'CSP600', 
      s.examiner_name || 'None', s.fyp_status
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${Date.now()}.csv`;
    a.click();
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const examiner_id = formData.get('examiner_id');
    const payload = {
      current_phase: formData.get('current_phase'),
      examiner_id: examiner_id ? parseInt(examiner_id) : null,
    };
    updateMutation.mutate({ id: editingStudent.user_id, payload });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h2 className="text-xl font-semibold">Student Management</h2>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2 rounded-lg border"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border">
            <option value="">All statuses</option>
            <option value="no_supervisor">No supervisor</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-primary text-white">Export CSV</button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Student</th>
              <th className="text-left p-4 font-medium">Group</th>
              <th className="text-left p-4 font-medium">Supervisor</th>
              <th className="text-left p-4 font-medium">Phase</th>
              <th className="text-left p-4 font-medium">Examiner</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-secondary">{s.name}</div>
                  <div className="text-gray-500 text-xs">{s.student_number} | {s.programme}</div>
                </td>
                <td className="p-4">{s.group_name}</td>
                <td className="p-4">{s.supervisor_name || '-'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                    {s.current_phase || 'CSP600'}
                  </span>
                </td>
                <td className="p-4">{s.examiner_name || '-'}</td>
                <td className="p-4"><StatusBadge status={s.fyp_status} /></td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setEditingStudent(s)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit Phase & Examiner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg text-secondary">Update Phase & Examiner</h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-4">Student: <span className="font-semibold text-secondary">{editingStudent.name}</span></p>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Phase</label>
                <select 
                  name="current_phase" 
                  defaultValue={editingStudent.current_phase || 'CSP600'}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="CSP600">CSP600 (Project Formulation)</option>
                  <option value="CSP650">CSP650 (Project)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Examiner</label>
                <select 
                  name="examiner_id" 
                  defaultValue={editingStudent.examiner_id || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">-- No Examiner --</option>
                  {supervisors.map(sup => (
                    <option key={sup.user_id} value={sup.user_id} disabled={sup.user_id === editingStudent.current_supervisor_id}>
                      {sup.name} {sup.user_id === editingStudent.current_supervisor_id ? '(Supervisor)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Note: Supervisor cannot also be the examiner.</p>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
