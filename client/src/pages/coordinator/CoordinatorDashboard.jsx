import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#8B0000', '#1E3A5F', '#F59E0B', '#10B981', '#EF4444'];

export default function CoordinatorDashboard() {
  const { data } = useQuery({
    queryKey: ['coordinator-stats'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/stats');
      return data.data;
    },
  });

  const stats = data || {};
  const weekly = stats.submissionsPerWeek || [];
  const fypDist = Object.entries(stats.fypStatusDist || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Overview</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl p-6 border">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-secondary">{stats.totalStudents || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border">
          <p className="text-sm text-gray-500">Supervisors</p>
          <p className="text-2xl font-bold text-secondary">{stats.totalSupervisors || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border">
          <p className="text-sm text-gray-500">Active Pairs</p>
          <p className="text-2xl font-bold text-secondary">{stats.activePairs || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border">
          <p className="text-sm text-gray-500">Without Supervisor</p>
          <p className="text-2xl font-bold text-amber-600">{stats.noSupervisor || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Submissions per Week (Last 8 weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B0000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">FYP Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fypDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {fypDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
