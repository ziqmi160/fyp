import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Award, Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function CoordinatorMarks() {
  const [filterClass, setFilterClass] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [expanded, setExpanded] = useState(null);

  const { data: classes = [] } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/classes');
      return data.data || [];
    },
  });

  const { data: marks = [], isLoading } = useQuery({
    queryKey: ['coordinator-marks', filterClass, filterPhase],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterClass) params.set('class_id', filterClass);
      if (filterPhase) params.set('phase', filterPhase);
      const { data } = await api.get(`/marks/coordinator?${params}`);
      return data.data || [];
    },
  });

  const evaluated = useMemo(() => marks.filter(m => m.forms.length > 0), [marks]);

  const exportCsv = () => {
    const header = 'Matric,Name,Programme,Class,Phase,Form,Form Name,Evaluator Role,Evaluator,Score,Max,Percentage\n';
    const rows = [];
    for (const m of marks) {
      if (m.forms.length === 0) {
        rows.push(`${m.matric},"${m.name}","${m.programme}",${m.class_name},${m.phase},,,,,,,`);
      }
      for (const f of m.forms) {
        rows.push(
          `${m.matric},"${m.name}","${m.programme}",${m.class_name},${m.phase},${f.form_type},"${f.form_name || ''}",${f.evaluator_role},"${f.evaluator_name}",${f.total_score},${f.max_score},${f.percentage ?? ''}`
        );
      }
    }
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_marks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Student Marks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Consolidated evaluation marks for students in your classes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phase})</option>
            ))}
          </select>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All phases</option>
            <option value="CSP600">CSP600</option>
            <option value="CSP650">CSP650</option>
          </select>
          <button
            onClick={exportCsv}
            disabled={marks.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : marks.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No students found</p>
          <p className="text-sm mt-1">Marks appear here once students are in your classes and evaluations are submitted.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Class</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Phase</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Forms</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Overall</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <MarkRow
                  key={m.student_id}
                  mark={m}
                  isExpanded={expanded === m.student_id}
                  onToggle={() => setExpanded(prev => prev === m.student_id ? null : m.student_id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {marks.length > 0 && (
        <p className="text-xs text-gray-400">
          {evaluated.length} of {marks.length} student{marks.length !== 1 ? 's' : ''} have submitted evaluations.
        </p>
      )}
    </div>
  );
}

function MarkRow({ mark: m, isExpanded, onToggle }) {
  const hasForms = m.forms.length > 0;
  return (
    <>
      <tr className="border-t hover:bg-gray-50">
        <td className="p-4">
          <div className="font-medium">{m.name}</div>
          <div className="text-xs text-gray-500">{m.matric}{m.programme ? ` • ${m.programme}` : ''}</div>
        </td>
        <td className="p-4 text-sm">{m.class_name}</td>
        <td className="p-4">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
            m.phase === 'CSP600' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>{m.phase}</span>
        </td>
        <td className="p-4 text-sm text-gray-600">{m.forms.length}</td>
        <td className="p-4">
          {m.percentage != null ? (
            <span className="font-semibold">{m.percentage}%</span>
          ) : (
            <span className="text-xs text-gray-400">No marks yet</span>
          )}
        </td>
        <td className="p-4 text-right">
          {hasForms && (
            <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </td>
      </tr>
      {isExpanded && hasForms && (
        <tr className="border-t bg-gray-50">
          <td colSpan={6} className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left pb-2">Form</th>
                  <th className="text-left pb-2">Evaluator</th>
                  <th className="text-left pb-2">Role</th>
                  <th className="text-left pb-2">Score</th>
                  <th className="text-left pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {m.forms.map((f) => (
                  <tr key={f.id} className="border-t border-gray-200">
                    <td className="py-1.5 font-medium">
                      {f.form_type}
                      {f.form_name && <span className="text-gray-500 font-normal"> — {f.form_name}</span>}
                    </td>
                    <td className="py-1.5">{f.evaluator_name || '—'}</td>
                    <td className="py-1.5 capitalize">{f.evaluator_role}</td>
                    <td className="py-1.5">{f.total_score} / {f.max_score}</td>
                    <td className="py-1.5">{f.percentage != null ? `${f.percentage}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
