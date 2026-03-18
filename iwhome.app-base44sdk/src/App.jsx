import './App.css'
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { itIT } from "@clerk/localizations";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

import VerticalMenu from './components/dashboard/VerticalMenu';
import AnimatedBackground from './components/dashboard/AnimatedBackground';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const PUBLIC_PAGES = ['Home', 'ChiSiamo', 'Servizi', 'Calcolatore', 'Blog', 'BlogPost', 'Contatti', 'Cookie', 'Privacy', 'Termini', 'qr-access'];

const GlobalLayout = ({ children }) => {
  const location = useLocation();
  // Attempt to derive currentPageName, defaulting to mainPageKey if at root
  const currentPath = location.pathname.split('/')[1];
  const currentPageName = currentPath === '' ? mainPageKey : (Object.keys(Pages).find(k => k.toLowerCase() === currentPath.toLowerCase()) || currentPath);

  const isPrivate = !PUBLIC_PAGES.includes(currentPageName);

  return (
    <>
      {isPrivate && <VerticalMenu />}
      {isPrivate && <AnimatedBackground />}
      {Layout ? (
        <Layout currentPageName={currentPageName}>{children}</Layout>
      ) : (
        <>{children}</>
      )}
    </>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, logout } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'user_blocked') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
          <div className="text-center p-8 bg-[#343a40]/50 backdrop-blur-xl rounded-2xl border border-red-500/30 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f8f9fa] mb-2">Account Bloccato</h1>
            <p className="text-[#dee2e6] mb-4">{authError.message}</p>
            <button
              onClick={() => logout()}
              className="px-6 py-2 bg-[#f8f9fa] text-[#212529] rounded-lg font-medium hover:bg-[#e9ecef] transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <GlobalLayout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<Page />}
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </GlobalLayout>
  );
};


function App() {
  useEffect(() => {
    const el = document.getElementById('initial-loader');
    if (el) el.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={itIT}>
        <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
          <AuthProvider>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
            <Toaster />
            <VisualEditAgent />
          </AuthProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </QueryClientProvider>
  )
}

export default App
