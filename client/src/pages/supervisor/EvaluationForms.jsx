import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusIcons = {
  draft: <Clock className="w-4 h-4 text-yellow-600" />,
  submitted: <CheckCircle className="w-4 h-4 text-green-600" />,
  approved: <CheckCircle className="w-4 h-4 text-blue-600" />
};

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-green-100 text-green-800',
  approved: 'bg-blue-100 text-blue-800'
};

export default function EvaluationForms() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [selectedFormType, setSelectedFormType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  
  const [formData, setFormData] = useState({
    student_id: '',
    form_type: 'F7',
    phase: 'CSP600',
    scores: {},
    comments: '',
    recommendations: ''
  });

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['evaluation-forms', filterStatus, filterPhase],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPhase) params.append('phase', filterPhase);
      
      const { data } = await api.get(`/evaluation-forms/my-forms?${params}`);
      return data.data || [];
    },
  });

  const { data: rubricTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['rubric-template', selectedFormType],
    queryFn: async () => {
      if (!selectedFormType) return null;
      const { data } = await api.get(`/evaluation-forms/templates/${selectedFormType}`);
      return data.data;
    },
    enabled: !!selectedFormType,
  });

  const createFormMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/evaluation-forms', formData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluation-forms']);
      setShowCreateForm(false);
      resetForm();
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: async ({ id, ...formData }) => {
      const { data } = await api.put(`/evaluation-forms/${id}`, formData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluation-forms']);
      setEditingForm(null);
      resetForm();
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/evaluation-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluation-forms']);
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.put(`/evaluation-forms/${id}`, { status: 'submitted' });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluation-forms']);
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      form_type: 'F7',
      phase: 'CSP600',
      scores: {},
      comments: '',
      recommendations: ''
    });
    setSelectedFormType('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingForm) {
      updateFormMutation.mutate({ id: editingForm.id, ...formData });
    } else {
      createFormMutation.mutate(formData);
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setFormData({
      student_id: form.student_id,
      form_type: form.form_type,
      phase: form.phase,
      scores: form.scores || {},
      comments: form.comments || '',
      recommendations: form.recommendations || ''
    });
    setSelectedFormType(form.form_type);
    setShowCreateForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this evaluation form?')) {
      deleteFormMutation.mutate(id);
    }
  };

  const handleSubmitForm = (id) => {
    if (window.confirm('Are you sure you want to submit this evaluation form? You cannot edit it after submission.')) {
      submitFormMutation.mutate(id);
    }
  };

  const handleScoreChange = (criterionName, score) => {
    setFormData({
      ...formData,
      scores: {
        ...formData.scores,
        [criterionName]: parseFloat(score)
      }
    });
  };

  const calculateTotalScore = () => {
    if (!rubricTemplate) return 0;
    return rubricTemplate.criteria.reduce((total, criterion) => {
      return total + (formData.scores[criterion.name] || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">Evaluation Forms</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary">Evaluation Forms</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Evaluation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
          </select>

          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Phases</option>
            <option value="CSP600">CSP600</option>
            <option value="CSP650">CSP650</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            {forms.length} form{forms.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingForm ? 'Edit Evaluation Form' : 'Create New Evaluation Form'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="number"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="Enter student user ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Type
                  </label>
                  <select
                    value={formData.form_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const csp600Types = ['F3', 'F4', 'F7', 'F8'];
                      setFormData({
                        ...formData,
                        form_type: type,
                        phase: csp600Types.includes(type) ? 'CSP600' : formData.phase,
                        scores: {}
                      });
                      setSelectedFormType(type);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <optgroup label="CSP600 — Project Formulation">
                      <option value="F3">F3 - Literature Review Evaluation</option>
                      <option value="F4">F4 - Methodology Evaluation</option>
                      <option value="F7">F7 - Proposal Presentation</option>
                      <option value="F8">F8 - Proposal Report</option>
                    </optgroup>
                    <optgroup label="CSP650 — Project">
                      <option value="F9">F9 - Progress Presentation</option>
                      <option value="F10">F10 - Final Presentation</option>
                      <option value="F11">F11 - Final Report</option>
                      <option value="F13">F13 - LMC Evaluation</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phase
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="CSP600">CSP600</option>
                    <option value="CSP650">CSP650</option>
                  </select>
                </div>
              </div>

              {/* Rubric Scoring */}
              {rubricTemplate && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Scoring Rubric</h4>
                  <div className="space-y-4">
                    {rubricTemplate.criteria.map((criterion) => (
                      <div key={criterion.name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {criterion.name}
                          </label>
                          <p className="text-xs text-gray-500">Max Score: {criterion.max_score}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={criterion.max_score}
                            step="0.5"
                            value={formData.scores[criterion.name] || ''}
                            onChange={(e) => handleScoreChange(criterion.name, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                          <span className="text-sm text-gray-600">/ {criterion.max_score}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Score:</span>
                        <span className="text-lg font-bold text-primary">
                          {calculateTotalScore()} / {rubricTemplate.max_score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Provide detailed feedback on the student's performance..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Suggestions for improvement..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingForm(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                {editingForm && editingForm.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handleSubmitForm(editingForm.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Submit Form
                  </button>
                )}
                <button
                  type="submit"
                  disabled={createFormMutation.isLoading || updateFormMutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {editingForm ? 'Update' : 'Create'} Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forms List */}
      <div className="bg-card rounded-xl border">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">My Evaluation Forms</h3>
          
          {forms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No evaluation forms found</p>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div key={form.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {statusIcons[form.status]}
                        <h4 className="font-semibold">{form.form_type}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${statusColors[form.status]}`}>
                          {form.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Student: {form.student?.name}</p>
                        <p>Phase: {form.phase}</p>
                        <p>Score: {form.total_score || 'N/A'} / {form.max_score}</p>
                        {form.submitted_at && (
                          <p>Submitted: {new Date(form.submitted_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(form)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition"
                        title="Edit"
                        disabled={form.status === 'submitted'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition"
                        title="Delete"
                        disabled={form.status === 'submitted'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
