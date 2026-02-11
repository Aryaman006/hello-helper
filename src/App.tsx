import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Live from "./pages/Live";
import MyVideos from "./pages/MyVideos";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet"; // ✅ ADDED
import Login from "./pages/Login";
import VideoPlayer from "./pages/VideoPlayer";
import CategoryPage from "./pages/CategoryPage";
import Subscribe from "./pages/Subscribe";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import BackButtonHandler from "./components/BackButtonHandler";

const queryClient = new QueryClient();

/* ===============================
   Protected Route
=============================== */

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/* ===============================
   App Routes
=============================== */

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl gradient-gold animate-pulse shadow-glow" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Subscription */}
      <Route path="/subscribe" element={<Subscribe />} />

      {/* Main App */}
      <Route
        path="/"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />

      <Route
        path="/browse"
        element={
          <AppLayout>
            <Browse />
          </AppLayout>
        }
      />

      <Route
        path="/live"
        element={
          <AppLayout>
            <Live />
          </AppLayout>
        }
      />

      <Route
        path="/my-videos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MyVideos />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ✅ Wallet (MATCHES WEB FLOW) */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Wallet />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Content */}
      <Route
        path="/category/:id"
        element={
          <AppLayout>
            <CategoryPage />
          </AppLayout>
        }
      />

      <Route path="/video/:id" element={<VideoPlayer />} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/* ===============================
   App Root
=============================== */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BackButtonHandler />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
