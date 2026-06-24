import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, UserX, RotateCcw, ChevronDown, ChevronUp, Edit2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  coordinator_phase: z.enum(['CSP600', 'CSP650'], { required_error: 'Phase is required' }),
  academic_year: z.string().optional(),
  classes: z.string().optional(),
});

export default function ManageCoordinators() {
  const [showForm, setShowForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const qc = useQueryClient();

  const { data: coordinators = [], isLoading } = useQuery({
    queryKey: ['admin-coordinators'],
    queryFn: async () => {
      const { data } = await api.get('/admin/coordinators');
      return data.data?.coordinators || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/coordinators', body),
    onSuccess: () => {
      toast.success('Coordinator account created.');
      reset();
      setShowForm(false);
      qc.invalidateQueries(['admin-coordinators']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create coordinator'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coordinators/${id}/deactivate`),
    onSuccess: () => {
      toast.success('Coordinator deactivated.');
      qc.invalidateQueries(['admin-coordinators']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to deactivate'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coordinators/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Coordinator reactivated.');
      qc.invalidateQueries(['admin-coordinators']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reactivate'),
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, coordinator_phase }) => api.put(`/admin/coordinators/${id}/phase`, { coordinator_phase }),
    onSuccess: () => {
      toast.success('Phase updated.');
      setEditingPhase(null);
      qc.invalidateQueries(['admin-coordinators']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update phase'),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manage Coordinators</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light"
        >
          <UserPlus className="w-4 h-4" />
          Add Coordinator
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-medium mb-4">New Coordinator Account</h3>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Dr. Coordinator Name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="coordinator@uitm.edu.my"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Phase</label>
                <select
                  {...register('coordinator_phase')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">Select phase...</option>
                  <option value="CSP600">CSP600</option>
                  <option value="CSP650">CSP650</option>
                </select>
                {errors.coordinator_phase && <p className="text-red-500 text-xs mt-1">{errors.coordinator_phase.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('academic_year')}
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="e.g. 2024/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classes <span className="text-gray-400 font-normal">(optional — comma-separated group names)</span>
                </label>
                <input
                  {...register('classes')}
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="e.g. 2305A, 2305B, 2305C"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Classes will be auto-created with default tasks for the selected phase.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setShowForm(false); }}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : coordinators.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No coordinators found. Add one above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Phase</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Classes</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coordinators.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-sm text-gray-600">{c.email}</td>
                  <td className="p-4">
                    {editingPhase?.id === c.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingPhase.phase}
                          onChange={(e) => setEditingPhase({ ...editingPhase, phase: e.target.value })}
                          className="px-2 py-1 text-xs border rounded-lg focus:ring-1 focus:ring-primary"
                        >
                          <option value="CSP600">CSP600</option>
                          <option value="CSP650">CSP650</option>
                        </select>
                        <button
                          onClick={() => updatePhaseMutation.mutate({ id: c.id, coordinator_phase: editingPhase.phase })}
                          disabled={updatePhaseMutation.isPending}
                          className="px-2 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >Save</button>
                        <button onClick={() => setEditingPhase(null)} className="px-2 py-1 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.coordinator_phase === 'CSP600' ? 'bg-blue-100 text-blue-700' : c.coordinator_phase === 'CSP650' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.coordinator_phase || 'Unassigned'}
                        </span>
                        <button onClick={() => setEditingPhase({ id: c.id, phase: c.coordinator_phase || 'CSP600' })} className="text-gray-400 hover:text-gray-600">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {c.classes?.length > 0 ? (
                      <button
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {c.classes.length} class{c.classes.length !== 1 ? 'es' : ''}
                        {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                    {expandedId === c.id && c.classes?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.classes.map(cls => (
                          <span key={cls.id} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {cls.name}
                            {cls.academic_year && <span className="text-gray-400 ml-1">· {cls.academic_year}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    {c.is_active ? (
                      <button
                        onClick={() => deactivateMutation.mutate(c.id)}
                        disabled={deactivateMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivateMutation.mutate(c.id)}
                        disabled={reactivateMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
