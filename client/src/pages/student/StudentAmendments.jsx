import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Send, 
  Calendar,
  User,
  Users,
  Download
} from 'lucide-react';

export default function StudentAmendments() {
  const queryClient = useQueryClient();
  const [showF12Form, setShowF12Form] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState(null);
  const [f12FormData, setF12FormData] = useState({
    corrections_made: '',
    additional_changes: '',
    student_declaration: ''
  });

  const { data: amendments = [], isLoading } = useQuery({
    queryKey: ['student-amendments'],
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

  const submitF12Mutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await api.post(`/amendments/${id}/f12`, formData);
      return data.data;
    },
    onSuccess: () => {
      toast.success('F12 form submitted successfully!');
      setShowF12Form(false);
      setSelectedAmendment(null);
      setF12FormData({
        corrections_made: '',
        additional_changes: '',
        student_declaration: ''
      });
      queryClient.invalidateQueries(['student-amendments']);
      queryClient.invalidateQueries(['amendment-stats']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit F12 form'),
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
      case 'f12_submitted': return <Send className="w-4 h-4" />;
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

  const handleSubmitF12 = (e) => {
    e.preventDefault();
    if (!selectedAmendment) return;
    
    submitF12Mutation.mutate({
      id: selectedAmendment.id,
      formData: f12FormData
    });
  };

  const handleOpenF12Form = (amendment) => {
    setSelectedAmendment(amendment);
    setF12FormData({
      corrections_made: '',
      additional_changes: '',
      student_declaration: ''
    });
    setShowF12Form(true);
  };

  const downloadF12Form = (amendment) => {
    // Generate F12 form content
    const f12Data = amendment.f12_form_data;
    if (!f12Data) return;

    const content = `
FYP CONFIRMATION OF CORRECTION (F12)

Student Information:
- Name: ${amendment.student?.name}
- Student ID: ${amendment.student_id}
- Project: ${amendment.PresentationSlot?.PresentationSession?.title || 'N/A'}

Amendment Details:
- Amendment Type: ${amendment.amendment_type}
- Description: ${amendment.description}
- Deadline: ${amendment.deadline_date ? new Date(amendment.deadline_date).toLocaleDateString() : 'N/A'}

Corrections Made:
${f12Data.corrections_made || 'Not specified'}

Additional Changes:
${f12Data.additional_changes || 'None'}

Student Declaration:
${f12Data.student_declaration || 'Not provided'}

Supervisor Approval:
${f12Data.supervisor_approval ? 
  `✓ Approved on ${new Date(f12Data.supervisor_approval.approved_at).toLocaleDateString()}
   Comments: ${f12Data.supervisor_approval.comments || 'None'}` : 
  'Pending'}

Examiner Approval:
${f12Data.examiner_approval ? 
  `✓ Approved on ${new Date(f12Data.examiner_approval.approved_at).toLocaleDateString()}
   Comments: ${f12Data.examiner_approval.comments || 'None'}` : 
  'Pending'}

Submission Date: ${f12Data.submitted_at ? new Date(f12Data.submitted_at).toLocaleDateString() : 'N/A'}
    `.trim();

    // Create and download file
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
        <h2 className="text-xl font-semibold text-secondary">Amendments</h2>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary">Amendments</h2>
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
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.pending || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-blue-600" />
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

      {/* Amendments List */}
      {amendments.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Amendments Required</h3>
          <p className="text-gray-500">
            You don't have any amendments at this time. Amendments will appear here if they are required after your presentations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {amendments.map((amendment) => (
            <div key={amendment.id} className="bg-card rounded-xl border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="text-lg font-semibold capitalize">{amendment.amendment_type} Amendment</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(amendment.status)}`}>
                      {getStatusIcon(amendment.status)}
                      <span>{getStatusLabel(amendment.status)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {new Date(amendment.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {amendment.deadline_date && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {new Date(amendment.deadline_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Supervisor: {amendment.supervisor?.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Examiner: {amendment.examiner?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Required Amendments:</h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {amendment.description}
                    </p>
                  </div>

                  {/* F12 Form Data */}
                  {amendment.f12_form_data && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">F12 Form Status</h5>
                      <div className="space-y-2 text-sm">
                        {amendment.f12_form_data.corrections_made && (
                          <div>
                            <strong>Corrections Made:</strong>
                            <p className="text-blue-800 mt-1">{amendment.f12_form_data.corrections_made}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <strong>Supervisor Approval:</strong>
                            <div className="mt-1">
                              {amendment.f12_form_data.supervisor_approval ? (
                                <span className="text-green-600">✓ Approved</span>
                              ) : (
                                <span className="text-yellow-600">Pending</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <strong>Examiner Approval:</strong>
                            <div className="mt-1">
                              {amendment.f12_form_data.examiner_approval ? (
                                <span className="text-green-600">✓ Approved</span>
                              ) : (
                                <span className="text-yellow-600">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 ml-4">
                  <div className="flex flex-col space-y-2">
                    {amendment.status === 'in_progress' && (
                      <button
                        onClick={() => handleOpenF12Form(amendment)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Submit F12</span>
                      </button>
                    )}
                    
                    {amendment.f12_form_data && (
                      <button
                        onClick={() => downloadF12Form(amendment)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download F12</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* F12 Form Modal */}
      {showF12Form && selectedAmendment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">FYP Confirmation of Correction (F12 Form)</h3>
              <button
                onClick={() => setShowF12Form(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <AlertCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Amendment Details:</h4>
              <p className="text-sm text-gray-600">{selectedAmendment.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Deadline: {selectedAmendment.deadline_date ? new Date(selectedAmendment.deadline_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <form onSubmit={handleSubmitF12} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corrections Made *
                </label>
                <textarea
                  value={f12FormData.corrections_made}
                  onChange={(e) => setF12FormData({ ...f12FormData, corrections_made: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe all corrections you have made based on the feedback..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Changes (if any)
                </label>
                <textarea
                  value={f12FormData.additional_changes}
                  onChange={(e) => setF12FormData({ ...f12FormData, additional_changes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Any additional changes made beyond the required corrections..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Declaration *
                </label>
                <textarea
                  value={f12FormData.student_declaration}
                  onChange={(e) => setF12FormData({ ...f12FormData, student_declaration: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="I declare that all required corrections have been made and the project now meets the required standards..."
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> By submitting this F12 form, you confirm that all required amendments have been completed. 
                  This form will be sent to your supervisor and examiner for approval.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowF12Form(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitF12Mutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {submitF12Mutation.isLoading ? 'Submitting...' : 'Submit F12 Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
