import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AppShell from './layouts/AppShell';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SortStudioPage from './pages/SortStudioPage';
import MyScenesPage from './pages/MyScenesPage';
import RawLibraryPage from './pages/RawLibraryPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>

      <Route
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route path="/studio" element={<SortStudioPage />} />
        <Route path="/scenes" element={<MyScenesPage />} />
        <Route path="/library" element={<RawLibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
