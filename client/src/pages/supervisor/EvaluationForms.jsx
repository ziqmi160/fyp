import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Edit2, Trash2, FileText, PenLine, CheckCircle, Clock, Download, AlertCircle, FileDown, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMS_BY_PHASE = {
  CSP600: [
    { value: 'F7', label: 'F7 – Proposal Presentation' },
    { value: 'F8', label: 'F8 – Proposal Report' },
  ],
  CSP650: [
    { value: 'F10', label: 'F10 – Final Presentation' },
    { value: 'F11', label: 'F11 – Final Report' },
  ],
};

const PRESENTATION_TYPES = ['F7', 'F9', 'F10'];

// Shows a download link to the student's submitted final report, when one exists.
function FinalReportLink({ studentId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['final-report', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/evaluation-forms/students/${studentId}/final-report`);
      return data.data; // null when no final-report task or no submission
    },
  });

  if (isLoading || !data?.submission) return null;

  const { submission } = data;
  const firstFile = submission.attachments?.[0];

  return (
    <div className="flex items-center gap-2">
      {firstFile ? (
        <a
          href={`/uploads/${firstFile.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#8B0000]/10 text-[#8B0000] hover:bg-[#8B0000]/20 transition"
          title={`${data.task_title}: ${firstFile.file_name}`}
        >
          <FileDown className="w-3.5 h-3.5" />
          Final Report
        </a>
      ) : submission.external_link ? (
        <a
          href={submission.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#8B0000]/10 text-[#8B0000] hover:bg-[#8B0000]/20 transition"
          title={data.task_title}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Final Report
        </a>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'submitted') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 font-medium">
      <CheckCircle className="w-3 h-3" /> Submitted
    </span>
  );
  if (status === 'draft') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 font-medium">
      <Clock className="w-3 h-3" /> Draft
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 font-medium">
      <AlertCircle className="w-3 h-3" /> Not Started
    </span>
  );
}

export default function EvaluationForms() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formType, setFormType] = useState('F8');
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [presentationDate, setPresentationDate] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: evaluableStudents = [] } = useQuery({
    queryKey: ['eval-students'],
    queryFn: async () => {
      const { data } = await api.get('/evaluation-forms/students');
      return data.data || [];
    },
  });

  const { data: myForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['my-eval-forms'],
    queryFn: async () => {
      const { data } = await api.get('/evaluation-forms/my');
      return data.data || [];
    },
  });

  const { data: rubricTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['rubric-template', formType],
    queryFn: async () => {
      const { data } = await api.get(`/evaluation-forms/templates/${formType}`);
      return data.data;
    },
    enabled: !!formType,
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedStudent = useMemo(
    () => evaluableStudents.find(s => String(s.id) === String(selectedStudentId)) || null,
    [evaluableStudents, selectedStudentId]
  );

  const visibleCriteria = useMemo(() => {
    if (!rubricTemplate?.criteria) return [];
    const isSupervisor = !selectedStudent || selectedStudent.role === 'supervisor';
    return rubricTemplate.criteria.filter(c => isSupervisor || !c.supervisor_only);
  }, [rubricTemplate, selectedStudent]);

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
      const s = parseFloat(scores[c.id] ?? 0);
      return sum + c.weight * s;
    }, 0);
  }, [visibleCriteria, scores]);

  // For each evaluable student, compute which forms are available and their status
  const studentFormSlots = useMemo(() => {
    return evaluableStudents.map(student => {
      const availableForms = FORMS_BY_PHASE[student.phase] || [];
      const formStatuses = availableForms.map(f => {
        const existing = myForms.find(
          ef => parseInt(ef.student_id) === parseInt(student.id) && ef.form_type === f.value
        );
        return { ...f, existing, status: existing?.status || 'not_started' };
      });
      return { ...student, formStatuses };
    });
  }, [evaluableStudents, myForms]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingForm) {
        const { data } = await api.put(`/evaluation-forms/${editingForm.id}`, payload);
        return data.data;
      }
      const { data } = await api.post('/evaluation-forms', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-eval-forms']);
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
      queryClient.invalidateQueries(['my-eval-forms']);
      toast.success('Form signed and submitted.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Sign failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/evaluation-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-eval-forms']);
      toast.success('Form deleted.');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Delete failed.'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openFill(studentId, ft) {
    setEditingForm(null);
    setSelectedStudentId(String(studentId));
    setFormType(ft);
    setScores({});
    setComments('');
    setPresentationDate('');
    setIsPreFilled(true);
    setShowModal(true);
  }

  function openEdit(form) {
    setEditingForm(form);
    setSelectedStudentId(String(form.student_id));
    setFormType(form.form_type);
    setScores(form.scores || {});
    setComments(form.comments || '');
    setPresentationDate(form.presentation_date || '');
    setIsPreFilled(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingForm(null);
    setIsPreFilled(false);
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

  async function handleDownload(form) {
    try {
      const response = await api.get(`/evaluation-forms/${form.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.form_type}_${form.student?.name || 'eval'}_${form.evaluator_role}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed.');
    }
  }

  const disableSelectors = isPreFilled || !!editingForm;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary">Evaluation</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Evaluation forms for your supervisees and examinees. Each student's phase determines which forms are required.
        </p>
      </div>

      {formsLoading ? (
        <div className="p-8 text-center text-gray-400">Loading…</div>
      ) : studentFormSlots.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No students assigned to you for evaluation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studentFormSlots.map(student => (
            <div key={`${student.id}-${student.role}`} className="bg-white rounded-xl border overflow-hidden">
              {/* Student header */}
              <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{student.name}</span>
                  {student.student_id && (
                    <span className="text-xs text-gray-500">({student.student_id})</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {student.phase}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FinalReportLink studentId={student.id} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    student.role === 'supervisor'
                      ? 'bg-[#8B0000]/10 text-[#8B0000]'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {student.role}
                  </span>
                </div>
              </div>

              {/* Form rows */}
              <div className="divide-y">
                {student.formStatuses.map(fs => (
                  <div key={fs.value} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-bold text-sm text-[#8B0000] shrink-0">{fs.value}</span>
                      <span className="text-sm text-gray-700 truncate">{fs.label.replace(`${fs.value} – `, '')}</span>
                      <StatusBadge status={fs.status} />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {fs.status === 'not_started' && (
                        <button
                          onClick={() => openFill(student.id, fs.value)}
                          className="px-3 py-1.5 text-xs bg-[#8B0000] text-white rounded-lg hover:bg-[#8B0000]/90 transition font-medium"
                        >
                          Fill Form
                        </button>
                      )}
                      {fs.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEdit(fs.existing)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Sign and submit this form?')) signMutation.mutate(fs.existing.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-green-600 rounded hover:bg-green-50"
                            title="Sign & Submit"
                          >
                            <PenLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this draft?')) deleteMutation.mutate(fs.existing.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {fs.status === 'submitted' && (
                        <button
                          onClick={() => handleDownload(fs.existing)}
                          className="p-1.5 text-gray-500 hover:text-[#8B0000] rounded hover:bg-red-50"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-lg">
                {editingForm ? 'Edit Evaluation Form' : 'Fill Evaluation Form'}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8B0000] disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={disableSelectors}
                  >
                    <option value="">— select student —</option>
                    {evaluableStudents.map(s => (
                      <option key={`${s.id}-${s.role}`} value={s.id}>
                        {s.name} ({s.student_id || '—'}) · {s.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
                  <select
                    value={formType}
                    onChange={e => { setFormType(e.target.value); setScores({}); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8B0000] disabled:bg-gray-50 disabled:text-gray-500"
                    required
                    disabled={disableSelectors}
                  >
                    <optgroup label="CSP600 – Project Formulation">
                      <option value="F7">F7 – Proposal Presentation</option>
                      <option value="F8">F8 – Proposal Report</option>
                    </optgroup>
                    <optgroup label="CSP650 – Final Project">
                      <option value="F10">F10 – Final Presentation</option>
                      <option value="F11">F11 – Final Report</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8B0000]"
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
                                <tr key={c.id} className={c.supervisor_only ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                                  <td className="px-3 py-2 text-center text-gray-500">{globalIdx + 1}</td>
                                  <td className="px-3 py-2 font-medium">
                                    {c.name}
                                    {c.supervisor_only && (
                                      <span className="ml-1 text-xs text-amber-600 font-normal">(supervisor)</span>
                                    )}
                                  </td>
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
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#8B0000]"
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
                                  {group.items.reduce((sum, c) => {
                                    const s = parseFloat(scores[c.id] ?? 0);
                                    return sum + c.weight * s;
                                  }, 0).toFixed(2)}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8B0000] resize-none"
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
                  disabled={saveMutation.isLoading}
                  className="px-4 py-2 text-sm bg-[#8B0000] text-white rounded-lg hover:bg-[#8B0000]/90 transition disabled:opacity-50"
                >
                  {saveMutation.isLoading ? 'Saving…' : editingForm ? 'Update' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
