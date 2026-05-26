import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PlagiarismCheckReviewPage() {
  const [checks, setChecks] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', similarity_percentage: '', coordinator_notes: '' });

  useEffect(() => {
    fetchChecks();
  }, [filter]);

  const fetchChecks = async () => {
    try {
      const { data } = await api.get('/api/plagiarism-checks', {
        params: { status: filter !== 'all' ? filter : '' }
      });
      setChecks(data.data);
    } catch (err) {
      toast.error('Failed to load checks');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (check) => {
    setReviewingId(check.id);
    setReviewForm({
      status: check.status,
      similarity_percentage: check.similarity_percentage || '',
      coordinator_notes: check.coordinator_notes || ''
    });
  };

  const submitReview = async () => {
    try {
      const { data } = await api.put(`/api/plagiarism-checks/${reviewingId}/review`, reviewForm);
      setChecks(checks.map(c => c.id === reviewingId ? data.data : c));
      toast.success('Plagiarism check reviewed');
      setReviewingId(null);
    } catch (err) {
      toast.error('Failed to review check');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Plagiarism Check Review</h1>

      <div className="mb-6 flex gap-2">
        {['pending', 'approved', 'flagged', 'all'].map(status => (
          <button
            key={status}
            onClick={() => { setFilter(status); setLoading(true); fetchChecks(); }}
            className={`px-4 py-2 rounded ${
              filter === status ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {checks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No plagiarism checks found</div>
      ) : (
        <div className="space-y-4">
          {checks.map(check => (
            <div key={check.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium text-gray-600">Student: {check.Submission?.id}</p>
                  <p className="text-sm text-gray-600">{new Date(check.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>

              {check.similarity_percentage && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm">Similarity: <strong>{check.similarity_percentage}%</strong></p>
                </div>
              )}

              {reviewingId === check.id ? (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Status</label>
                    <select
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Similarity Percentage</label>
                    <input
                      type="number"
                      value={reviewForm.similarity_percentage}
                      onChange={(e) => setReviewForm({ ...reviewForm, similarity_percentage: e.target.value })}
                      placeholder="e.g., 15.5"
                      className="w-full px-4 py-2 border rounded"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Notes</label>
                    <textarea
                      value={reviewForm.coordinator_notes}
                      onChange={(e) => setReviewForm({ ...reviewForm, coordinator_notes: e.target.value })}
                      placeholder="Feedback for students"
                      rows="3"
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={submitReview}
                      className="px-4 py-2 bg-primary text-white rounded font-medium"
                    >
                      Save Review
                    </button>
                    <button
                      onClick={() => setReviewingId(null)}
                      className="px-4 py-2 bg-gray-300 rounded font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleReview(check)}
                  className="px-4 py-2 bg-primary text-white rounded font-medium"
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
