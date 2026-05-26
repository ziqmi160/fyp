import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DeliverablesPage() {
  const [submissionId, setSubmissionId] = useState('');
  const [deliverables, setDeliverables] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [completion, setCompletion] = useState(0);
  const [file, setFile] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const deliverableTypes = [
    { value: 'report_pdf', label: 'Report (PDF)' },
    { value: 'report_docx', label: 'Report (DOCX)' },
    { value: 'slides', label: 'Presentation Slides' },
    { value: 'poster', label: 'Poster' },
    { value: 'raw_data', label: 'Raw Data' },
    { value: 'system_files', label: 'System Files' },
    { value: 'apk_exe', label: 'APK/EXE' }
  ];

  const loadDeliverables = async (subId) => {
    if (!subId) return;
    try {
      const { data } = await api.get(`/api/deliverables/submission/${subId}/my`);
      setDeliverables(data.data.deliverables);
      setChecklist(data.data.checklist);
      setCompletion(data.data.completionPercentage);
      setLoaded(true);
    } catch (err) {
      toast.error('Failed to load deliverables');
    }
  };

  const handleLoadSubmission = () => {
    if (submissionId) loadDeliverables(submissionId);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!submissionId || !file || !selectedType) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('submission_id', submissionId);
      formData.append('type', selectedType);

      const { data } = await api.post('/api/deliverables', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Deliverable uploaded');
      loadDeliverables(submissionId);
      setFile(null);
      setSelectedType('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Final Deliverables</h1>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="number"
            value={submissionId}
            onChange={(e) => setSubmissionId(e.target.value)}
            placeholder="Enter submission ID"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleLoadSubmission}
            className="px-4 py-2 bg-primary text-white rounded font-medium"
          >
            Load
          </button>
        </div>
      </div>

      {loaded && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <strong>Completion</strong>
              <span className="text-lg font-bold">{completion}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleUpload} className="bg-white border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Upload Deliverable</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="">Select deliverable type</option>
                  {deliverableTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2">File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-primary text-white py-2 rounded font-medium disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>

          <h2 className="text-xl font-bold mb-4">Checklist</h2>
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.type} className="flex items-center p-3 border rounded">
                <input
                  type="checkbox"
                  checked={item.submitted}
                  disabled
                  className="mr-3"
                />
                <span className="flex-1">{deliverableTypes.find(t => t.value === item.type)?.label}</span>
                <span className={`px-2 py-1 rounded text-sm ${item.submitted ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                  {item.submitted ? '✓ Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
