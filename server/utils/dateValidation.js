// Shared helpers for rejecting past dates on future-facing schedule/deadline fields.

// Returns true if a YYYY-MM-DD date string falls before today (local server date),
// comparing by calendar day so that "today" is always allowed regardless of time.
export const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day < today;
};

// Returns true if a date + optional time combination is strictly in the past.
// When no time is given, any time today is considered valid (delegates to isPastDate).
export const isPastDateTime = (dateStr, timeStr) => {
  if (!dateStr) return false;
  if (!timeStr) return isPastDate(dateStr);
  const dt = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(dt.getTime())) return false;
  return dt < new Date();
};
