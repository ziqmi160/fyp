import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, X, ClipboardList, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertCircle, Users, Download, ClipboardCheck,
  Eye, FileText, ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import FilePreview from '../../components/common/FilePreview';

// Rubric form types a coordinator can attach to a task for inline marking.
const RUBRIC_OPTIONS = [
  { value: 'F2', label: 'F2 – Project Motivation' },
  { value: 'F3', label: 'F3 – Literature Review' },
  { value: 'F4', label: 'F4 – Methodology' },
];

export default function CoordinatorTasks() {
  const [filterClass, setFilterClass] = useState('');
  const [sortBy, setSortBy] = useState('created'); // 'created' | 'deadline'
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
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

  const sortTasks = (list) => {
    const sorted = [...list];
    if (sortBy === 'deadline') {
      // tasks without a deadline sort to the end
      sorted.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    return sorted;
  };

  const tasksByClass = tasks.reduce((acc, t) => {
    const key = t.class_id;
    if (!acc[key]) acc[key] = { class: t.class, tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});
  Object.values(tasksByClass).forEach(group => { group.tasks = sortTasks(group.tasks); });

  const openEdit = (task) => { setEditTarget(task); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };
  const toggleExpand = (id) => setExpandedTask(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage tasks and due dates for your classes</p>
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            title="Sort tasks"
          >
            <option value="created">Sort: Date created</option>
            <option value="deadline">Sort: Deadline</option>
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
          <p className="text-sm mt-1">Default tasks are auto-created when classes are set up. You can also add extra tasks here.</p>
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
                    onPreview={setPreviewFile}
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
          onSuccess={() => { qc.invalidateQueries(['coordinator-tasks']); closeForm(); }}
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

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">{previewFile.file_name}</span>
              </h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-gray-200 rounded-lg transition shrink-0">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              <FilePreview filePath={`/uploads/${previewFile.file_path}`} fileName={previewFile.file_name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, isExpanded, detail, onToggle, onEdit, onDelete, onPreview }) {
  const [downloading, setDownloading] = useState(false);

  const downloadAll = async () => {
    setDownloading(true);
    try {
      const resp = await api.get(`/tasks/coordinator/${task.id}/submissions/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task.title.replace(/[^a-z0-9]+/gi, '_')}_submissions.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No file submissions to download.');
    } finally {
      setDownloading(false);
    }
  };

  const hasFiles = detail?.submissions?.some(s => (s.SubmissionAttachments || []).length > 0);

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
            {task.is_final_report && (
              <span className="text-xs px-2 py-0.5 bg-[#8B0000]/10 text-[#8B0000] rounded-full font-medium">Final Report</span>
            )}
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
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
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
              {/* Submitted students — documents + inline marking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Submitted ({detail.submissions.length})
                  </p>
                  {hasFiles && (
                    <button
                      onClick={downloadAll}
                      disabled={downloading}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloading ? 'Preparing…' : 'Download all'}
                    </button>
                  )}
                </div>
                {detail.submissions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">None yet</p>
                ) : (
                  <div className="space-y-2">
                    {detail.submissions.map(s => (
                      <SubmissionRow
                        key={s.id}
                        submission={s}
                        task={task}
                        onPreview={onPreview}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Not submitted */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Not Submitted ({detail.not_submitted.length})
                </p>
                {detail.not_submitted.length === 0 ? (
                  <p className="text-sm text-green-600 font-medium">All students submitted!</p>
                ) : (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
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
          )}
        </div>
      )}
    </div>
  );
}

// ─── SubmissionRow ────────────────────────────────────────────────────────────
// One submitted student: shows their uploaded documents and, if the task has a
// rubric, an inline marking panel.

function SubmissionRow({ submission: s, task, onPreview }) {
  const [grading, setGrading] = useState(false);
  const attachments = s.SubmissionAttachments || [];
  const hasRubric = !!task.form_type;

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <span className="font-medium text-sm">{s.student?.name}</span>
        <span className="text-gray-400 text-xs">
          {new Date(s.submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {hasRubric && (
          <button
            onClick={() => setGrading(v => !v)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            {grading ? 'Hide marking' : 'Mark'}
          </button>
        )}
      </div>

      {/* Submission documents */}
      {attachments.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map(att => (
            <div key={att.id} className="inline-flex items-center gap-1.5 text-xs border rounded-lg pl-2 pr-1 py-1 bg-gray-50">
              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="max-w-[160px] truncate" title={att.file_name}>{att.file_name}</span>
              <button
                onClick={() => onPreview(att)}
                title="Preview"
                className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-primary"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <a
                href={`/uploads/${att.file_path}`}
                download={att.file_name}
                title="Download"
                className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-primary"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        s.external_link ? (
          <a href={s.external_link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ExternalLink className="w-3.5 h-3.5" /> External link
          </a>
        ) : (
          <p className="mt-2 text-xs text-gray-400 italic">No documents attached</p>
        )
      )}

      {hasRubric && grading && (
        <GradePanel task={task} studentId={s.student_id} submissionId={s.id} />
      )}
    </div>
  );
}

// ─── GradePanel ───────────────────────────────────────────────────────────────
// Inline rubric marking for one student, no page switch needed.

function GradePanel({ task, studentId, submissionId }) {
  const qc = useQueryClient();
  const rubric = Array.isArray(task.rubric) ? task.rubric : [];

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['task-evaluation', task.id, studentId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/coordinator/${task.id}/evaluations/${studentId}`);
      return data.data;
    },
  });

  // scores keyed by criterion index
  const [scores, setScores] = useState({});

  // Seed scores from a saved evaluation once it loads.
  useEffect(() => {
    if (!evaluation) return;
    const map = {};
    (evaluation.criteria_scores || []).forEach(({ criterion_index, score }) => {
      map[criterion_index] = score;
    });
    setScores(map);
  }, [evaluation]);

  const total = rubric.reduce((sum, c, i) => {
    const v = parseFloat(scores[i]);
    return sum + (Number.isFinite(v) ? c.weight * v : 0);
  }, 0);
  const maxTotal = rubric.reduce((sum, c) => sum + c.weight * c.score_max, 0);

  const saveMutation = useMutation({
    mutationFn: (status) => {
      const criteria_scores = rubric.map((_, i) => ({
        criterion_index: i,
        score: scores[i] === '' || scores[i] === undefined ? null : Number(scores[i]),
      }));
      return api.post(`/tasks/coordinator/${task.id}/evaluations/${studentId}`, {
        criteria_scores,
        submission_id: submissionId,
        status,
      });
    },
    onSuccess: () => {
      toast.success('Marks saved.');
      qc.invalidateQueries(['task-evaluation', task.id, studentId]);
      qc.invalidateQueries(['coordinator-tasks']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Persist current scores first, then generate the PDF.
      const criteria_scores = rubric.map((_, i) => ({
        criterion_index: i,
        score: scores[i] === '' || scores[i] === undefined ? null : Number(scores[i]),
      }));
      await api.post(`/tasks/coordinator/${task.id}/evaluations/${studentId}`, {
        criteria_scores, submission_id: submissionId, status: 'submitted',
      });
      return api.post(`/tasks/coordinator/${task.id}/evaluations/${studentId}/generate-pdf`);
    },
    onSuccess: () => {
      toast.success('Evaluation PDF generated.');
      qc.invalidateQueries(['task-evaluation', task.id, studentId]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate PDF'),
  });

  const downloadPdf = async () => {
    try {
      const resp = await api.get(`/tasks/coordinator/${task.id}/evaluations/${studentId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task.form_type}_eval.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Generate the PDF first.');
    }
  };

  if (isLoading) {
    return <div className="mt-3 text-xs text-gray-400">Loading marking…</div>;
  }

  return (
    <div className="mt-3 border-t pt-3">
      <div className="space-y-2">
        {rubric.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              {c.description && <p className="text-xs text-gray-400 truncate">{c.description}</p>}
            </div>
            <span className="text-xs text-gray-400 shrink-0">W{c.weight}</span>
            <input
              type="number"
              min={c.score_min}
              max={c.score_max}
              value={scores[i] ?? ''}
              onChange={(e) => setScores(prev => ({ ...prev, [i]: e.target.value }))}
              placeholder={`${c.score_min}-${c.score_max}`}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-medium">
          Total: <span className="text-primary">{total.toFixed(1)}</span>
          <span className="text-gray-400"> / {maxTotal}</span>
        </span>
        <div className="flex gap-2">
          {evaluation?.document_path && (
            <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate('draft')}
            disabled={saveMutation.isPending}
            className="text-xs px-3 py-1.5 rounded-lg border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {generateMutation.isPending ? 'Saving…' : 'Submit & generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskFormModal ────────────────────────────────────────────────────────────

function TaskFormModal({ initial, classes, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    class_id: initial?.class_id ? String(initial.class_id) : '',
    due_date: initial?.due_date ? initial.due_date.slice(0, 10) : '',
    form_type: initial?.form_type || '',
    is_final_report: initial?.is_final_report || false,
    apply_to_all: false,
  });
  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().slice(0, 10);

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

  const originalDueDate = initial?.due_date ? initial.due_date.slice(0, 10) : '';

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!initial && !form.apply_to_all && !form.class_id) e.class_id = 'Select a class.';
    // Only flag a past due date when it's being set/changed, matching the backend.
    if (form.due_date && form.due_date !== originalDueDate && form.due_date < today) {
      e.due_date = 'Due date cannot be in the past.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      class_id: form.apply_to_all ? undefined : parseInt(form.class_id),
      due_date: form.due_date || null,
      form_type: form.form_type || null,
      is_final_report: form.is_final_report,
      apply_to_all: !initial && form.apply_to_all,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 my-4">
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
              placeholder="e.g. Additional Assignment"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add any instructions or details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {!initial && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.apply_to_all}
                  onChange={(e) => setForm({ ...form, apply_to_all: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Create this task in all my classes
              </label>

              {!form.apply_to_all && (
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
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              min={today}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.due_date && <p className="text-xs text-red-600 mt-1">{errors.due_date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evaluation Rubric <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.form_type}
              onChange={(e) => setForm({ ...form, form_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">No rubric (submission only)</option>
              {RUBRIC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Attach a rubric to mark students directly from the task list.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_final_report}
                onChange={(e) => setForm({ ...form, is_final_report: e.target.checked })}
                className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>
                <span className="font-medium">Mark as the final report</span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  When students submit this task, their supervisor and examiner can view the
                  report from the Evaluation page. Only one task per class can be the final report.
                </span>
              </span>
            </label>
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

// ─── DeleteModal ──────────────────────────────────────────────────────────────

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
