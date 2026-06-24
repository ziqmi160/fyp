import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const FORM_LABELS = {
  F2: 'F2 – Project Motivation Evaluation',
  F3: 'F3 – Literature Review Evaluation',
  F4: 'F4 – Methodology Evaluation',
  F7: 'F7 – Project Formulation Presentation',
  F8: 'F8 – Project Formulation Report',
  F9: 'F9 – Progress Presentation',
  F10: 'F10 – Final Presentation',
  F11: 'F11 – Final Project Report',
  F13: 'F13 – Lean Model Canvas',
};

export default function RubricTemplates() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState(null); // { formType, criteria: [...] }
  const [editCriteria, setEditCriteria] = useState([]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['rubric-templates'],
    queryFn: async () => {
      const { data } = await api.get('/evaluation-forms/templates');
      return data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ formType, criteria }) => {
      const { data } = await api.put(`/evaluation-forms/templates/${formType}`, { criteria });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rubric-templates']);
      toast.success('Rubric template updated.');
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Update failed.'),
  });

  function toggleExpand(formType) {
    setExpanded(prev => ({ ...prev, [formType]: !prev[formType] }));
  }

  function startEdit(template) {
    setEditing(template.form_type);
    setEditCriteria(template.criteria.map(c => ({ ...c })));
    setExpanded(prev => ({ ...prev, [template.form_type]: true }));
  }

  function cancelEdit() {
    setEditing(null);
    setEditCriteria([]);
  }

  function updateCriterion(idx, field, value) {
    setEditCriteria(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function saveEdit() {
    updateMutation.mutate({ formType: editing, criteria: editCriteria });
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading rubric templates…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-secondary">Rubric Templates</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage evaluation criteria weights and descriptions. Changes are permanent and affect all future evaluations.
        </p>
      </div>

      {templates.map(template => {
        const isExpanded = expanded[template.form_type];
        const isEditing = editing === template.form_type;

        return (
          <div key={template.form_type} className="bg-white rounded-xl border overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => !isEditing && toggleExpand(template.form_type)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <div>
                  <span className="font-semibold text-sm">{FORM_LABELS[template.form_type] || template.form_type}</span>
                  <span className="ml-3 text-xs text-gray-400">{template.criteria.length} criteria</span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={e => { e.stopPropagation(); startEdit(template); }}
                  className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-red-50"
                  title="Edit rubric"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Expanded content */}
            {(isExpanded || isEditing) && (
              <div className="border-t">
                {!isEditing ? (
                  // View mode
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <th className="px-4 py-2 text-left w-8">No.</th>
                        <th className="px-4 py-2 text-left">Criteria</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-center w-12">W</th>
                        <th className="px-4 py-2 text-center w-24">Score Range</th>
                        <th className="px-4 py-2 text-center w-28">Supervisor Only</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {template.criteria.map((c, i) => (
                        <tr key={c.id} className={c.supervisor_only ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium">{c.name}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{c.description}</td>
                          <td className="px-4 py-2 text-center">{c.weight}</td>
                          <td className="px-4 py-2 text-center">{c.score_min}–{c.score_max}</td>
                          <td className="px-4 py-2 text-center">
                            {c.supervisor_only ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Yes</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // Edit mode
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
                      Editing criteria weights and descriptions. This will permanently update the template used for all new evaluations.
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <th className="px-3 py-2 text-left">Criteria Name</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-center w-20">Weight</th>
                          <th className="px-3 py-2 text-center w-20">Min Score</th>
                          <th className="px-3 py-2 text-center w-20">Max Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {editCriteria.map((c, idx) => (
                          <tr key={c.id} className={c.supervisor_only ? 'bg-amber-50' : ''}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={c.name}
                                onChange={e => updateCriterion(idx, 'name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={c.description}
                                onChange={e => updateCriterion(idx, 'description', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={c.weight}
                                onChange={e => updateCriterion(idx, 'weight', parseFloat(e.target.value) || 0)}
                                min={0}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={c.score_min}
                                onChange={e => updateCriterion(idx, 'score_min', parseFloat(e.target.value) || 0)}
                                min={0}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={c.score_max}
                                onChange={e => updateCriterion(idx, 'score_max', parseFloat(e.target.value) || 0)}
                                min={1}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-primary"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={updateMutation.isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" /> {updateMutation.isLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
