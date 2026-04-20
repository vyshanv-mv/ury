import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';


import Footer from './components/Footer';
import Header from './components/Header';
import Orders from './pages/Orders';
import POS from './pages/POS';
import Table from './pages/Table';
import AuthGuard from './components/AuthGuard';
import POSOpeningProvider from './components/POSOpeningProvider';
import ScreenSizeProvider from './components/ScreenSizeProvider';
import { ToastProvider } from './components/ui/toast';
import { usePOSStore } from './store/pos-store';
import { useEffect } from 'react';
import { getActiveLanguage } from './i18n';
import OnboardingFlow from './pages/Onboarding/OnboardingFlow';
import InitialLoader from './components/InitialLoader';

const MainLayout = () => (
  <div className="flex flex-col h-screen bg-gray-100 font-inter">
    <Header />
    <div className="flex-1 overflow-hidden">
      <Outlet />
    </div>
    <Footer />
  </div>
);

function App() {
  const {
    initializeApp,
    needsOnboarding
  } = usePOSStore();

  // Detect if we are on a POS-related route
  const isPosRoute = window.location.pathname.startsWith('/pos');
  const isRootPath = window.location.pathname === '/' || window.location.pathname === '';

  // Redirect root to /pos/ to ensure the Router's basename matches the URL
  if (isRootPath) {
    window.location.replace('/pos/');
    return null;
  }

  useEffect(() => {
    // Only initialize if we are actually in the POS app scope
    if (isPosRoute) {
      initializeApp();
    }
  }, [initializeApp, isPosRoute]);

  useEffect(() => {
    const lang = getActiveLanguage();
    const isRtl = ['ar', 'he', 'fa', 'ur', 'ku'].includes(lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang || 'en';
  }, []);

  // Return null immediately for non-POS routes to prevent Desk interference
  if (!isPosRoute) {
    return null;
  }

  // Handle loading state only for POS routes
  if (needsOnboarding === null) {
    return <InitialLoader />;
  }

  return (

    <>
      <ToastProvider />
      <ScreenSizeProvider>
        <Router basename="/pos">
          <Routes>
            {/* Public Setup Route - Guarded by status */}
            <Route 
              path="/setup" 
              element={needsOnboarding ? <OnboardingFlow /> : <Navigate to="/" replace />} 
            />
            
            {/* Root Route - Handles redirection to setup if needed */}
            <Route path="/" element={
              needsOnboarding ? <Navigate to="/setup" replace /> : (
                <AuthGuard>
                  <POSOpeningProvider>
                    <MainLayout />
                  </POSOpeningProvider>
                </AuthGuard>
              )
            }>
              <Route index element={<POS />} />
              <Route path="orders" element={<Orders />} />
              <Route path="table" element={<Table />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={needsOnboarding ? "/setup" : "/"} replace />} />
          </Routes>
        </Router>
      </ScreenSizeProvider>
    </>
  );
}

export default App;
