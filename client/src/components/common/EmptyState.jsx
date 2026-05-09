export default function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mb-4" />}
      <p className="text-gray-500 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-light">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
