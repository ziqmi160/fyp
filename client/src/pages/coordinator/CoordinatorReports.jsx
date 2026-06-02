import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CoordinatorReports() {
  const [resPhase, setResPhase] = useState('');

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
      toast.error('Failed to download report');
    }
  };

  const downloadResMarks = async () => {
    try {
      const params = new URLSearchParams({ format: 'res' });
      if (resPhase) params.append('phase', resPhase);
      const res = await api.get(`/marks/export?${params}`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RES_marks_${resPhase || 'all'}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('RES marks exported');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export RES marks');
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
          <p className="text-sm text-gray-500 mt-1">Export all evaluation marks (detailed)</p>
        </button>

        {/* RES Export */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold text-secondary">Export for RES</h3>
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Upload-ready CSV for UiTM's Result Examination System — one row per student with consolidated marks.
          </p>
          <select
            value={resPhase}
            onChange={(e) => setResPhase(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Phases</option>
            <option value="CSP600">CSP600 — Project Formulation</option>
            <option value="CSP650">CSP650 — Project</option>
          </select>
          <button
            onClick={downloadResMarks}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition"
          >
            Download RES CSV
          </button>
        </div>
      </div>
    </div>
  );
}
