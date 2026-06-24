import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, FolderDown, Search, FileX, PackageCheck } from 'lucide-react';

const FORM_TITLES = {
  F1: 'F1 – Mutual Acceptance',
  F2: 'F2 – Project Motivation',
  F3: 'F3 – Literature Review',
  F4: 'F4 – Methodology',
  F5: 'F5 – Consultation Log',
  F6: 'F6',
  F7: 'F7 – Proposal Presentation',
  F8: 'F8 – Proposal Report',
  F9: 'F9 – Progress Presentation',
  F10: 'F10 – Final Presentation',
  F11: 'F11 – Final Report',
};

function fileSafe(name) {
  return name.replace(/\s+/g, '_');
}

async function downloadBlob(promise, filename) {
  const response = await promise;
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Flattens a student's hub record into a list of forms. Each entry is selectable
// (per form_type) for the bulk ZIP. Multi-evaluator forms (F7–F11) carry a
// `copies` array so each evaluator's PDF gets its own download button.
function listForms(student) {
  const forms = [
    { formType: 'F1', available: student.f1.available },
    ...Object.keys(student.task_forms || {}).map((ft) => ({ formType: ft, available: student.task_forms[ft].available })),
    { formType: 'F5', available: student.f5.available },
    { formType: 'F6', available: student.f6.available, label: student.f6.variant },
    ...Object.keys(student.eval_forms || {}).map((ft) => ({
      formType: ft,
      available: student.eval_forms[ft].available,
      copies: student.eval_forms[ft].copies || [],
    })),
  ];
  return forms;
}

export default function StudentDocuments() {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [selected, setSelected] = useState({}); // `${studentId}:${formType}` -> true
  const [downloading, setDownloading] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['coordinator-student-documents'],
    queryFn: async () => {
      const { data } = await api.get('/coordinator/student-documents');
      return data.data || [];
    },
  });

  const filtered = students.filter((s) => {
    if (phaseFilter && s.phase !== phaseFilter) return false;
    if (!search) return true;
    return s.name.toLowerCase().includes(search.toLowerCase()) || (s.matric || '').toLowerCase().includes(search.toLowerCase());
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggle = (studentId, formType) => {
    const key = `${studentId}:${formType}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllAvailable = () => {
    const next = {};
    filtered.forEach((s) => {
      listForms(s).forEach(({ formType, available }) => {
        if (available) next[`${s.student_id}:${formType}`] = true;
      });
    });
    setSelected(next);
  };

  const clearSelection = () => setSelected({});

  const downloadSelected = async () => {
    const items = Object.keys(selected)
      .filter((key) => selected[key])
      .map((key) => {
        const [studentId, formType] = key.split(':');
        return { student_id: Number(studentId), form_type: formType };
      });
    if (items.length === 0) return;

    setDownloading(true);
    try {
      const response = await api.post('/coordinator/student-documents/bulk-download', { items }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_documents_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${items.length} form(s) as ZIP.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadOne = async (student, formType) => {
    try {
      if (formType === 'F1') {
        const { data: f1Res } = await api.get(`/documents/student/${student.student_id}/f1`);
        const docId = f1Res.data?.id;
        if (!docId) throw new Error('No document returned');
        await downloadBlob(api.get(`/documents/${docId}/download`, { responseType: 'blob' }), `F1_${fileSafe(student.name)}.pdf`);
      } else if (formType === 'F5') {
        await downloadBlob(
          api.get(`/meetings/coordinator/f5/${student.student_id}/download`, { responseType: 'blob' }),
          `F5_${fileSafe(student.name)}.pdf`
        );
      } else if (formType === 'F6') {
        await downloadBlob(
          api.post(`/f6/student/${student.student_id}/generate`, {}, { responseType: 'blob' }),
          `${student.f6.variant}_${fileSafe(student.name)}.pdf`
        );
      } else if (student.task_forms[formType]) {
        const tf = student.task_forms[formType];
        await downloadBlob(
          api.get(`/tasks/coordinator/${tf.taskId}/evaluations/${student.student_id}/download`, { responseType: 'blob' }),
          `${formType}_${fileSafe(student.name)}.pdf`
        );
      } else {
        // Multi-evaluator form: download each evaluator's copy.
        const copies = student.eval_forms[formType]?.copies || [];
        for (const c of copies) {
          const suffix = copies.length > 1 ? `_${c.role}` : '';
          await downloadBlob(
            api.get(`/evaluation-forms/${c.formId}/download`, { responseType: 'blob' }),
            `${formType}${suffix}_${fileSafe(student.name)}.pdf`
          );
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to download ${formType}.`);
    }
  };

  const downloadCopy = async (student, formType, copy) => {
    try {
      await downloadBlob(
        api.get(`/evaluation-forms/${copy.formId}/download`, { responseType: 'blob' }),
        `${formType}_${copy.role}_${fileSafe(student.name)}.pdf`
      );
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to download ${formType} (${copy.role}).`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Student Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage and download each student's official forms. Check the forms you need and download
          them together as a ZIP, or download a single form directly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or matric number..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border"
          />
        </div>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-white"
        >
          <option value="">All Phases</option>
          <option value="CSP600">CSP600</option>
          <option value="CSP650">CSP650</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl px-4 py-3">
        <button onClick={selectAllAvailable} className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50">
          Select All Available
        </button>
        <button onClick={clearSelection} disabled={selectedCount === 0} className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          Clear Selection
        </button>
        <span className="text-sm text-gray-500">{selectedCount} selected</span>
        <button
          onClick={downloadSelected}
          disabled={selectedCount === 0 || downloading}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck className="w-4 h-4" />
          {downloading ? 'Preparing ZIP...' : `Download Selected (${selectedCount}) as ZIP`}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center text-gray-500">
          <FolderDown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No students found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((student) => (
            <StudentRow
              key={student.student_id}
              student={student}
              selected={selected}
              onToggle={(ft) => toggle(student.student_id, ft)}
              onDownloadOne={(ft) => downloadOne(student, ft)}
              onDownloadCopy={(ft, copy) => downloadCopy(student, ft, copy)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ROLE_LABELS = { supervisor: 'Supervisor', examiner: 'Examiner', coordinator: 'Coordinator' };

function FormCheckbox({ formType, label, available, checked, copies, onToggle, onDownloadOne, onDownloadCopy }) {
  const multipleCopies = (copies?.length || 0) > 1;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        available ? 'border-primary/30 text-primary' : 'border-gray-200 text-gray-400'
      }`}
    >
      <input
        type="checkbox"
        checked={!!checked}
        disabled={!available}
        onChange={onToggle}
        className="w-3.5 h-3.5 accent-primary disabled:cursor-not-allowed"
      />
      <span title={available ? label : `${label} not available yet`}>{label}</span>
      {multipleCopies ? (
        // One download button per evaluator copy (e.g. F10 supervisor + examiner)
        copies.map((c) => (
          <button
            key={c.formId}
            onClick={() => onDownloadCopy(c)}
            title={`Download ${label} — ${ROLE_LABELS[c.role] || c.role}${c.evaluatorName ? ` (${c.evaluatorName})` : ''}`}
            className="ml-1 inline-flex items-center gap-0.5 hover:text-primary-light"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[10px]">{ROLE_LABELS[c.role]?.[0] || '?'}</span>
          </button>
        ))
      ) : (
        <button
          onClick={onDownloadOne}
          disabled={!available}
          title={`Download ${label}`}
          className="ml-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary-light"
        >
          {available ? <Download className="w-3.5 h-3.5" /> : <FileX className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

function StudentRow({ student, selected, onToggle, onDownloadOne, onDownloadCopy }) {
  const phaseColor = student.phase === 'CSP600'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-purple-50 text-purple-700 border-purple-200';

  const forms = listForms(student);

  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-secondary">{student.name}</h3>
          <p className="text-xs text-gray-500">{student.matric} · {student.class_name}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${phaseColor}`}>{student.phase}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {forms.map(({ formType, available, label, copies }) => (
          <FormCheckbox
            key={formType}
            formType={formType}
            label={label || FORM_TITLES[formType] || formType}
            available={available}
            copies={copies}
            checked={selected[`${student.student_id}:${formType}`]}
            onToggle={() => onToggle(formType)}
            onDownloadOne={() => onDownloadOne(formType)}
            onDownloadCopy={(copy) => onDownloadCopy(formType, copy)}
          />
        ))}
      </div>
    </div>
  );
}
