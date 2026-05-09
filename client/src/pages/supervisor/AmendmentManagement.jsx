import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  ThumbsUp,
  Calendar,
  User,
  Users,
  Download,
  MessageSquare
} from 'lucide-react';

export default function AmendmentManagement() {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');

  const { data: amendments = [], isLoading } = useQuery({
    queryKey: ['supervisor-amendments'],
    queryFn: async () => {
      const { data } = await api.get('/amendments');
      return data.data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['amendment-stats'],
    queryFn: async () => {
      const { data } = await api.get('/amendments/stats');
      return data.data;
    },
  });

  const approveF12Mutation = useMutation({
    mutationFn: async ({ id, role, comments }) => {
      const { data } = await api.post(`/amendments/${id}/f12/approve`, { role, comments });
      return data.data;
    },
    onSuccess: () => {
      toast.success('F12 form approved successfully!');
      setShowDetails(false);
      setSelectedAmendment(null);
      setApprovalComments('');
      queryClient.invalidateQueries(['supervisor-amendments']);
      queryClient.invalidateQueries(['amendment-stats']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to approve F12 form'),
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'f12_submitted': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'f12_submitted': return <FileText className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending - Awaiting Action';
      case 'in_progress': return 'In Progress - Making Corrections';
      case 'f12_submitted': return 'F12 Form Submitted - Awaiting Approval';
      case 'completed': return 'Completed - Amendments Approved';
      default: return status;
    }
  };

  const handleApproveF12 = (role) => {
    if (!selectedAmendment || !approvalComments.trim()) {
      toast.error('Please provide approval comments');
      return;
    }

    approveF12Mutation.mutate({
      id: selectedAmendment.id,
      role,
      comments: approvalComments
    });
  };

  const handleViewDetails = (amendment) => {
    setSelectedAmendment(amendment);
    setApprovalComments('');
    setShowDetails(true);
  };

  const downloadF12Form = (amendment) => {
    const f12Data = amendment.f12_form_data;
    if (!f12Data) return;

    const content = `
FYP CONFIRMATION OF CORRECTION (F12)

Student Information:
- Name: ${amendment.student?.name}
- Student ID: ${amendment.student_id}
- Email: ${amendment.student?.email}

Amendment Details:
- Amendment Type: ${amendment.amendment_type}
- Description: ${amendment.description}
- Deadline: ${amendment.deadline_date ? new Date(amendment.deadline_date).toLocaleDateString() : 'N/A'}
- Phase: ${amendment.phase}

Supervisor: ${amendment.supervisor?.name}
Examiner: ${amendment.examiner?.name}

Corrections Made:
${f12Data.corrections_made || 'Not specified'}

Additional Changes:
${f12Data.additional_changes || 'None'}

Student Declaration:
${f12Data.student_declaration || 'Not provided'}

Supervisor Approval:
${f12Data.supervisor_approval ? 
  `✓ Approved on ${new Date(f12Data.supervisor_approval.approved_at).toLocaleDateString()}
   By: ${f12Data.supervisor_approval.approved_by}
   Comments: ${f12Data.supervisor_approval.comments || 'None'}` : 
  'Pending'}

Examiner Approval:
${f12Data.examiner_approval ? 
  `✓ Approved on ${new Date(f12Data.examiner_approval.approved_at).toLocaleDateString()}
   By: ${f12Data.examiner_approval.approved_by}
   Comments: ${f12Data.examiner_approval.comments || 'None'}` : 
  'Pending'}

Submission Date: ${f12Data.submitted_at ? new Date(f12Data.submitted_at).toLocaleDateString() : 'N/A'}

Status: ${amendment.status}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `F12_${amendment.student?.name}_${amendment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">Amendment Management</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingApproval = amendments.filter(a => a.status === 'f12_submitted');
  const inProgress = amendments.filter(a => a.status === 'in_progress');
  const completed = amendments.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary">Amendment Management</h2>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.total || 0}</p>
                <p className="text-sm text-gray-500">Total Amendments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.f12_submitted || 0}</p>
                <p className="text-sm text-gray-500">Awaiting Approval</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.in_progress || 0}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.completed || 0}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approval Section */}
      {pendingApproval.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-red-600">F12 Forms Awaiting Approval</h3>
          <div className="space-y-3">
            {pendingApproval.map((amendment) => (
              <div key={amendment.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{amendment.student?.name}</h4>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Awaiting Approval
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{amendment.amendment_type} Amendment</p>
                    <p className="text-sm text-gray-500">
                      Submitted: {amendment.f12_form_data?.submitted_at ? 
                        new Date(amendment.f12_form_data.submitted_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(amendment)}
                      className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                    <button
                      onClick={() => downloadF12Form(amendment)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-blue-600">Amendments In Progress</h3>
          <div className="space-y-3">
            {inProgress.map((amendment) => (
              <div key={amendment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{amendment.student?.name}</h4>
                    <p className="text-sm text-gray-600">{amendment.amendment_type} Amendment</p>
                    <p className="text-sm text-gray-500">
                      Deadline: {amendment.deadline_date ? 
                        new Date(amendment.deadline_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetails(amendment)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-green-600">Completed Amendments</h3>
          <div className="space-y-3">
            {completed.map((amendment) => (
              <div key={amendment.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{amendment.student?.name}</h4>
                    <p className="text-sm text-gray-600">{amendment.amendment_type} Amendment</p>
                    <p className="text-sm text-gray-500">
                      Completed: {amendment.completed_at ? 
                        new Date(amendment.completed_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(amendment)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => downloadF12Form(amendment)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download F12</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Amendments */}
      {amendments.length === 0 && (
        <div className="bg-card rounded-xl border p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Amendments Found</h3>
          <p className="text-gray-500">
            No amendments have been created for your supervisees yet.
          </p>
        </div>
      )}

      {/* Amendment Details Modal */}
      {showDetails && selectedAmendment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Amendment Details - F12 Form</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <AlertCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-3">Student Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedAmendment.student?.name}</p>
                  <p><strong>Email:</strong> {selectedAmendment.student?.email}</p>
                  <p><strong>Student ID:</strong> {selectedAmendment.student_id}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Amendment Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Type:</strong> {selectedAmendment.amendment_type}</p>
                  <p><strong>Phase:</strong> {selectedAmendment.phase}</p>
                  <p><strong>Deadline:</strong> {selectedAmendment.deadline_date ? 
                    new Date(selectedAmendment.deadline_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedAmendment.status)}`}>
                    {getStatusLabel(selectedAmendment.status)}
                  </span></p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Required Amendments</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {selectedAmendment.description}
              </p>
            </div>

            {selectedAmendment.f12_form_data && (
              <>
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Corrections Made</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedAmendment.f12_form_data.corrections_made}
                  </p>
                </div>

                {selectedAmendment.f12_form_data.additional_changes && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Additional Changes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedAmendment.f12_form_data.additional_changes}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-medium mb-2">Student Declaration</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedAmendment.f12_form_data.student_declaration}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Supervisor Approval</h5>
                    {selectedAmendment.f12_form_data.supervisor_approval ? (
                      <div className="text-sm">
                        <p className="text-green-600 font-medium">✓ Approved</p>
                        <p className="text-gray-600">
                          Date: {new Date(selectedAmendment.f12_form_data.supervisor_approval.approved_at).toLocaleDateString()}
                        </p>
                        {selectedAmendment.f12_form_data.supervisor_approval.comments && (
                          <p className="text-gray-600 mt-1">
                            <strong>Comments:</strong> {selectedAmendment.f12_form_data.supervisor_approval.comments}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-yellow-600 text-sm">Pending</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Examiner Approval</h5>
                    {selectedAmendment.f12_form_data.examiner_approval ? (
                      <div className="text-sm">
                        <p className="text-green-600 font-medium">✓ Approved</p>
                        <p className="text-gray-600">
                          Date: {new Date(selectedAmendment.f12_form_data.examiner_approval.approved_at).toLocaleDateString()}
                        </p>
                        {selectedAmendment.f12_form_data.examiner_approval.comments && (
                          <p className="text-gray-600 mt-1">
                            <strong>Comments:</strong> {selectedAmendment.f12_form_data.examiner_approval.comments}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-yellow-600 text-sm">Pending</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Approval Actions */}
            {selectedAmendment.status === 'f12_submitted' && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Approval Actions</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Comments *
                    </label>
                    <textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Provide your comments on the amendment..."
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleApproveF12('supervisor')}
                      disabled={approveF12Mutation.isLoading || !approvalComments.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {approveF12Mutation.isLoading ? 'Approving...' : 'Approve as Supervisor'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
