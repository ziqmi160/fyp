import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PlagiarismCheckPage() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubmissionId, setCurrentSubmissionId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMyChecks();
  }, []);

  const fetchMyChecks = async () => {
    try {
      const { data } = await api.get('/api/plagiarism-checks/my-checks');
      setChecks(data.data);
    } catch (err) {
      toast.error('Failed to load plagiarism checks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !currentSubmissionId) {
      toast.error('Please select a file and submission');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('report', file);

      const { data } = await api.post(
        `/api/plagiarism-checks/${currentSubmissionId}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setChecks([data.data, ...checks]);
      toast.success('Plagiarism check uploaded');
      setFile(null);
      setCurrentSubmissionId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Plagiarism Check</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm">Upload your plagiarism report/screenshot from Turnitin or similar tool.</p>
      </div>

      <form onSubmit={handleUpload} className="bg-white border rounded-lg p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Submission</label>
            <input
              type="number"
              value={currentSubmissionId}
              onChange={(e) => setCurrentSubmissionId(e.target.value)}
              placeholder="Enter submission ID"
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Plagiarism Report File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept="image/*,.pdf"
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-primary text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </div>
      </form>

      <h2 className="text-2xl font-bold mb-4">Your Checks</h2>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : checks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No plagiarism checks yet</div>
      ) : (
        <div className="space-y-4">
          {checks.map(check => (
            <div key={check.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Submission #{check.submission_id}</p>
                  <p className="text-sm text-gray-600">{new Date(check.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
              {check.similarity_percentage && (
                <p className="text-sm">Similarity: <span className="font-bold">{check.similarity_percentage}%</span></p>
              )}
              {check.coordinator_notes && (
                <p className="text-sm text-gray-600 mt-2"><strong>Feedback:</strong> {check.coordinator_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
