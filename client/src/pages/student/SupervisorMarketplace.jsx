import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QuotaBar from '../../components/common/QuotaBar';
import EmptyState from '../../components/common/EmptyState';
import { Search, UserPlus, Sparkles, FileText, X } from 'lucide-react';

const requestSchema = z.object({
  title_proposed: z.string().min(1, 'Title required'),
  message: z.string().optional(),
});

function matchLabel(score) {
  if (score >= 0.6) return { label: 'Best Match', color: 'bg-green-100 text-green-700' };
  if (score >= 0.45) return { label: 'Strong Match', color: 'bg-blue-100 text-blue-700' };
  return { label: 'Good Match', color: 'bg-amber-100 text-amber-700' };
}

export default function SupervisorMarketplace() {
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data || {};
    },
  });

  const projectDescription = profile?.profile?.project_description || '';

  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors', availableOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (availableOnly) params.set('available_only', 'true');
      const { data } = await api.get(`/supervisors?${params}`);
      return data.data || [];
    },
  });

  const { data: recommendations = [], isLoading: recLoading } = useQuery({
    queryKey: ['supervisor-recommendations', projectDescription],
    queryFn: async () => {
      const { data } = await api.get('/supervisors/recommendations');
      return data.data || [];
    },
    enabled: !!projectDescription,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['requests-my'],
    queryFn: async () => {
      const { data } = await api.get('/requests/my');
      return data.data || [];
    },
  });

  const createRequest = useMutation({
    mutationFn: (body) => api.post('/requests', { ...body, supervisor_id: selectedSupervisor?.user_id }),
    onSuccess: () => {
      toast.success('Request sent!');
      setShowModal(false);
      setSelectedSupervisor(null);
      qc.invalidateQueries(['requests-my']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send'),
  });

  const filtered = supervisors.filter(s => {
    if (!search) return true;
    const expertiseText = Array.isArray(s.expertise) ? s.expertise.join(' ') : (s.expertise || '');
    return (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      expertiseText.toLowerCase().includes(search.toLowerCase());
  });

  const hasPending = myRequests.some(r => r.status === 'pending');
  const hasSupervisor = myRequests.some(r => r.status === 'accepted');

  const canRequest = (sup) => {
    if (hasSupervisor || hasPending) return false;
    if (!sup.is_accepting || sup.current_student_count >= sup.max_students) return false;
    const existing = myRequests.find(r => r.supervisor_id === (sup.user_id || sup.id));
    return !existing;
  };

  const openRequest = (sup) => {
    setSelectedSupervisor(sup);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Project Description Prompt */}
      <ProjectDescriptionPrompt
        description={projectDescription}
        onEdit={() => setShowDescModal(true)}
      />

      {/* NLP Recommendations */}
      {projectDescription && (
        <RecommendedSupervisors
          recommendations={recommendations}
          isLoading={recLoading}
          canRequest={canRequest}
          onRequest={openRequest}
        />
      )}

      {/* Browse all supervisors */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or expertise..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
          Available only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState message="No supervisors found" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sup) => (
            <SupervisorCard
              key={sup.id}
              supervisor={sup}
              canRequest={canRequest(sup)}
              onRequest={() => openRequest(sup)}
            />
          ))}
        </div>
      )}

      {showModal && selectedSupervisor && (
        <RequestModal
          supervisor={selectedSupervisor}
          onClose={() => { setShowModal(false); setSelectedSupervisor(null); }}
          onSubmit={(d) => createRequest.mutate(d)}
          loading={createRequest.isPending}
        />
      )}

      {showDescModal && (
        <DescriptionModal
          current={projectDescription}
          onClose={() => setShowDescModal(false)}
          onSaved={() => {
            setShowDescModal(false);
            qc.invalidateQueries(['user-profile']);
            qc.invalidateQueries(['supervisor-recommendations']);
          }}
        />
      )}
    </div>
  );
}

function ProjectDescriptionPrompt({ description, onEdit }) {
  if (description) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">AI matching active</p>
          <p className="text-sm text-gray-600 mt-0.5 truncate">{description}</p>
        </div>
        <button onClick={onEdit} className="text-sm text-primary hover:underline flex-shrink-0">Edit</button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
      <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Get personalised supervisor recommendations</p>
        <p className="text-sm text-amber-700 mt-0.5">Describe your FYP project and our AI will match you with the best supervisors.</p>
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
      >
        Add Description
      </button>
    </div>
  );
}

function RecommendedSupervisors({ recommendations, isLoading, canRequest, onRequest }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-secondary">Recommended for You</h3>
      </div>
      {isLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <p className="text-sm text-gray-500">No recommendations available yet. Make sure supervisors have set their expertise.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((sup) => {
            const { label, color } = matchLabel(sup.match_score);
            return (
              <div key={sup.id} className="bg-card rounded-xl p-5 border-2 border-primary/20 shadow-sm relative">
                <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
                  {label}
                </span>
                <h4 className="font-semibold text-secondary pr-20">{sup.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{sup.staff_id}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(Array.isArray(sup.expertise) ? sup.expertise : []).map((e, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{e}</span>
                  ))}
                </div>
                <div className="mt-3">
                  <QuotaBar current={sup.current_student_count} max={sup.max_students} />
                </div>
                <button
                  onClick={() => onRequest(sup)}
                  disabled={!canRequest(sup)}
                  className="mt-3 w-full py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Request Supervision
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupervisorCard({ supervisor: sup, canRequest, onRequest }) {
  const expertise = Array.isArray(sup.expertise) ? sup.expertise : [];
  return (
    <div className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-secondary">{sup.name}</h3>
          <p className="text-sm text-gray-500">{sup.staff_id}</p>
        </div>
        {sup.is_accepting && sup.current_student_count < sup.max_students ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Available</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Full</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {expertise.map((e, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{e}</span>
        ))}
        {expertise.length === 0 && <span className="text-xs text-gray-400">No expertise listed</span>}
      </div>
      <div className="mt-4">
        <QuotaBar current={sup.current_student_count} max={sup.max_students} />
      </div>
      <button
        onClick={onRequest}
        disabled={!canRequest}
        className="mt-4 w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Request Supervision
      </button>
    </div>
  );
}

function DescriptionModal({ current, onClose, onSaved }) {
  const [desc, setDesc] = useState(current || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/users/profile/description', { project_description: desc });
      toast.success('Project description saved.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Describe Your FYP Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Write a short description of your project idea. The AI will use this to find supervisors whose expertise best matches your topic.
        </p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={5}
          placeholder="e.g. I want to develop a machine learning model that detects early signs of diabetes from patient health data using deep learning techniques..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || !desc.trim()}
            className="flex-1 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-light disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Find Matches'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestModal({ supervisor, onClose, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">Request: {supervisor.name}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Proposed FYP Title</label>
            <input {...register('title_proposed')} className="w-full px-4 py-2 rounded-lg border" />
            {errors.title_proposed && <p className="text-red-500 text-sm">{errors.title_proposed.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message (optional)</label>
            <textarea {...register('message')} rows={3} className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-primary text-white">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
