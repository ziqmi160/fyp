import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data;
    },
  });

  const markRead = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  const notifications = data || [];
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-sm text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                >
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
