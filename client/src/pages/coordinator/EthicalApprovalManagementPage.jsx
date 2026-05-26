import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function EthicalApprovalManagementPage() {
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', coordinator_notes: '' });

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const fetchApprovals = async () => {
    try {
      const { data } = await api.get('/api/ethical-approval', {
        params: { status: filter !== 'all' ? filter : '' }
      });
      setApprovals(data.data);
    } catch (err) {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (approval) => {
    setReviewingId(approval.id);
    setReviewForm({
      status: approval.status,
      coordinator_notes: approval.coordinator_notes || ''
    });
  };

  const submitReview = async (studentId) => {
    try {
      const { data } = await api.put(`/api/ethical-approval/${studentId}/status`, reviewForm);
      setApprovals(approvals.map(a => a.student_id === studentId ? data.data : a));
      toast.success('Ethical approval updated');
      setReviewingId(null);
    } catch (err) {
      toast.error('Failed to update approval');
    }
  };

  const setRequirement = async (studentId, required) => {
    try {
      await api.put(`/api/ethical-approval/${studentId}/requirement`, { required });
      await fetchApprovals();
      toast.success(`Ethical approval requirement ${required ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update requirement');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'waived': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ethical Approval Management</h1>

      <div className="mb-6 flex gap-2">
        {['pending', 'approved', 'waived', 'not_required', 'all'].map(status => (
          <button
            key={status}
            onClick={() => { setFilter(status); setLoading(true); fetchApprovals(); }}
            className={`px-4 py-2 rounded text-sm ${
              filter === status ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No records found</div>
      ) : (
        <div className="space-y-4">
          {approvals.map(approval => (
            <div key={approval.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium">{approval.User?.name}</p>
                  <p className="text-sm text-gray-600">{approval.User?.email}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(approval.status)}`}>
                  {approval.status.toUpperCase()}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm">
                  Required: <strong>{approval.required ? 'Yes' : 'No'}</strong>
                </p>
              </div>

              {reviewingId === approval.id ? (
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
                      <option value="waived">Waived</option>
                      <option value="not_required">Not Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Notes</label>
                    <textarea
                      value={reviewForm.coordinator_notes}
                      onChange={(e) => setReviewForm({ ...reviewForm, coordinator_notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReview(approval.student_id)}
                      className="px-4 py-2 bg-primary text-white rounded font-medium"
                    >
                      Save
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(approval)}
                    className="px-4 py-2 bg-primary text-white rounded text-sm"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => setRequirement(approval.student_id, !approval.required)}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                  >
                    {approval.required ? 'Mark Not Required' : 'Mark Required'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
