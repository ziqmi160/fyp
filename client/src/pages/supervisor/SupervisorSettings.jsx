import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SupervisorSettings() {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

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

  const handleQuota = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0) quotaMutation.mutate(v);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="bg-card rounded-xl p-6 border space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Accepting Students</h3>
            <p className="text-sm text-gray-500">Allow new supervision requests</p>
          </div>
          <button
            onClick={() => availabilityMutation.mutate(!profile?.is_accepting)}
            className={`relative w-12 h-6 rounded-full ${profile?.is_accepting ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${profile?.is_accepting ? 'left-7' : 'left-1'}`} />
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
        <div>
          <label className="block font-medium mb-2">Expertise</label>
          <p className="text-sm text-gray-500">{profile?.expertise || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
