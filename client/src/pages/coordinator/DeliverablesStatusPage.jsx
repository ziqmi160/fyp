import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DeliverablesStatusPage() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSubmissionStatus = async (submissionId) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/deliverables/submission/${submissionId}/status`);
      setStatus(data.data);
      setDeliverables(data.data.checklist);
    } catch (err) {
      toast.error('Failed to load deliverables status');
    } finally {
      setLoading(false);
    }
  };

  const deliverableTypeLabels = {
    report_pdf: 'Report (PDF)',
    report_docx: 'Report (DOCX)',
    slides: 'Presentation Slides',
    poster: 'Poster',
    raw_data: 'Raw Data',
    system_files: 'System Files',
    apk_exe: 'APK/EXE'
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Final Deliverables Status</h1>

      <div className="mb-6">
        <label className="block font-medium mb-2">Search Submission</label>
        <input
          type="text"
          placeholder="Enter submission ID"
          onChange={(e) => {
            if (e.target.value) {
              setSelectedSubmission(e.target.value);
              loadSubmissionStatus(e.target.value);
            }
          }}
          className="px-4 py-2 border rounded w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : status ? (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <strong>Completion Status</strong>
              <span className="text-2xl font-bold text-primary">{status.completionPercentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${status.completionPercentage}%` }}
              />
            </div>
            <p className="text-sm mt-2">{status.totalDeliverables} of {status.requiredDeliverables} submitted</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold mb-4">Checklist</h2>
            {deliverables.map(item => (
              <div key={item.type} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={item.submitted}
                  disabled
                  className="mr-3 w-5 h-5"
                />
                <span className="flex-1 font-medium">{deliverableTypeLabels[item.type]}</span>
                {item.submitted ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    ✓ Submitted
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                    Pending
                  </span>
                )}
              </div>
            ))}
          </div>

          {status.complete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ All deliverables submitted</p>
            </div>
          )}

          {!status.complete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                {status.requiredDeliverables - status.totalDeliverables} deliverable(s) still pending.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Enter a submission ID to check deliverables status</div>
      )}
    </div>
  );
}
