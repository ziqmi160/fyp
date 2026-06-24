import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FileText, Plus, ExternalLink, Download, Eye, X } from 'lucide-react';
import FilePreview from '../../components/common/FilePreview';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  submission_type: z.enum([
    'proposal', 'progress_report', 'draft', 'final', 
    'F2', 'F3', 'F4', 'BMC', 'LMC', 'F6a', 'F6b', 'final_package'
  ]),
  description: z.string().optional(),
  external_link: z.union([z.string().url(), z.literal('')]).optional(),
  files: z.any().optional(),
});

export default function StudentSubmissions() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-my'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/my');
      return data.data || [];
    },
  });

  const hasSupervisor = !!profile?.current_supervisor_id;

  const createMutation = useMutation({
    mutationFn: (formData) => {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('submission_type', formData.submission_type);
      if (formData.description) fd.append('description', formData.description);
      if (formData.external_link) fd.append('external_link', formData.external_link);
      (formData.files || []).forEach((f) => fd.append('files', f));
      return api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Submission created!');
      setShowForm(false);
      qc.invalidateQueries(['submissions-my']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Submissions</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!hasSupervisor}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Submission
        </button>
      </div>

      {!hasSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          You need an active supervisor to submit.
        </div>
      )}

      {submissions.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={FileText} message="No submissions yet" actionLabel="New Submission" onAction={() => setShowForm(true)} />
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(selected?.id === s.id ? null : s)}
              className="bg-card rounded-xl p-4 border cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.submission_type} • {new Date(s.submitted_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              {selected?.id === s.id && (
                <div className="mt-4 border-t pt-4 space-y-4">
                  {s.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{s.description}</p>
                    </div>
                  )}
                  {s.SubmissionAttachments?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {s.SubmissionAttachments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-gray-700 truncate">{a.file_name}</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewFile(a); }}
                                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded transition"
                                title="Preview Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={`/uploads/${a.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded transition flex items-center justify-center"
                                title="Download Document"
                                download={a.file_name}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.external_link && (
                    <a href={s.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm hover:underline">
                      <ExternalLink className="w-4 h-4" />
                      {s.external_link}
                    </a>
                  )}
                  {s.supervisor_feedback && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg shrink-0">
                      <p className="text-sm font-medium text-blue-900 mb-1">Supervisor Feedback</p>
                      <p className="text-sm text-blue-800">{s.supervisor_feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SubmissionForm
          onClose={() => setShowForm(false)}
          onSubmit={(d) => createMutation.mutate(d)}
          loading={createMutation.isPending}
        />
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="truncate max-w-md">{previewFile.file_name}</span>
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Close Viewer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex relative items-center justify-center">
              <div className="w-full h-full max-h-full overflow-auto">
                <FilePreview
                  filePath={`/uploads/${previewFile.file_path}`}
                  fileName={previewFile.file_name}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionForm({ onClose, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <div className="bg-card rounded-xl p-6 border">
      <h3 className="font-semibold mb-4">New Submission</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input {...register('title')} className="w-full px-4 py-2 rounded-lg border" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select {...register('submission_type')} className="w-full px-4 py-2 rounded-lg border">
            <optgroup label="General">
              <option value="proposal">Proposal</option>
              <option value="progress_report">Progress Report</option>
              <option value="draft">Draft</option>
              <option value="final">Final Report</option>
            </optgroup>
            <optgroup label="Official Forms">
              <option value="F2">F2 Form</option>
              <option value="F3">F3 Form</option>
              <option value="F4">F4 Form</option>
              <option value="F6a">F6a Form (Proposal Submission)</option>
              <option value="F6b">F6b Form (Final Submission)</option>
            </optgroup>
            <optgroup label="Other Documents">
              <option value="BMC">BMC</option>
              <option value="LMC">LMC</option>
              <option value="final_package">Final Package</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea {...register('description')} rows={3} className="w-full px-4 py-2 rounded-lg border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">External Link (optional)</label>
          <input {...register('external_link')} type="url" className="w-full px-4 py-2 rounded-lg border" placeholder="https://..." />
          {errors.external_link && <p className="text-red-500 text-sm">{errors.external_link.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Files (pdf, docx, pptx, zip - max 10MB each)</label>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.zip"
            onChange={(e) => setValue('files', Array.from(e.target.files || []))}
            className="w-full px-4 py-2 rounded-lg border"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white">Submit</button>
        </div>
      </form>
    </div>
  );
}
