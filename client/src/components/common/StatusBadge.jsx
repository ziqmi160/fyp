const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-slate-100 text-slate-800',
  revision_required: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
  no_supervisor: 'bg-slate-100 text-slate-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

export default function StatusBadge({ status }) {
  const s = (status || '').toLowerCase().replace(/\s/g, '_');
  const cls = statusColors[s] || 'bg-gray-100 text-gray-800';
  const label = (status || 'Unknown').replace(/_/g, ' ');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}
