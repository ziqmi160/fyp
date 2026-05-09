import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import StudentLayout from './components/layout/StudentLayout';
import SupervisorLayout from './components/layout/SupervisorLayout';
import CoordinatorLayout from './components/layout/CoordinatorLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import SupervisorMarketplace from './pages/student/SupervisorMarketplace';
import MySupervisor from './pages/student/MySupervisor';
import StudentSubmissions from './pages/student/StudentSubmissions';
import StudentMeetings from './pages/student/StudentMeetings';
import StudentProgress from './pages/student/StudentProgress';
import FormSubmissions from './pages/student/FormSubmissions';
import StudentPresentations from './pages/student/StudentPresentations';
import StudentAmendments from './pages/student/StudentAmendments';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import SupervisionRequests from './pages/supervisor/SupervisionRequests';
import MyStudents from './pages/supervisor/MyStudents';
import SupervisorSubmissions from './pages/supervisor/SupervisorSubmissions';
import SupervisorMeetings from './pages/supervisor/SupervisorMeetings';
import SupervisorSettings from './pages/supervisor/SupervisorSettings';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorStudents from './pages/coordinator/CoordinatorStudents';
import CoordinatorSupervisors from './pages/coordinator/CoordinatorSupervisors';
import CoordinatorReports from './pages/coordinator/CoordinatorReports';
import CoordinatorSchedules from './pages/coordinator/CoordinatorSchedules';
import PhaseManagement from './pages/coordinator/PhaseManagement';
import ExaminerAssignment from './pages/coordinator/ExaminerAssignment';
import PresentationSessions from './pages/coordinator/PresentationSessions';
import EvaluationForms from './pages/supervisor/EvaluationForms';
import AmendmentManagement from './pages/supervisor/AmendmentManagement';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, roleRoute } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={roleRoute[user.role]} replace />;
  return children;
}

export default function App() {
  const { user, loading, roleRoute } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={roleRoute[user.role]} replace /> : <LoginPage />} />
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="supervisors" element={<SupervisorMarketplace />} />
        <Route path="supervisor" element={<MySupervisor />} />
        <Route path="submissions" element={<StudentSubmissions />} />
        <Route path="meetings" element={<StudentMeetings />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="forms" element={<FormSubmissions />} />
        <Route path="presentations" element={<StudentPresentations />} />
        <Route path="amendments" element={<StudentAmendments />} />
      </Route>
      <Route path="/supervisor" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="requests" element={<SupervisionRequests />} />
        <Route path="students" element={<MyStudents />} />
        <Route path="submissions" element={<SupervisorSubmissions />} />
        <Route path="meetings" element={<SupervisorMeetings />} />
        <Route path="evaluation-forms" element={<EvaluationForms />} />
        <Route path="amendments" element={<AmendmentManagement />} />
        <Route path="settings" element={<SupervisorSettings />} />
      </Route>
      <Route path="/coordinator" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CoordinatorDashboard />} />
        <Route path="students" element={<CoordinatorStudents />} />
        <Route path="supervisors" element={<CoordinatorSupervisors />} />
        <Route path="schedules" element={<CoordinatorSchedules />} />
        <Route path="reports" element={<CoordinatorReports />} />
        <Route path="phases" element={<PhaseManagement />} />
        <Route path="examiner-assignments" element={<ExaminerAssignment />} />
        <Route path="presentation-sessions" element={<PresentationSessions />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? roleRoute[user.role] : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
