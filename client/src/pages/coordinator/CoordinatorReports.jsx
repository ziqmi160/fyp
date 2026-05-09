import api from '../../services/api';

export default function CoordinatorReports() {
  const download = async (type) => {
    try {
      const res = await api.get(`/coordinator/reports/${type}`, { responseType: 'text' });
      const data = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Reports</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => download('cohort_progress')}
          className="bg-card rounded-xl p-6 border text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-secondary">Cohort Progress</h3>
          <p className="text-sm text-gray-500 mt-1">Export student progress summary as CSV</p>
        </button>
        <button
          onClick={() => download('no_supervisor')}
          className="bg-card rounded-xl p-6 border text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-secondary">Students Without Supervisors</h3>
          <p className="text-sm text-gray-500 mt-1">List of students needing assignment</p>
        </button>
        <button
          onClick={() => download('submission_status')}
          className="bg-card rounded-xl p-6 border text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-secondary">Submission Status</h3>
          <p className="text-sm text-gray-500 mt-1">All submissions and their status</p>
        </button>
        <button
          onClick={() => download('marks')}
          className="bg-card rounded-xl p-6 border text-left hover:shadow-md transition"
        >
          <h3 className="font-semibold text-secondary">Student Marks</h3>
          <p className="text-sm text-gray-500 mt-1">Export all evaluation marks</p>
        </button>
      </div>
    </div>
  );
}
