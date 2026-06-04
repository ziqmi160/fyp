import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EXPERTISE_CATEGORIES = [
  'Machine Learning & Deep Learning',
  'Data Science & Analytics',
  'Artificial Intelligence',
  'Software Engineering',
  'Natural Language Processing',
  'Learning Technology & HCI',
  'Information Systems & Database',
  'Computer Vision & Image Processing',
  'Web & Mobile Development',
  'Cybersecurity & Cryptography',
];

export default function SupervisorSettings() {
  const qc = useQueryClient();
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [expertiseDirty, setExpertiseDirty] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  useEffect(() => {
    if (profile?.expertise) {
      const arr = Array.isArray(profile.expertise) ? profile.expertise : [];
      setSelectedExpertise(arr);
    }
  }, [profile?.expertise]);

  const availabilityMutation = useMutation({
    mutationFn: (is_accepting) => api.put('/supervisors/availability', { is_accepting }),
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries(['user-profile']);
    },
  });

  const quotaMutation = useMutation({
    mutationFn: (max_students) => api.put('/supervisors/quota', { max_students }),
    onSuccess: () => {
      toast.success('Quota updated');
      qc.invalidateQueries(['user-profile']);
    },
  });

  const expertiseMutation = useMutation({
    mutationFn: (expertise) => api.put('/supervisors/expertise', { expertise }),
    onSuccess: () => {
      toast.success('Expertise updated. AI matching index refreshed.');
      setExpertiseDirty(false);
      qc.invalidateQueries(['user-profile']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update expertise'),
  });

  const handleQuota = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0) quotaMutation.mutate(v);
  };

  const toggleCategory = (cat) => {
    setExpertiseDirty(true);
    setSelectedExpertise(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="bg-card rounded-xl p-6 border space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Accepting Students</h3>
            <p className="text-sm text-gray-500">Allow new supervision requests</p>
          </div>
          <button
            onClick={() => availabilityMutation.mutate(!profile?.is_accepting)}
            className={`relative w-12 h-6 rounded-full transition-colors ${profile?.is_accepting ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile?.is_accepting ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div>
          <label className="block font-medium mb-2">Max Students</label>
          <input
            type="number"
            min="0"
            defaultValue={profile?.max_students || 5}
            onBlur={handleQuota}
            className="w-24 px-4 py-2 rounded-lg border"
          />
        </div>
      </div>

      {/* Expertise multi-select */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-medium">Research Expertise</h3>
            <p className="text-sm text-gray-500 mt-0.5">Select all areas that match your research background. This is used for AI-based student matching.</p>
          </div>
          {expertiseDirty && (
            <button
              onClick={() => expertiseMutation.mutate(selectedExpertise)}
              disabled={expertiseMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-50 flex-shrink-0 ml-4"
            >
              <Save className="w-4 h-4" />
              {expertiseMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXPERTISE_CATEGORIES.map((cat) => {
            const selected = selectedExpertise.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {selectedExpertise.length === 0 && (
          <p className="text-sm text-amber-600 mt-3">Select at least one area so students can find you through AI matching.</p>
        )}
        {selectedExpertise.length > 0 && !expertiseDirty && (
          <p className="text-xs text-gray-400 mt-3">{selectedExpertise.length} area{selectedExpertise.length !== 1 ? 's' : ''} selected. Click any to change, then save.</p>
        )}
      </div>
    </div>
  );
}
