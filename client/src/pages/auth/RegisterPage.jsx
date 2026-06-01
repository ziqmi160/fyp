import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import api from '../../services/api';

const studentSchema = z.object({
  role: z.literal('student'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  student_id: z.string().min(1, 'Student ID is required'),
  programme: z.string().min(1, 'Programme is required'),
});

const supervisorSchema = z.object({
  role: z.literal('supervisor'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  staff_id: z.string().min(1, 'Staff ID is required'),
});

const schema = z.discriminatedUnion('role', [studentSchema, supervisorSchema]);

export default function RegisterPage() {
  const { login, roleRoute } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  });

  const role = watch('role');

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    setValue('role', newRole);
  };

  const onSubmit = async (data) => {
    try {
      const { data: res } = await api.post('/auth/register', data);

      if (data.role === 'supervisor') {
        setSubmitted(true);
        return;
      }

      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome.');
      navigate(roleRoute[res.data.user.role]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-2">Registration Submitted</h2>
            <p className="text-gray-600 mb-6">
              Your account is pending coordinator approval. You will be able to log in once your account has been reviewed.
            </p>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-white text-2xl font-bold mb-4">
              FYP
            </div>
            <h1 className="text-2xl font-bold text-secondary">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">FYP Management System</p>
          </div>

          {/* Role selector */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-5">
            {['student', 'supervisor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  role === r ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@uitm.edu.my"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    {...register('student_id')}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. 2021123456"
                  />
                  {errors.student_id && <p className="text-red-500 text-sm mt-1">{errors.student_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                  <input
                    {...register('programme')}
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. CS230"
                  />
                  {errors.programme && <p className="text-red-500 text-sm mt-1">{errors.programme.message}</p>}
                </div>
              </>
            )}

            {role === 'supervisor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                <input
                  {...register('staff_id')}
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. S001"
                />
                {errors.staff_id && <p className="text-red-500 text-sm mt-1">{errors.staff_id.message}</p>}
              </div>
            )}

            {role === 'supervisor' && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Supervisor accounts require coordinator approval before you can log in.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-light disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
