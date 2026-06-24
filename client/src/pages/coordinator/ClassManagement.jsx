import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Edit2, Trash2, X, BookOpen, GraduationCap, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ClassManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/classes');
      return data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coordinator/classes/${id}`),
    onSuccess: () => {
      toast.success('Class deleted.');
      setDeleteTarget(null);
      qc.invalidateQueries(['coordinator-classes']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  const openEdit = (cls) => {
    setEditTarget(cls);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Classes you coordinate. You can manage as many classes as you need.</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm mt-1">Use “Add Class” above to create your first class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onEdit={() => openEdit(cls)}
              onDelete={() => setDeleteTarget(cls)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ClassFormModal
          initial={editTarget}
          onClose={closeForm}
          onSuccess={() => {
            qc.invalidateQueries(['coordinator-classes']);
            closeForm();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          cls={deleteTarget}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function ClassCard({ cls, onEdit, onDelete }) {
  const phaseColor = cls.phase === 'CSP600'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <div className="bg-card rounded-xl border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{cls.name}</h3>
          </div>
          <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${phaseColor}`}>
            {cls.phase}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="w-4 h-4 text-gray-400" />
        <span>{cls.student_count ?? 0} student{cls.student_count !== 1 ? 's' : ''}</span>
      </div>

      {(cls.academic_year || cls.semester) && (
        <p className="text-xs text-gray-400">
          {[cls.academic_year, cls.semester ? `Sem ${cls.semester}` : null].filter(Boolean).join(' · ')}
        </p>
      )}

      {!cls.is_active && (
        <span className="text-xs text-amber-600 font-medium">Inactive</span>
      )}
    </div>
  );
}

function ClassFormModal({ initial, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phase: initial?.phase || 'CSP600',
    academic_year: initial?.academic_year || '',
    semester: initial?.semester || '',
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (payload) =>
      initial
        ? api.put(`/coordinator/classes/${initial.id}`, payload)
        : api.post('/coordinator/classes', payload),
    onSuccess: () => {
      toast.success(initial ? 'Class updated.' : 'Class created.');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Class name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      phase: form.phase,
      academic_year: form.academic_year.trim() || null,
      semester: form.semester.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{initial ? 'Edit Class' : 'New Class'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2305B"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
            <select
              value={form.phase}
              onChange={(e) => setForm({ ...form, phase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="CSP600">CSP600</option>
              <option value="CSP650">CSP650</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                placeholder="e.g. 2024/2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">—</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : initial ? 'Save Changes' : 'Create Class'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ cls, onConfirm, onClose, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">Delete Class</h3>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete <span className="font-semibold">{cls.name}</span>?
          {cls.student_count > 0 && (
            <span className="block mt-2 text-amber-600 font-medium">
              This class has {cls.student_count} student(s). Reassign them before deleting.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending || cls.student_count > 0}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
