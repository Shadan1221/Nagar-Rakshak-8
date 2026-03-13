import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SplashScreen from "../components/SplashScreen.tsx";
import Dashboard from "../components/Dashboard.tsx";
import ComplaintRegistration from "../components/ComplaintRegistration.tsx";
import ComplaintTracking from "../components/ComplaintTracking.tsx";
import HelplineNumbers from "../components/HelplineNumbers.tsx";
import AdminPortal from "../components/AdminPortal.tsx";
import AdminLogin from "../components/AdminLogin.tsx";
import AuthLogin from "../components/AuthLogin.tsx";
import Signup from "../components/Signup.tsx";


// Pure helper so we can unit-test the back-navigation logic
export const nextScreenAfterBack = (current: string): 'dashboard' | 'splash' => {
  return (['complaint', 'tracking', 'helpline', 'signup', 'login'].includes(current))
    ? 'dashboard'
    : 'splash';
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean>(false);

  const pathToScreen: Record<string, string> = {
    '/': 'splash',
    '/login': 'login',
    '/signup': 'signup',
    '/dashboard': 'dashboard',
    '/register': 'complaint',
    '/track': 'tracking',
    '/helpline': 'helpline',
    '/admin': 'admin',
  };

  const screenToPath: Record<string, string> = {
    splash: '/',
    login: '/login',
    signup: '/signup',
    dashboard: '/dashboard',
    complaint: '/register',
    tracking: '/track',
    helpline: '/helpline',
    admin: '/admin',
  };

  const currentScreen = pathToScreen[location.pathname] || 'splash';
  const trackedComplaintId = new URLSearchParams(location.search).get('complaintId') || '';

  useEffect(() => {
    setIsAdminAuthed(localStorage.getItem('nr_admin_auth') === 'true');
  }, []);

  const handleNavigation = (screen: string) => {
    navigate(screenToPath[screen] || '/');
  };

  const handleBack = () => {
    const nextScreen = nextScreenAfterBack(currentScreen);
    navigate(screenToPath[nextScreen] || '/');
  };

  const handleLoginSuccess = (userRole: string) => {
    // Handle successful login - navigate to dashboard
    navigate('/dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onNavigate={handleNavigation} />;

      case 'login':
        return (
          <AuthLogin 
            onBack={() => navigate('/')} 
            onSuccess={handleLoginSuccess}
            onNavigateToSignup={() => navigate('/signup')}
          />
        );

      case 'signup':
        return <Signup onBack={() => navigate('/')} onNavigate={handleNavigation} />;

      case 'dashboard':
        return <Dashboard onBack={handleBack} onNavigate={handleNavigation} />;

      case 'complaint':
        return <ComplaintRegistration onBack={handleBack} onTrackComplaint={(complaintId) => navigate(complaintId ? `/track?complaintId=${encodeURIComponent(complaintId)}` : '/track')} />;

      case 'tracking':
        return <ComplaintTracking onBack={handleBack} initialComplaintId={trackedComplaintId} />;

      case 'helpline':
        return <HelplineNumbers onBack={handleBack} />;

      case 'admin':
        return isAdminAuthed
          ? <AdminPortal onBack={handleBack} />
          : <AdminLogin onBack={() => navigate('/')} onSuccess={() => { setIsAdminAuthed(true); navigate('/admin'); }} />;

      default:
        return <SplashScreen onNavigate={handleNavigation} />;
    }
  };

  return <div className="min-h-screen">{renderScreen()}</div>;
};

export default Index;

// ------------------------
// Lightweight test cases
// ------------------------
// We run these only in dev to avoid any prod overhead.
// If your bundler doesn't define process.env, this block will be skipped.
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
  // Back navigation should return 'dashboard' from these screens
  console.assert(nextScreenAfterBack('complaint') === 'dashboard', 'Back from complaint should go to dashboard');
  console.assert(nextScreenAfterBack('tracking') === 'dashboard', 'Back from tracking should go to dashboard');
  console.assert(nextScreenAfterBack('helpline') === 'dashboard', 'Back from helpline should go to dashboard');
  console.assert(nextScreenAfterBack('signup') === 'dashboard', 'Back from signup should go to dashboard');
  console.assert(nextScreenAfterBack('login') === 'dashboard', 'Back from login should go to dashboard');

  // Any other/unknown screen should go to splash
  console.assert(nextScreenAfterBack('admin') === 'splash', 'Back from admin should go to splash');
  console.assert(nextScreenAfterBack('unknown') === 'splash', 'Back from unknown should go to splash');
}
