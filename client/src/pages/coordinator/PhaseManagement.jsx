import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

export default function PhaseManagement() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [formData, setFormData] = useState({
    name: 'CSP600',
    academic_year: '',
    semester: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const { data: phases = [], isLoading } = useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const { data } = await api.get('/phases');
      return data.data || [];
    },
  });

  const createPhaseMutation = useMutation({
    mutationFn: async (phaseData) => {
      const { data } = await api.post('/phases', phaseData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phases']);
      setShowCreateForm(false);
      setFormData({
        name: 'CSP600',
        academic_year: '',
        semester: '',
        start_date: '',
        end_date: '',
        description: ''
      });
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ id, ...phaseData }) => {
      const { data } = await api.put(`/phases/${id}`, phaseData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phases']);
      setEditingPhase(null);
      setFormData({
        name: 'CSP600',
        academic_year: '',
        semester: '',
        start_date: '',
        end_date: '',
        description: ''
      });
    },
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/phases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['phases']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPhase) {
      updatePhaseMutation.mutate({ id: editingPhase.id, ...formData });
    } else {
      createPhaseMutation.mutate(formData);
    }
  };

  const handleEdit = (phase) => {
    setEditingPhase(phase);
    setFormData({
      name: phase.name,
      academic_year: phase.academic_year,
      semester: phase.semester,
      start_date: phase.start_date?.split('T')[0],
      end_date: phase.end_date?.split('T')[0],
      description: phase.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this phase?')) {
      deletePhaseMutation.mutate(id);
    }
  };

  const togglePhaseStatus = (phase) => {
    updatePhaseMutation.mutate({
      id: phase.id,
      ...phase,
      is_active: !phase.is_active
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">Phase Management</h2>
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
        <h2 className="text-xl font-semibold text-secondary">Phase Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Phase</span>
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPhase ? 'Edit Phase' : 'Create New Phase'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase Name
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="CSP600">CSP600 - Project Formulation</option>
                  <option value="CSP650">CSP650 - Project Implementation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2023/2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    placeholder="Semester 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional description for this phase"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPhase(null);
                    setFormData({
                      name: 'CSP600',
                      academic_year: '',
                      semester: '',
                      start_date: '',
                      end_date: '',
                      description: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPhaseMutation.isLoading || updatePhaseMutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {editingPhase ? 'Update' : 'Create'} Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phases List */}
      <div className="bg-card rounded-xl border">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Academic Phases</h3>
          
          {phases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No phases created yet</p>
          ) : (
            <div className="space-y-4">
              {phases.map((phase) => (
                <div key={phase.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-lg">{phase.name}</h4>
                        {phase.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{phase.academic_year} - {phase.semester}</p>
                        <p>
                          {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                        </p>
                        {phase.description && (
                          <p className="mt-1 text-gray-500">{phase.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => togglePhaseStatus(phase)}
                        className="p-2 text-gray-600 hover:text-primary transition"
                        title={phase.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {phase.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(phase)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(phase.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition"
                        title="Delete"
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
