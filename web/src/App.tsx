import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './layouts/AppShell';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MyScenesPage from './pages/MyScenesPage';
import RawLibraryPage from './pages/RawLibraryPage';
import RegisterPage from './pages/RegisterPage';
import SceneDetailPage from './pages/SceneDetailPage';
import SettingsPage from './pages/SettingsPage';
import SortStudioPage from './pages/SortStudioPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/verify-email"
        element={(
          <ProtectedRoute>
            <VerifyEmailPage />
          </ProtectedRoute>
        )}
      />

      <Route
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/studio" element={<SortStudioPage />} />
        <Route path="/scenes" element={<MyScenesPage />} />
        <Route path="/scenes/:id" element={<SceneDetailPage />} />
        <Route path="/library" element={<RawLibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
