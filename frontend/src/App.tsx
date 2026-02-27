import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="library" element={<LibraryPage />} />
      </Route>
    </Routes>
  );
}
