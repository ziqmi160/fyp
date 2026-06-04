import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import api from '../../services/api';

const EXPERTISE_CATEGORIES = [
  'Machine Learning & Deep Learning',
  'Data Science & Analytics',
  'Artificial Intelligence',
  'Software Engineering',
  'Natural Language Processing',
  'Learning Technology & HCI',
  'Information Systems & Database',
  'Computer Vision & Image Processing',
  'Web & Mobile Development',
  'Cybersecurity & Cryptography',
];

// Student self-registration is disabled; students are registered by the coordinator via CSV import.
// const studentSchema = z.object({
//   role: z.literal('student'),
//   name: z.string().min(2, 'Name is required'),
//   email: z.string().email('Invalid email'),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
//   student_id: z.string().min(1, 'Student ID is required'),
//   programme: z.string().min(1, 'Programme is required'),
// });

const supervisorSchema = z.object({
  role: z.literal('supervisor'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  staff_id: z.string().min(1, 'Staff ID is required'),
});

const schema = supervisorSchema;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'supervisor' },
  });

  const toggleExpertise = (cat) => {
    setSelectedExpertise(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', { ...data, role: 'supervisor', expertise: selectedExpertise });
      setSubmitted(true);
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
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-white text-2xl font-bold mb-4">
              FYP
            </div>
            <h1 className="text-2xl font-bold text-secondary">Supervisor Registration</h1>
            <p className="text-gray-500 text-sm mt-1">FYP Management System</p>
            <p className="text-xs text-gray-400 mt-1">Students are registered by the coordinator</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} value="supervisor" />

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise
                <span className="ml-2 text-xs font-normal text-gray-400">({selectedExpertise.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPERTISE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleExpertise(cat)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      selectedExpertise.includes(cat)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Select all that apply. You can update this later in Settings.</p>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Supervisor accounts require coordinator approval before you can log in.
            </p>

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
