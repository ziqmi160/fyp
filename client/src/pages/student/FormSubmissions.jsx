import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FileText, Plus, Download, Eye, X, AlertCircle, CheckCircle } from 'lucide-react';

const F2_SCHEMA = z.object({
  title: z.string().min(1, 'Title required'),
  submission_type: z.literal('F2'),
  project_title: z.string().min(1, 'Project title required'),
  problem_statement: z.string().min(50, 'Problem statement must be at least 50 characters'),
  objectives: z.string().min(50, 'Objectives must be at least 50 characters'),
  scope: z.string().min(30, 'Scope must be at least 30 characters'),
  methodology: z.string().min(50, 'Methodology must be at least 50 characters'),
  expected_outcomes: z.string().min(30, 'Expected outcomes must be at least 30 characters'),
  files: z.any().optional(),
});

const F3_SCHEMA = z.object({
  title: z.string().min(1, 'Title required'),
  submission_type: z.literal('F3'),
  project_title: z.string().min(1, 'Project title required'),
  literature_summary: z.string().min(100, 'Literature summary must be at least 100 characters'),
  key_theories: z.string().min(50, 'Key theories must be at least 50 characters'),
  research_gap: z.string().min(50, 'Research gap must be at least 50 characters'),
  references: z.string().min(30, 'References must be at least 30 characters'),
  files: z.any().optional(),
});

const F4_SCHEMA = z.object({
  title: z.string().min(1, 'Title required'),
  submission_type: z.literal('F4'),
  project_title: z.string().min(1, 'Project title required'),
  design_approach: z.string().min(50, 'Design approach must be at least 50 characters'),
  technical_specifications: z.string().min(50, 'Technical specifications must be at least 50 characters'),
  implementation_plan: z.string().min(50, 'Implementation plan must be at least 50 characters'),
  testing_strategy: z.string().min(30, 'Testing strategy must be at least 30 characters'),
  resources_required: z.string().min(30, 'Resources required must be at least 30 characters'),
  files: z.any().optional(),
});

const FORM_SCHEMAS = {
  F2: F2_SCHEMA,
  F3: F3_SCHEMA,
  F4: F4_SCHEMA,
};

const FORM_DESCRIPTIONS = {
  F2: {
    title: 'Project Motivation Evaluation (F2)',
    description: 'Evaluate the project motivation, problem statement, and initial objectives',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true },
      { name: 'problem_statement', label: 'Problem Statement', type: 'textarea', required: true, rows: 4 },
      { name: 'objectives', label: 'Project Objectives', type: 'textarea', required: true, rows: 3 },
      { name: 'scope', label: 'Project Scope', type: 'textarea', required: true, rows: 3 },
      { name: 'methodology', label: 'Proposed Methodology', type: 'textarea', required: true, rows: 4 },
      { name: 'expected_outcomes', label: 'Expected Outcomes', type: 'textarea', required: true, rows: 3 },
    ]
  },
  F3: {
    title: 'Literature Review Evaluation (F3)',
    description: 'Evaluate the literature review and theoretical framework',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true },
      { name: 'literature_summary', label: 'Literature Review Summary', type: 'textarea', required: true, rows: 5 },
      { name: 'key_theories', label: 'Key Theories and Concepts', type: 'textarea', required: true, rows: 4 },
      { name: 'research_gap', label: 'Identified Research Gap', type: 'textarea', required: true, rows: 3 },
      { name: 'references', label: 'Key References', type: 'textarea', required: true, rows: 3 },
    ]
  },
  F4: {
    title: 'Methodology Evaluation (F4)',
    description: 'Evaluate the proposed methodology and technical approach',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true },
      { name: 'design_approach', label: 'Design Approach', type: 'textarea', required: true, rows: 4 },
      { name: 'technical_specifications', label: 'Technical Specifications', type: 'textarea', required: true, rows: 4 },
      { name: 'implementation_plan', label: 'Implementation Plan', type: 'textarea', required: true, rows: 4 },
      { name: 'testing_strategy', label: 'Testing Strategy', type: 'textarea', required: true, rows: 3 },
      { name: 'resources_required', label: 'Resources Required', type: 'textarea', required: true, rows: 3 },
    ]
  },
};

export default function FormSubmissions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data.data?.profile;
    },
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/my?types=F2,F3,F4');
      return data.data || [];
    },
  });

  const hasSupervisor = !!profile?.current_supervisor_id;
  const currentPhase = profile?.current_phase;

  const createMutation = useMutation({
    mutationFn: (formData) => {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('submission_type', formData.submission_type);
      
      // Add form-specific fields as description
      const formDescription = FORM_DESCRIPTIONS[formData.submission_type];
      let description = '';
      formDescription.fields.forEach(field => {
        if (formData[field.name]) {
          description += `${field.label}:\n${formData[field.name]}\n\n`;
        }
      });
      fd.append('description', description);
      
      (formData.files || []).forEach((f) => fd.append('files', f));
      return api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Form submitted successfully!');
      setShowForm(false);
      setSelectedForm(null);
      qc.invalidateQueries(['form-submissions']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit form'),
  });

  const filteredSubmissions = submissions.filter(s => ['F2', 'F3', 'F4'].includes(s.submission_type));

  if (currentPhase !== 'CSP600') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Evaluation Forms (F2, F3, F4)</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800">
              These forms are only available during the CSP600 (Project Formulation) phase.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Evaluation Forms (F2, F3, F4)</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!hasSupervisor}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Form
        </button>
      </div>

      {!hasSupervisor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          You need an active supervisor to submit evaluation forms.
        </div>
      )}

      {/* Form Selection */}
      {showForm && !selectedForm && (
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Select Form Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(FORM_DESCRIPTIONS).map(([type, config]) => {
              const hasSubmission = filteredSubmissions.some(s => s.submission_type === type);
              return (
                <div
                  key={type}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    hasSubmission 
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                      : 'hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => !hasSubmission && setSelectedForm(type)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{config.title}</h4>
                    {hasSubmission && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Form Submission */}
      {showForm && selectedForm && (
        <FormSubmissionForm
          formType={selectedForm}
          onClose={() => {
            setShowForm(false);
            setSelectedForm(null);
          }}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}

      {/* Existing Submissions */}
      {filteredSubmissions.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl p-8 border">
          <EmptyState 
            icon={FileText} 
            message="No evaluation forms submitted yet" 
            actionLabel="Submit First Form" 
            onAction={() => setShowForm(true)} 
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => setSelected(selected?.id === submission.id ? null : submission)}
              className="bg-card rounded-xl p-4 border cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{submission.title}</h3>
                  <p className="text-sm text-gray-500">
                    {submission.submission_type} • {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={submission.status} />
              </div>
              
              {selected?.id === submission.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Form Content</h4>
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {submission.description}
                    </div>
                  </div>
                  
                  {submission.SubmissionAttachments?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {submission.SubmissionAttachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{attachment.file_name}</span>
                            </div>
                            <a
                              href={`/uploads/${attachment.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded transition"
                              title="Download"
                              download={attachment.file_name}
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {submission.supervisor_feedback && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Supervisor Feedback</p>
                      <p className="text-sm text-blue-800">{submission.supervisor_feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormSubmissionForm({ formType, onClose, onSubmit, loading }) {
  const formConfig = FORM_DESCRIPTIONS[formType];
  const schema = FORM_SCHEMAS[formType];
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: `${formConfig.title} - ${new Date().toLocaleDateString()}`,
      submission_type: formType,
    }
  });

  return (
    <div className="bg-card rounded-xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{formConfig.title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{formConfig.description}</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formConfig.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                {...register(field.name)}
                rows={field.rows || 3}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <input
                {...register(field.name)}
                type="text"
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
            {errors[field.name] && (
              <p className="text-red-500 text-sm mt-1">{errors[field.name].message}</p>
            )}
          </div>
        ))}
        
        <div>
          <label className="block text-sm font-medium mb-1">Supporting Documents (optional)</label>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.zip"
            onChange={(e) => setValue('files', Array.from(e.target.files || []))}
            className="w-full px-4 py-2 rounded-lg border"
          />
          <p className="text-xs text-gray-500 mt-1">
            PDF, DOCX, PPTX, ZIP files - Max 10MB each
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </form>
    </div>
  );
}
