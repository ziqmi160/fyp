import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import { Edit2, X, Upload, FileText, Download } from 'lucide-react';

export default function CoordinatorStudents() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const csvInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/classes');
      return data.data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['coordinator-students', filterStatus, filterClass],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterClass) params.set('class_id', filterClass);
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

  const importMutation = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('csv', file);
      return api.post('/coordinator/import-students', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      setImportResult(res.data.data);
      setCsvFile(null);
      queryClient.invalidateQueries(['coordinator-students']);
      queryClient.invalidateQueries(['coordinator-classes']);
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Import failed'),
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

  const assignClassMutation = useMutation({
    mutationFn: ({ student_user_id, class_id }) =>
      api.post('/coordinator/classes/assign-student', { student_user_id, class_id }),
    onSuccess: () => {
      toast.success('Class updated.');
      queryClient.invalidateQueries(['coordinator-students']);
      queryClient.invalidateQueries(['coordinator-classes']);
      setEditingStudent(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update class'),
  });

  const filtered = students.filter(s =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ['Name', 'Student No', 'Programme', 'Class', 'Supervisor', 'Phase', 'Examiner', 'FYP Status'];
    const rows = filtered.map(s => [
      s.name, s.student_id, s.programme, s.class_name || s.group_name,
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
    const class_id = formData.get('class_id');

    // Examiner update
    updateMutation.mutate({
      id: editingStudent.user_id,
      payload: { examiner_id: examiner_id ? parseInt(examiner_id) : null }
    });

    // Class update only if changed
    const currentClassId = editingStudent.class_id ? String(editingStudent.class_id) : '';
    if (class_id !== currentClassId) {
      assignClassMutation.mutate({
        student_user_id: editingStudent.user_id,
        class_id: class_id ? parseInt(class_id) : null
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h2 className="text-xl font-semibold">Student Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            className="px-4 py-2 rounded-lg border text-sm"
          />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm"
          >
            <option value="">All classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border text-sm">
            <option value="">All statuses</option>
            <option value="no_supervisor">No supervisor</option>
            <option value="pending_approval">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => { setShowImport(true); setImportResult(null); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm">
            <Upload className="w-4 h-4" />Import
          </button>
          <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Export CSV</button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Student</th>
              <th className="text-left p-4 font-medium">Class</th>
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
                  <div className="text-gray-500 text-xs">{s.student_id} | {s.programme}</div>
                </td>
                <td className="p-4">
                  {s.class_name || s.group_name
                    ? <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">{s.class_name || s.group_name}</span>
                    : <span className="text-gray-400 text-xs">Unassigned</span>
                  }
                </td>
                <td className="p-4">{s.supervisor_name || '-'}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                    {s.current_phase || 'CSP600'}
                  </span>
                </td>
                <td className="p-4">{s.examiner_name || '-'}</td>
                <td className="p-4"><StatusBadge status={s.fyp_status} /></td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingStudent(s)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Import Students Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg text-secondary">Import Students from CSV</h3>
              <button onClick={() => { setShowImport(false); setCsvFile(null); setImportResult(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!importResult ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">Required CSV columns:</p>
                    <code className="text-xs">student_id, name, email, programme, group</code>
                    <p className="mt-2 text-xs">
                      Initial password = student&apos;s matric number. Classes are auto-created from the <code>group</code> column.
                    </p>
                  </div>

                  <a
                    href="data:text/csv;charset=utf-8,student_id%2Cname%2Cemail%2Cprogramme%2Cgroup%0A2021123456%2CAhmad%20bin%20Ali%2Cahmad@student.uitm.edu.my%2CCS230%2C2305B"
                    download="students_template.csv"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV template
                  </a>

                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                  />

                  {csvFile ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border text-sm">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1 truncate">{csvFile.name}</span>
                      <button onClick={() => setCsvFile(null)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => csvInputRef.current?.click()}
                      className="flex items-center gap-2 w-full justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:text-primary transition text-sm text-gray-500"
                    >
                      <Upload className="w-4 h-4" />
                      Select CSV file
                    </button>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setShowImport(false); setCsvFile(null); }} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Cancel</button>
                    <button
                      onClick={() => importMutation.mutate(csvFile)}
                      disabled={!csvFile || importMutation.isPending}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {importMutation.isPending ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{importResult.created.length}</div>
                      <div className="text-sm text-green-600">Students imported</div>
                    </div>
                    <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-700">{importResult.skipped.length}</div>
                      <div className="text-sm text-yellow-600">Skipped</div>
                    </div>
                  </div>
                  {importResult.skipped.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Skipped rows:</p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {importResult.skipped.map((s, i) => (
                          <li key={i}>{s.email || s.student_id || 'row'} — {s.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button onClick={() => { setShowImport(false); setImportResult(null); }} className="w-full py-2 rounded-lg bg-primary text-white text-sm">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg text-secondary">Edit Student</h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Student: <span className="font-semibold text-secondary">{editingStudent.name}</span>
                <span className="ml-2 text-xs text-gray-400">{editingStudent.student_id}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  name="class_id"
                  defaultValue={editingStudent.class_id || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">-- No class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Examiner</label>
                <select
                  name="examiner_id"
                  defaultValue={editingStudent.examiner_id || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">-- No Examiner --</option>
                  {supervisors.map(sup => (
                    <option key={sup.user_id} value={sup.user_id} disabled={sup.user_id === editingStudent.current_supervisor_id}>
                      {sup.name} {sup.user_id === editingStudent.current_supervisor_id ? '(Supervisor)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">The supervisor cannot also be the examiner.</p>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending || assignClassMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
                >
                  {updateMutation.isPending || assignClassMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
