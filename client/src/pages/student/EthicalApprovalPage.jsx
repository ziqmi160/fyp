import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function EthicalApprovalPage() {
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchApprovalStatus();
  }, []);

  const fetchApprovalStatus = async () => {
    try {
      const { data } = await api.get('/api/ethical-approval/my-approval');
      setApproval(data.data);
    } catch (err) {
      toast.error('Failed to load ethical approval status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('recForm', file);

      const { data } = await api.post('/api/ethical-approval/submit-rec', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setApproval(data.data);
      toast.success('REC form submitted for approval');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'waived': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ethical Approval</h1>

      <div className={`rounded-lg p-6 mb-6 ${getStatusColor(approval?.status)}`}>
        <h2 className="font-bold text-lg mb-2">Status: {approval?.status.toUpperCase()}</h2>
        {approval?.required ? (
          <p className="text-sm">Ethical approval is <strong>required</strong> for your project.</p>
        ) : (
          <p className="text-sm">Ethical approval is <strong>not required</strong> for your project.</p>
        )}
      </div>

      {approval?.required && approval?.status !== 'approved' && approval?.status !== 'waived' && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Submit REC Form</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">REC Form (PDF)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf"
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-primary text-white py-2 rounded font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Submit REC Form'}
            </button>
          </div>
        </form>
      )}

      {approval?.coordinator_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-sm mb-2">Coordinator Notes:</p>
          <p className="text-sm">{approval.coordinator_notes}</p>
        </div>
      )}
    </div>
  );
}
