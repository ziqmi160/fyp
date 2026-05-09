import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Users, UserPlus } from 'lucide-react';

export default function PresentationSessions() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterPhase, setFilterPhase] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    session_type: 'proposal',
    phase: 'CSP600',
    date: '',
    start_time: '',
    end_time: '',
    venue: '',
    description: ''
  });

  const [slotFormData, setSlotFormData] = useState({
    session_id: '',
    student_id: '',
    supervisor_id: '',
    examiner_id: '',
    start_time: '',
    end_time: '',
    room: ''
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['presentation-sessions', filterPhase, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterPhase) params.append('phase', filterPhase);
      if (filterType) params.append('session_type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      
      const { data } = await api.get(`/presentation-sessions?${params}`);
      return data.data || [];
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      const { data } = await api.post('/presentation-sessions', sessionData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
      setShowCreateForm(false);
      resetSessionForm();
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...sessionData }) => {
      const { data } = await api.put(`/presentation-sessions/${id}`, sessionData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
      setEditingSession(null);
      resetSessionForm();
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/presentation-sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: async (slotData) => {
      const { data } = await api.post('/presentation-sessions/slots', slotData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
      setShowSlotForm(false);
      resetSlotForm();
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, ...slotData }) => {
      const { data } = await api.put(`/presentation-sessions/slots/${id}`, slotData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/presentation-sessions/slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['presentation-sessions']);
    },
  });

  const resetSessionForm = () => {
    setSessionFormData({
      title: '',
      session_type: 'proposal',
      phase: 'CSP600',
      date: '',
      start_time: '',
      end_time: '',
      venue: '',
      description: ''
    });
  };

  const resetSlotForm = () => {
    setSlotFormData({
      session_id: '',
      student_id: '',
      supervisor_id: '',
      examiner_id: '',
      start_time: '',
      end_time: '',
      room: ''
    });
  };

  const handleSessionSubmit = (e) => {
    e.preventDefault();
    if (editingSession) {
      updateSessionMutation.mutate({ id: editingSession.id, ...sessionFormData });
    } else {
      createSessionMutation.mutate(sessionFormData);
    }
  };

  const handleSlotSubmit = (e) => {
    e.preventDefault();
    createSlotMutation.mutate(slotFormData);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionFormData({
      title: session.title,
      session_type: session.session_type,
      phase: session.phase,
      date: session.date?.split('T')[0],
      start_time: session.start_time,
      end_time: session.end_time,
      venue: session.venue,
      description: session.description || ''
    });
    setShowCreateForm(true);
  };

  const handleDeleteSession = (id) => {
    if (window.confirm('Are you sure you want to delete this presentation session?')) {
      deleteSessionMutation.mutate(id);
    }
  };

  const handleAddSlot = (session) => {
    setSelectedSession(session);
    setSlotFormData({
      ...slotFormData,
      session_id: session.id,
      start_time: session.start_time,
      end_time: session.end_time
    });
    setShowSlotForm(true);
  };

  const handleDeleteSlot = (id) => {
    if (window.confirm('Are you sure you want to delete this presentation slot?')) {
      deleteSlotMutation.mutate(id);
    }
  };

  const updateSlotStatus = (slotId, status) => {
    updateSlotMutation.mutate({ id: slotId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-secondary">Presentation Sessions</h2>
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
        <h2 className="text-xl font-semibold text-secondary">Presentation Sessions</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="progress">Progress</option>
            <option value="final">Final</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Create/Edit Session Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingSession ? 'Edit Presentation Session' : 'Create New Presentation Session'}
            </h3>
            
            <form onSubmit={handleSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={sessionFormData.title}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                  placeholder="e.g., CSP600 Proposal Defense - Day 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Type
                  </label>
                  <select
                    value={sessionFormData.session_type}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, session_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="proposal">Proposal Defense</option>
                    <option value="progress">Progress Presentation</option>
                    <option value="final">Final Presentation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phase
                  </label>
                  <select
                    value={sessionFormData.phase}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="CSP600">CSP600</option>
                    <option value="CSP650">CSP650</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionFormData.date}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={sessionFormData.venue}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, venue: e.target.value })}
                    placeholder="e.g., Meeting Room 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={sessionFormData.start_time}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={sessionFormData.end_time}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, end_time: e.target.value })}
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
                  value={sessionFormData.description}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional description for this session"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSession(null);
                    resetSessionForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isLoading || updateSessionMutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {editingSession ? 'Update' : 'Create'} Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showSlotForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Presentation Slot</h3>
            
            <form onSubmit={handleSlotSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">Session: {selectedSession?.title}</p>
                <p className="text-sm text-gray-600">
                  {selectedSession?.date} at {selectedSession?.start_time} - {selectedSession?.end_time}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="number"
                  value={slotFormData.student_id}
                  onChange={(e) => setSlotFormData({ ...slotFormData, student_id: e.target.value })}
                  placeholder="Enter student user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor ID
                </label>
                <input
                  type="number"
                  value={slotFormData.supervisor_id}
                  onChange={(e) => setSlotFormData({ ...slotFormData, supervisor_id: e.target.value })}
                  placeholder="Enter supervisor user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Examiner ID
                </label>
                <input
                  type="number"
                  value={slotFormData.examiner_id}
                  onChange={(e) => setSlotFormData({ ...slotFormData, examiner_id: e.target.value })}
                  placeholder="Enter examiner user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotFormData.start_time}
                    onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotFormData.end_time}
                    onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  value={slotFormData.room}
                  onChange={(e) => setSlotFormData({ ...slotFormData, room: e.target.value })}
                  placeholder="e.g., Room 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSlotForm(false);
                    setSelectedSession(null);
                    resetSlotForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSlotMutation.isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <p className="text-gray-500">No presentation sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-card rounded-xl border">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{session.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{session.start_time} - {session.end_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{session.venue}</span>
                      </div>
                    </div>

                    {session.description && (
                      <p className="mt-2 text-sm text-gray-600">{session.description}</p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddSlot(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Add Slot"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditSession(session)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Presentation Slots */}
                {session.PresentationSlots && session.PresentationSlots.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Presentation Slots</h4>
                      <span className="text-sm text-gray-500">
                        {session.PresentationSlots.length} slot{session.PresentationSlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {session.PresentationSlots.map((slot) => (
                        <div key={slot.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 text-sm">
                                <div>
                                  <span className="font-medium">{slot.student?.name}</span>
                                  <span className="text-gray-500 ml-2">(ID: {slot.student_id})</span>
                                </div>
                                <div className="text-gray-600">
                                  {slot.start_time} - {slot.end_time}
                                </div>
                                {slot.room && (
                                  <div className="text-gray-600">Room: {slot.room}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span>Supervisor: {slot.supervisor?.name}</span>
                                <span>Examiner: {slot.examiner?.name}</span>
                                {slot.student_confirmed && (
                                  <span className="text-green-600">✓ Student confirmed</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <select
                                value={slot.status}
                                onChange={(e) => updateSlotStatus(slot.id, e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
