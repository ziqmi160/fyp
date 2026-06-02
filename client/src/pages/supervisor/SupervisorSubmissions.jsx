import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FileText, ExternalLink, Download, Eye, X, Upload, CheckCircle } from 'lucide-react';
import FileViewer from 'react-file-viewer';
// import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

export default function SupervisorSubmissions() {
  const [activeTab, setActiveTab] = useState('supervisees');
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('approved');
  const [previewFile, setPreviewFile] = useState(null);
  const [signedReportFile, setSignedReportFile] = useState(null);
  const signedReportInputRef = useRef(null);
  const qc = useQueryClient();

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-pending'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/pending');
      return data.data || [];
    },
  });

  const { data: examining = [] } = useQuery({
    queryKey: ['submissions-examining'],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/my/examining/submissions');
      return data.data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/submissions/${id}/review`, body),
    onSuccess: () => {
      toast.success('Review submitted');
      setSelected(null);
      qc.invalidateQueries(['submissions-pending']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const uploadSignedReportMutation = useMutation({
    mutationFn: ({ id, file }) => {
      const form = new FormData();
      form.append('file', file);
      return api.put(`/submissions/${id}/upload-signed-report`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      toast.success('Signed report uploaded');
      setSignedReportFile(null);
      setSelected(res.data.data);
      qc.invalidateQueries(['submissions-pending']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Upload failed'),
  });

  const handleReview = () => {
    if (!selected) return;
    reviewMutation.mutate({ id: selected.id, supervisor_feedback: feedback, status });
  };

  const displayList = activeTab === 'supervisees' ? submissions : examining;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-semibold">Submission Review</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('supervisees'); setSelected(null); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'supervisees' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-secondary'
            }`}
          >
            My Supervisees
          </button>
          <button
            onClick={() => { setActiveTab('examining'); setSelected(null); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'examining' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-secondary'
            }`}
          >
            Examining Reports
          </button>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState icon={FileText} message={activeTab === 'supervisees' ? "No pending submissions to review" : "No examination reports received yet"} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {displayList.map((s) => (
              <div
                key={s.id}
                onClick={() => { setSelected(s); setFeedback(''); setStatus('approved'); }}
                className={`bg-card rounded-xl p-4 border cursor-pointer ${selected?.id === s.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{s.title}</h3>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-sm text-gray-500">{s.student?.name} • {s.submission_type}</p>
              </div>
            ))}
          </div>
          {selected && (
            <div className="bg-card rounded-xl p-6 border">
              <h3 className="font-semibold mb-4">{selected.title}</h3>
              {selected.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selected.description}
                  </p>
                </div>
              )}
              {selected.SubmissionAttachments?.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                  {selected.SubmissionAttachments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">{a.file_name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewFile(a)}
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
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selected.external_link && (
                <a href={selected.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary mb-4">
                  <ExternalLink className="w-4 h-4" />
                  {selected.external_link}
                </a>
              )}
              {activeTab === 'supervisees' && (
                <>
                  {selected.status === 'pending' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Feedback</label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border"
                          rows={4}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg border">
                          <option value="approved">Approved</option>
                          <option value="revision_required">Revision Required</option>
                        </select>
                      </div>
                      <button
                        onClick={handleReview}
                        disabled={reviewMutation.isPending}
                        className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-light"
                      >
                        Submit Review
                      </button>
                    </>
                  )}

                  {/* Supervisor Approval page upload — only for final/F6b submissions */}
                  {['final', 'F6b'].includes(selected.submission_type) && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Supervisor Approval Page</h4>
                      {selected.supervisor_report_approved_at ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                          <div className="text-sm">
                            <p className="text-green-800 font-medium">Signed report uploaded</p>
                            <p className="text-green-600 text-xs">
                              {new Date(selected.supervisor_report_approved_at).toLocaleString()}
                            </p>
                          </div>
                          {selected.supervisor_signed_report_path && (
                            <a
                              href={`/uploads/${selected.supervisor_signed_report_path}`}
                              download
                              className="ml-auto p-1.5 text-green-700 hover:bg-green-100 rounded transition"
                              title="Download signed report"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">
                            Download the student's report, sign the Supervisor Approval page, then upload the signed version.
                          </p>
                          <input
                            ref={signedReportInputRef}
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            onChange={(e) => setSignedReportFile(e.target.files[0])}
                          />
                          {signedReportFile ? (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-sm">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate flex-1">{signedReportFile.name}</span>
                              <button onClick={() => setSignedReportFile(null)} className="text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => signedReportInputRef.current?.click()}
                              className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-primary hover:text-primary transition w-full justify-center"
                            >
                              <Upload className="w-4 h-4" />
                              Select signed report
                            </button>
                          )}
                          {signedReportFile && (
                            <button
                              onClick={() => uploadSignedReportMutation.mutate({ id: selected.id, file: signedReportFile })}
                              disabled={uploadSignedReportMutation.isPending}
                              className="w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm disabled:opacity-50"
                            >
                              Upload Signed Report
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
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
                <FileViewer
                  fileType={previewFile.file_path.split('.').pop().toLowerCase()}
                  filePath={`/uploads/${previewFile.file_path}`}
                  onError={(e) => console.error('Error viewing file:', e)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">

            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="truncate max-w-md">{previewFile.file_name}</span>
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
                title="Close Viewer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 bg-gray-100 overflow-hidden">
              <DocViewer
                documents={[
                  {
                    uri: `${window.location.origin}/uploads/${previewFile.file_path}`,
                    fileName: previewFile.file_name,
                  },
                ]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: "100%" }}
                config={{
                  header: {
                    disableHeader: true, // We use your custom header instead
                    disableFileName: true,
                  },
                  pdfZoom: {
                    defaultZoom: 1,
                    zoomJump: 0.1,
                  },
                  pdfVerticalScrollByDefault: true,
                }}
                theme={{
                  primary: "#3b82f6", // Replace with your Tailwind primary hex if different
                  secondary: "#ffffff",
                  tertiary: "#f3f4f6",
                }}
              />
            </div>

          </div>
        </div>
      )} */}
    </div>
  );
}
