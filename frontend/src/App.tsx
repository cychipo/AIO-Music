import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyCodePage from "./pages/VerifyCodePage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";

// Chỉ dùng cho các route yêu cầu đăng nhập (library, playlist, ...)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes — không cần layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/forgot-password/verify" element={<VerifyCodePage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Public routes — Guest & Logged-in đều truy cập được */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />

        {/* Private routes — chỉ Logged-in mới vào được */}
        <Route
          path="library"
          element={
            <PrivateRoute>
              <LibraryPage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}
