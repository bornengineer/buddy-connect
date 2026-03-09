import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

function AppRoutes() {
  const { auth } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={auth ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={auth ? <DashboardPage /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
