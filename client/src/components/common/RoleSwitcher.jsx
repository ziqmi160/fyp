import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const TABS = [
  { role: 'student', label: 'Student', icon: GraduationCap },
  { role: 'supervisor', label: 'Supervisor', icon: UserCheck },
  { role: 'coordinator', label: 'Coordinator', icon: Users },
];

export default function RoleSwitcher() {
  const { user, switchRole, roleRoute } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  if (!user?.is_multi_role) return null;

  const handleSwitch = async (role) => {
    if (role === user.role || switching) return;
    setSwitching(true);
    try {
      const updatedUser = await switchRole(role);
      navigate(roleRoute[updatedUser.role]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not switch role');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-amber-400 px-4 py-1.5 flex items-center justify-center gap-2">
      <span className="text-[10px] font-semibold text-amber-950 tracking-wide mr-1">TESTING ACCOUNT — VIEW AS:</span>
      <div className="flex gap-1 bg-amber-300/60 rounded-full p-0.5">
        {TABS.map(({ role, label, icon: Icon }) => (
          <button
            key={role}
            onClick={() => handleSwitch(role)}
            disabled={switching}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
              user.role === role
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-amber-900/70 hover:text-amber-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
