
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './features/auth/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import ProtectedRoute from './features/auth/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import AuthPage from './pages/public/AuthPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import VerifyEmailPage from './pages/public/VerifyEmailPage';
import IdeasPage from './pages/public/IdeasPage';

import AppLayout from './components/layout/AppLayout';

import StudentDashboard from './pages/student/Dashboard';
import ProfilePage from './pages/student/ProfilePage';
import ProjectsPage from './pages/student/ProjectsPage';
import ProjectWizard from './pages/student/ProjectWizard';
import ProjectWorkspace from './pages/student/ProjectWorkspace';
import InvitationsPage from './pages/student/InvitationsPage';
import JoinProjectPage from './pages/student/JoinProjectPage';
import SettingsPage from './pages/student/SettingsPage';
import MyTasksPage from './pages/student/MyTasksPage';
import NotificationsPage from './pages/student/NotificationsPage';
import StudentGroupsPage from './pages/student/StudentGroupsPage';
import GroupSubmitPage from './pages/student/GroupSubmitPage';
import MeetingsPage from './pages/faculty/MeetingsPage';

import FacultyLayout from './components/layout/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyProfile from './pages/faculty/FacultyProfile';
import StudentLookup from './pages/faculty/StudentLookup';
import GroupsPage from './pages/faculty/GroupsPage';
import CreateGroupPage from './pages/faculty/CreateGroupPage';
import GroupDetailPage from './pages/faculty/GroupDetailPage';
import ReviewDetailPage from './pages/faculty/ReviewDetailPage';

import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/login"
            element={
              <Navigate
                to="/auth?tab=student-login"
                replace
              />
            }
          />

          <Route
            path="/register"
            element={
              <Navigate
                to="/auth?tab=student-register"
                replace
              />
            }
          />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />

          {/* Student routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<StudentDashboard />}
            />

            <Route
              path="profile"
              element={<ProfilePage />}
            />

            <Route
              path="settings"
              element={<SettingsPage />}
            />

            <Route
              path="ideas"
              element={<IdeasPage />}
            />

            <Route
              path="projects"
              element={<ProjectsPage />}
            />

            <Route
              path="projects/new"
              element={<ProjectWizard />}
            />

            <Route
              path="projects/join"
              element={<JoinProjectPage />}
            />

            <Route
              path="projects/:projectId"
              element={<ProjectWorkspace />}
            />

            <Route
              path="projects/:projectId/setup"
              element={<ProjectWizard />}
            />

            <Route
              path="groups"
              element={<StudentGroupsPage />}
            />

            <Route
              path="groups/:groupId"
              element={<GroupSubmitPage />}
            />

            <Route
              path="tasks"
              element={<MyTasksPage />}
            />

            <Route
              path="invitations"
              element={<InvitationsPage />}
            />

            <Route
              path="notifications"
              element={<NotificationsPage />}
            />
          </Route>

          {/* Faculty routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'faculty',
                  'reviewer',
                  'coordinator',
                  'admin',
                ]}
              >
                <FacultyLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<FacultyDashboard />}
            />

            <Route
              path="student-lookup"
              element={<StudentLookup />}
            />

            <Route
  path="meetings"
  element={<MeetingsPage />}
/>

            <Route
              path="profile"
              element={<FacultyProfile />}
            />

            <Route
              path="groups"
              element={<GroupsPage />}
            />

            <Route
              path="groups/new"
              element={<CreateGroupPage />}
            />

            <Route
              path="groups/:groupId"
              element={<GroupDetailPage />}
            />

            <Route
              path="reviews/:projectId"
              element={<ReviewDetailPage />}
            />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={['coordinator', 'admin']}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Legacy redirect */}
          <Route
            path="/ideas"
            element={<Navigate to="/app/ideas" replace />}
          />

          {/* Unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
