import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Edit2, Trash2, PenLine, CheckCircle, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const FORM_OPTIONS = [
  { value: 'F3',  label: 'F3 – Literature Review',    group: 'CSP600' },
  { value: 'F4',  label: 'F4 – Methodology',           group: 'CSP600' },
  { value: 'F9',  label: 'F9 – Progress Presentation', group: 'CSP650' },
  { value: 'F13', label: 'F13 – Lean Model Canvas',    group: 'CSP650' },
];

const ALL_FORM_TYPES = ['F3', 'F4', 'F7', 'F8', 'F9', 'F10', 'F11', 'F13'];

const PRESENTATION_TYPES = ['F9'];

function StatusBadge({ status }) {
  if (status === 'submitted') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 font-medium">
      <CheckCircle className="w-3 h-3" /> Submitted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 font-medium">
      <Clock className="w-3 h-3" /> Draft
    </span>
  );
}

export default function CoordinatorEvaluationForms() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'all'
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formType, setFormType] = useState('F3');
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [presentationDate, setPresentationDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [allFormTypeFilter, setAllFormTypeFilter] = useState('');
  const [allStudentFilter, setAllStudentFilter] = useState('');

  const { data: students = [] } = useQuery({
    queryKey: ['coord-eval-students'],
    queryFn: async () => {
      const { data } = await api.get('/evaluation-forms/coordinator/students');
      return data.data || [];
    },
  });

  const { data: myForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['coord-eval-forms', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/evaluation-forms/coordinator/my${params}`);
      return (data.data || []).filter(f => ['F3', 'F4', 'F9', 'F13'].includes(f.form_type));
    },
    enabled: activeTab === 'mine',
  });

  const { data: allForms = [], isLoading: allFormsLoading } = useQuery({
    queryKey: ['coord-eval-forms-all', allFormTypeFilter, allStudentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (allFormTypeFilter) params.set('form_type', allFormTypeFilter);
      if (allStudentFilter) params.set('student_id', allStudentFilter);
      const { data } = await api.get(`/evaluation-forms/coordinator/all?${params}`);
      return data.data || [];
    },
    enabled: activeTab === 'all',
  });

  const { data: rubricTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['rubric-template', formType],
    queryFn: async () => {
      const { data } = await api.get(`/evaluation-forms/templates/${formType}`);
      return data.data;
    },
    enabled: !!formType,
  });

  const visibleCriteria = useMemo(() => rubricTemplate?.criteria || [], [rubricTemplate]);

  const criteriaGroups = useMemo(() => {
    if (!visibleCriteria.length) return [];
    const hasGroups = visibleCriteria.some(c => c.group);
    if (!hasGroups) return [{ name: null, items: visibleCriteria }];
    const map = {};
    for (const c of visibleCriteria) {
      const g = c.group || 'Other';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    }
    return Object.entries(map).map(([name, items]) => ({ name, items }));
  }, [visibleCriteria]);

  const totalScore = useMemo(() => {
    return visibleCriteria.reduce((sum, c) => {
      return sum + c.weight * parseFloat(scores[c.id] ?? 0);
    }, 0);
  }, [visibleCriteria, scores]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingForm) {
        const { data } = await api.put(`/evaluation-forms/${editingForm.id}`, payload);
        return data.data;
      }
      const { data } = await api.post('/evaluation-forms/coordinator', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coord-eval-forms']);
      toast.success('Evaluation saved.');
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Save failed.'),
  });

  const signMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/evaluation-forms/${id}/sign`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['coord-eval-forms']);
      toast.success('Form signed and submitted.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Sign failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/evaluation-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['coord-eval-forms']);
      toast.success('Form deleted.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Delete failed.'),
  });

  function openCreate() {
    setEditingForm(null);
    setSelectedStudentId('');
    setFormType('F3');
    setScores({});
    setComments('');
    setPresentationDate('');
    setShowModal(true);
  }

  function openEdit(form) {
    setEditingForm(form);
    setSelectedStudentId(String(form.student_id));
    setFormType(form.form_type);
    setScores(form.scores || {});
    setComments(form.comments || '');
    setPresentationDate(form.presentation_date || '');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingForm(null);
  }

  function handleFormTypeChange(val) {
    setFormType(val);
    setScores({});
  }

  function handleScoreChange(criterionId, val) {
    setScores(prev => ({ ...prev, [criterionId]: parseFloat(val) || 0 }));
  }

  function handleSave(e) {
    e.preventDefault();
    if (!selectedStudentId) return toast.error('Please select a student.');
    saveMutation.mutate({
      student_id: parseInt(selectedStudentId),
      form_type: formType,
      scores,
      comments,
      ...(PRESENTATION_TYPES.includes(formType) && presentationDate ? { presentation_date: presentationDate } : {}),
    });
  }

  async function handleDownload(id, form) {
    try {
      const response = await api.get(`/evaluation-forms/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.form_type}_${form.student?.name || 'eval'}_${form.evaluator_role || 'coordinator'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-secondary">Evaluation</h2>
          <p className="text-sm text-gray-500 mt-0.5">F3, F4 (CSP600) · F9, F13 (CSP650)</p>
        </div>
        {activeTab === 'mine' && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm"
          >
            <Plus className="w-4 h-4" /> New Evaluation
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Forms
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Submitted Forms
        </button>
      </div>

      {activeTab === 'mine' && (
        <>
          <div className="bg-white rounded-xl p-4 border flex gap-4 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
            </select>
            <span className="text-sm text-gray-500 self-center">{myForms.length} form(s)</span>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            {formsLoading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : myForms.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No evaluation forms yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Phase</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myForms.map(form => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-primary">{form.form_type}</td>
                      <td className="px-4 py-3">{form.student?.name || '—'}</td>
                      <td className="px-4 py-3">{form.phase}</td>
                      <td className="px-4 py-3">
                        {form.total_score != null ? `${parseFloat(form.total_score).toFixed(2)} / ${parseFloat(form.max_score).toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={form.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {form.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEdit(form)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { if (window.confirm('Sign and submit this form?')) signMutation.mutate(form.id); }}
                                className="p-1.5 text-gray-500 hover:text-green-600 rounded hover:bg-green-50"
                                title="Sign & Submit"
                              >
                                <PenLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { if (window.confirm('Delete this draft?')) deleteMutation.mutate(form.id); }}
                                className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {form.status === 'submitted' && (
                            <button
                              onClick={() => handleDownload(form.id, form)}
                              className="p-1.5 text-gray-500 hover:text-primary rounded hover:bg-red-50"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'all' && (
        <>
          <div className="bg-white rounded-xl p-4 border flex gap-4 flex-wrap">
            <select
              value={allFormTypeFilter}
              onChange={e => setAllFormTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">All Form Types</option>
              {ALL_FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={allStudentFilter}
              onChange={e => setAllStudentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">All Students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="text-sm text-gray-500 self-center">{allForms.length} form(s)</span>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            {allFormsLoading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : allForms.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No submitted forms yet for your students.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Evaluator</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Phase</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allForms.map(form => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-primary">{form.form_type}</td>
                      <td className="px-4 py-3">{form.student?.name || '—'}</td>
                      <td className="px-4 py-3">{form.evaluator?.name || '—'}</td>
                      <td className="px-4 py-3 capitalize">{form.evaluator_role}</td>
                      <td className="px-4 py-3">{form.phase}</td>
                      <td className="px-4 py-3">
                        {form.total_score != null ? `${parseFloat(form.total_score).toFixed(2)} / ${parseFloat(form.max_score).toFixed(0)}` : '—'}
                      </td>
                      <td className="px-4 py-3">{form.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDownload(form.id, form)}
                          className="p-1.5 text-gray-500 hover:text-primary rounded hover:bg-red-50"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-lg">
                {editingForm ? 'Edit Evaluation Form' : 'New Evaluation Form'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    required
                    disabled={!!editingForm}
                  >
                    <option value="">— select student —</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.student_id || '—'}) · {s.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
                  <select
                    value={formType}
                    onChange={e => handleFormTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    required
                    disabled={!!editingForm}
                  >
                    <optgroup label="CSP600 – Project Formulation">
                      {FORM_OPTIONS.filter(f => f.group === 'CSP600').map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="CSP650 – Final Project">
                      {FORM_OPTIONS.filter(f => f.group === 'CSP650').map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {PRESENTATION_TYPES.includes(formType) && (
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation Date</label>
                  <input
                    type="date"
                    value={presentationDate}
                    onChange={e => setPresentationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {templateLoading && <p className="text-sm text-gray-400">Loading rubric…</p>}

              {rubricTemplate && !templateLoading && (
                <div>
                  <div className="font-medium text-sm mb-2">{rubricTemplate.name}</div>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 text-white text-xs uppercase">
                          <th className="px-3 py-2 text-center w-8">No.</th>
                          <th className="px-3 py-2 text-left">Criteria</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-center w-12">W</th>
                          <th className="px-3 py-2 text-center w-28">
                            Score ({rubricTemplate.criteria[0]?.score_min}–{rubricTemplate.criteria[0]?.score_max})
                          </th>
                          <th className="px-3 py-2 text-center w-16">W×S</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {criteriaGroups.map(group => (
                          <>
                            {group.name && (
                              <tr key={`grp-${group.name}`} className="bg-gray-100">
                                <td colSpan={6} className="px-3 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                                  {group.name}
                                </td>
                              </tr>
                            )}
                            {group.items.map((c) => {
                              const s = parseFloat(scores[c.id] ?? 0);
                              const ws = (c.weight * s).toFixed(2);
                              const globalIdx = visibleCriteria.indexOf(c);
                              return (
                                <tr key={c.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-center text-gray-500">{globalIdx + 1}</td>
                                  <td className="px-3 py-2 font-medium">{c.name}</td>
                                  <td className="px-3 py-2 text-gray-500 text-xs leading-tight">{c.description}</td>
                                  <td className="px-3 py-2 text-center">{c.weight}</td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="number"
                                      min={c.score_min}
                                      max={c.score_max}
                                      step="1"
                                      value={scores[c.id] ?? ''}
                                      onChange={e => handleScoreChange(c.id, e.target.value)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary"
                                      placeholder={`${c.score_min}–${c.score_max}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center font-medium">{ws}</td>
                                </tr>
                              );
                            })}
                            {group.name && (
                              <tr key={`subtotal-${group.name}`} className="bg-gray-100">
                                <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-bold pr-4">
                                  {group.name} Subtotal
                                </td>
                                <td className="px-3 py-1.5 text-center font-bold text-sm">
                                  {group.items.reduce((sum, c) => sum + c.weight * parseFloat(scores[c.id] ?? 0), 0).toFixed(2)}
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                        <tr className="bg-gray-800 text-white font-bold">
                          <td colSpan={5} className="px-3 py-2 text-right">TOTAL SCORE</td>
                          <td className="px-3 py-2 text-center text-base">{totalScore.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments / Remarks</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Feedback on the student's performance…"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : editingForm ? 'Update' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
