import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Edit2, Trash2, User, Users, Search } from 'lucide-react';

export default function ExaminerAssignment() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [formData, setFormData] = useState({
    student_id: '',
    examiner_id: '',
    phase: 'CSP600',
    assignment_type: 'proposal'
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['examiner-assignments', filterPhase, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterPhase) params.append('phase', filterPhase);
      if (filterType) params.append('assignment_type', filterType);
      
      const { data } = await api.get(`/examiner-assignments?${params}`);
      return data.data || [];
    },
  });

  const { data: availableExaminers = [] } = useQuery({
    queryKey: ['available-examiners'],
    queryFn: async () => {
      const { data } = await api.get('/examiner-assignments/available');
      return data.data || [];
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData) => {
      const { data } = await api.post('/examiner-assignments', assignmentData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['examiner-assignments']);
      setShowCreateForm(false);
      setFormData({
        student_id: '',
        examiner_id: '',
        phase: 'CSP600',
        assignment_type: 'proposal'
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...assignmentData }) => {
      const { data } = await api.put(`/examiner-assignments/${id}`, assignmentData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['examiner-assignments']);
      setEditingAssignment(null);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/examiner-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['examiner-assignments']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment.id, ...formData });
    } else {
      createAssignmentMutation.mutate(formData);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      student_id: assignment.student_id,
      examiner_id: assignment.examiner_id,
      phase: assignment.phase,
      assignment_type: assignment.assignment_type
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this examiner assignment?')) {
      deleteAssignmentMutation.mutate(id);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const studentName = assignment.student?.name?.toLowerCase() || '';
    const examinerName = assignment.examiner?.name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return (studentName.includes(searchLower) || examinerName.includes(searchLower));
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">Examiner Assignments</h2>
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
        <h2 className="text-xl font-semibold text-secondary">Examiner Assignments</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student or examiner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Phases</option>
            <option value="CSP600">CSP600</option>
            <option value="CSP650">CSP650</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="proposal">Proposal</option>
            <option value="final">Final</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  Examiner
                </label>
                <select
                  value={formData.examiner_id}
                  onChange={(e) => setFormData({ ...formData, examiner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select an examiner</option>
                  {availableExaminers.map((examiner) => (
                    <option key={examiner.id} value={examiner.id}>
                      {examiner.name} - {examiner.SupervisorProfile?.specialization || 'No specialization'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="proposal">Proposal</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAssignment(null);
                    setFormData({
                      student_id: '',
                      examiner_id: '',
                      phase: 'CSP600',
                      assignment_type: 'proposal'
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssignmentMutation.isLoading || updateAssignmentMutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-card rounded-xl border">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Assignments</h3>
          
          {filteredAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No examiner assignments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Examiner</th>
                    <th className="text-left py-3 px-4">Phase</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Assigned By</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{assignment.student?.name}</div>
                          <div className="text-sm text-gray-500">
                            {assignment.student?.StudentProfile?.student_id}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{assignment.examiner?.name}</div>
                          <div className="text-sm text-gray-500">{assignment.examiner?.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {assignment.phase}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {assignment.assignment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          assignment.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {assignment.assigner?.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
