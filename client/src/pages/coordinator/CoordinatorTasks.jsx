import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, X, ClipboardList, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertCircle, Users
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CoordinatorTasks() {
  const [filterClass, setFilterClass] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const qc = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/classes');
      return data.data || [];
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['coordinator-tasks', filterClass],
    queryFn: async () => {
      const params = filterClass ? `?class_id=${filterClass}` : '';
      const { data } = await api.get(`/tasks/coordinator${params}`);
      return data.data || [];
    },
  });

  const { data: taskDetail } = useQuery({
    queryKey: ['task-submissions', expandedTask],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/coordinator/${expandedTask}/submissions`);
      return data.data;
    },
    enabled: !!expandedTask,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/coordinator/${id}`),
    onSuccess: () => {
      toast.success('Task deleted.');
      setDeleteTarget(null);
      qc.invalidateQueries(['coordinator-tasks']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  // Group tasks by class
  const tasksByClass = tasks.reduce((acc, t) => {
    const key = t.class_id;
    if (!acc[key]) acc[key] = { class: t.class, tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});

  const openEdit = (task) => {
    setEditTarget(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const toggleExpand = (id) => setExpandedTask(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assign tasks with deadlines to your classes</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
            ))}
          </select>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : Object.keys(tasksByClass).length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm mt-1">Create tasks for your classes — students will see them and submit against each one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(tasksByClass).map(({ class: cls, tasks: classTasks }) => (
            <div key={cls.id}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800">{cls.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  {cls.phase}
                </span>
                <span className="text-xs text-gray-400">{classTasks.length} task{classTasks.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3">
                {classTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isExpanded={expandedTask === task.id}
                    detail={expandedTask === task.id ? taskDetail : null}
                    onToggle={() => toggleExpand(task.id)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => setDeleteTarget(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          initial={editTarget}
          classes={classes}
          onClose={closeForm}
          onSuccess={() => {
            qc.invalidateQueries(['coordinator-tasks']);
            closeForm();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          task={deleteTarget}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function TaskRow({ task, isExpanded, detail, onToggle, onEdit, onDelete }) {
  const now = new Date();
  const due = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = due && due < now;
  const isDueSoon = due && !isOverdue && (due - now) < 3 * 24 * 60 * 60 * 1000;

  const submittedCount = task.submission_count ?? 0;
  const totalCount = task.student_count ?? 0;
  const pct = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-secondary truncate">{task.title}</span>
            {!task.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactive</span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {due && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-gray-500'}`}>
              {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {due.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>{submittedCount}/{totalCount}</span>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          {!detail ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Submitted ({detail.submissions.length})</p>
                  {detail.submissions.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">None yet</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.submissions.map(s => (
                        <li key={s.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="font-medium">{s.student?.name}</span>
                          <span className="text-gray-400 text-xs ml-auto">
                            {new Date(s.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Not Submitted ({detail.not_submitted.length})</p>
                  {detail.not_submitted.length === 0 ? (
                    <p className="text-sm text-green-600 font-medium">All students submitted!</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.not_submitted.map(s => (
                        <li key={s.user_id} className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskFormModal({ initial, classes, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    class_id: initial?.class_id ? String(initial.class_id) : '',
    due_date: initial?.due_date || '',
    order_index: initial?.order_index ?? 0,
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (payload) =>
      initial
        ? api.put(`/tasks/coordinator/${initial.id}`, payload)
        : api.post('/tasks/coordinator', payload),
    onSuccess: () => {
      toast.success(initial ? 'Task updated.' : 'Task created.');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!initial && !form.class_id) e.class_id = 'Select a class.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      class_id: parseInt(form.class_id),
      due_date: form.due_date || null,
      order_index: Number(form.order_index) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{initial ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Chapter 1 Submission"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add any instructions or details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {!initial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.class_id ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select a class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
                ))}
              </select>
              {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                min="0"
                value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : initial ? 'Save Changes' : 'Create Task'}
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

function DeleteModal({ task, onConfirm, onClose, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">Delete Task</h3>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete <span className="font-semibold">{task.title}</span>?
          {task.submission_count > 0 && (
            <span className="block mt-2 text-amber-600 font-medium">
              This task has {task.submission_count} submission(s) and cannot be deleted.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending || task.submission_count > 0}
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
