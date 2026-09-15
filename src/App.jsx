import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import AgeGate from '@/components/AgeGate';
import PhotoViewerProvider from '@/components/shared/PhotoViewerProvider';

// Eager: layout + platform scaffold. Lazy: all page components for code splitting.
const MobileShell = lazy(() => import('@/components/layout/MobileShell'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const PublicLeaderboard = lazy(() => import('@/pages/PublicLeaderboard'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const AsoScreenshots = lazy(() => import('@/pages/AsoScreenshots'));
const AwardPage = lazy(() => import('@/pages/AwardPage'));
const Rivalry = lazy(() => import('@/pages/Rivalry'));
const Home = lazy(() => import('@/pages/Home'));
const BallUp = lazy(() => import('@/pages/BallUp'));
const Groups = lazy(() => import('@/pages/Groups'));
const Challenges = lazy(() => import('@/pages/Challenges'));
const ChallengeDetail = lazy(() => import('@/pages/ChallengeDetail'));
const Messages = lazy(() => import('@/pages/Messages'));
const Conversation = lazy(() => import('@/pages/Conversation'));
const Profile = lazy(() => import('@/pages/Profile'));
const Friends = lazy(() => import('@/pages/Friends'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const AddFriend = lazy(() => import('@/pages/AddFriend'));
const Explore = lazy(() => import('@/pages/Explore'));

function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, user, checkUserAuth } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // First-time age confirmation: shown once per account until the user confirms 13+.
  if (isAuthenticated && user && !user.age_verified) {
    return <AgeGate onVerified={checkUserAuth} />;
  }

  // Render the main app
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/leaderboard/:sport" element={<PublicLeaderboard />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/aso-screenshots" element={<AsoScreenshots />} />
        <Route path="/award/:awardId" element={<AwardPage />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<MobileShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/rivalry/:rivalryId" element={<Rivalry />} />
            <Route path="/ball-up" element={<BallUp />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:id" element={<ChallengeDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:threadId" element={<Conversation />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/add-friend/:userId" element={<AddFriend />} />
            <Route path="/explore" element={<Explore />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <PhotoViewerProvider>
              <AuthenticatedApp />
            </PhotoViewerProvider>
          </ErrorBoundary>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App