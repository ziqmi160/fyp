import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Upload, FileText,
  X, ExternalLink, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';

export default function StudentTasks() {
  const [submittingTask, setSubmittingTask] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | submitted | pending | overdue
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-class-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/my-class');
      return data.data || [];
    },
  });

  const hasSupervisor = !!profile?.current_supervisor_id;
  const hasClass = !!profile?.class_id;

  const now = new Date();

  const filteredTasks = tasks.filter((task) => {
    const submitted = !!task.my_submission;
    const due = task.due_date ? new Date(task.due_date) : null;
    const isOverdue = !submitted && due && due < now;
    if (statusFilter === 'submitted') return submitted;
    if (statusFilter === 'pending') return !submitted;
    if (statusFilter === 'overdue') return isOverdue;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">My Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tasks assigned by your coordinator</p>
        </div>
        {tasks.length > 0 && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white text-sm sm:w-44"
          >
            <option value="all">All tasks</option>
            <option value="pending">Not submitted</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
        )}
      </div>

      {!hasClass && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          You have not been assigned to a class yet. Contact your coordinator.
        </div>
      )}

      {hasClass && !hasSupervisor && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          You need to be assigned a supervisor before you can submit tasks.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : tasks.length === 0 && hasClass ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No tasks assigned yet</p>
          <p className="text-sm mt-1">Your coordinator hasn&apos;t created any tasks for your class.</p>
        </div>
      ) : filteredTasks.length === 0 && hasClass ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No tasks match this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const due = task.due_date ? new Date(task.due_date) : null;
            const isOverdue = due && due < now;
            const isDueSoon = due && !isOverdue && (due - now) < 3 * 24 * 60 * 60 * 1000;
            const submitted = !!task.my_submission;
            const isExpanded = expandedTask === task.id;

            return (
              <div key={task.id} className="bg-card rounded-xl border overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className={`mt-0.5 shrink-0 ${submitted ? 'text-green-500' : isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {due && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-gray-500'}`}>
                          {isOverdue
                            ? <AlertCircle className="w-3.5 h-3.5" />
                            : <Clock className="w-3.5 h-3.5" />
                          }
                          Due {due.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {isOverdue && ' (overdue)'}
                          {isDueSoon && !isOverdue && ' (due soon)'}
                        </span>
                      )}

                      {submitted && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {submitted ? (
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        View
                      </button>
                    ) : (
                      <button
                        onClick={() => setSubmittingTask(task)}
                        disabled={!hasSupervisor}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && submitted && (
                  <div className="border-t bg-gray-50 px-4 py-3 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{task.my_submission.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Submitted {new Date(task.my_submission.submitted_at).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <StatusBadge status={task.my_submission.status} />
                    </div>
                    {task.my_submission.supervisor_feedback && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-0.5">Supervisor Feedback</p>
                          <p className="text-sm text-blue-900">{task.my_submission.supervisor_feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {submittingTask && (
        <SubmitModal
          task={submittingTask}
          onClose={() => setSubmittingTask(null)}
          onSuccess={() => {
            qc.invalidateQueries(['my-class-tasks']);
            setSubmittingTask(null);
          }}
        />
      )}
    </div>
  );
}

function SubmitModal({ task, onClose, onSuccess }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('task_id', task.id);
      fd.append('submission_type', 'progress_report');
      if (description) fd.append('description', description);
      if (externalLink) fd.append('external_link', externalLink);
      files.forEach(f => fd.append('files', f));
      return api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Submission uploaded!');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit'),
  });

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-semibold text-secondary">Submit Task</h3>
            <p className="text-sm text-gray-500">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add any notes for your supervisor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ExternalLink className="inline w-3.5 h-3.5 mr-1" />
              External Link <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Files <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
            />
            {files.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 w-full justify-center px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:text-primary transition text-sm text-gray-500"
            >
              <Upload className="w-4 h-4" />
              Add files
            </button>
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim()}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
