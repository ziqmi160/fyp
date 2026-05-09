import { CheckCircle2, Circle, Clock } from 'lucide-react';

export default function PhaseTracker({ profile, submissions }) {
  const currentPhase = profile?.current_phase || 'CSP600';
  
  // Basic heuristic to check if certain steps are completed based on submissions and profile status
  const hasSupervisor = profile?.fyp_status !== 'no_supervisor' && profile?.fyp_status !== 'pending_approval';
  
  const hasSubmission = (type) => submissions.some(s => s.submission_type === type);
  const isApproved = (type) => submissions.some(s => s.submission_type === type && s.status === 'approved');

  const csp600Steps = [
    { id: 'register', label: 'Register Profile', done: true },
    { id: 'supervisor', label: 'Find Supervisor (F1)', done: hasSupervisor },
    { id: 'proposal', label: 'Submit Proposal (F6a)', done: hasSubmission('proposal') || hasSubmission('F6a') },
    { id: 'proposal_defense', label: 'Proposal Defense', done: isApproved('proposal') || isApproved('F6a') }
  ];

  const csp650Steps = [
    { id: 'lmc', label: 'Submit LMC', done: hasSubmission('LMC') },
    { id: 'progress', label: 'Progress Presentation', done: hasSubmission('progress_report') },
    { id: 'final_report', label: 'Submit FYP Report (F6b)', done: hasSubmission('final') || hasSubmission('F6b') },
    { id: 'final_defense', label: 'Final Presentation & Exhibition', done: isApproved('final') || isApproved('F6b') },
    { id: 'amendments', label: 'Amendments & F12', done: false }
  ];

  const steps = currentPhase === 'CSP600' ? csp600Steps : csp650Steps;

  return (
    <div className="bg-card rounded-xl p-6 border shadow-sm mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-secondary">FYP Progress Timeline</h3>
        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
          {currentPhase} Phase
        </span>
      </div>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
        
        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
          {steps.map((step, index) => {
            const isCurrent = !step.done && (index === 0 || steps[index - 1].done);
            
            return (
              <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 
                  ${step.done ? 'border-green-500 text-green-500' : 
                    isCurrent ? 'border-primary text-primary' : 'border-gray-300 text-gray-300'}`}>
                  {step.done ? <CheckCircle2 className="w-5 h-5" /> : 
                   isCurrent ? <Clock className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <div className="md:text-center">
                  <p className={`text-sm font-medium ${step.done ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
