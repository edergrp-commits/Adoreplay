import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import MasterclassPage from './pages/MasterclassPage';
import EntertainmentPage from './pages/EntertainmentPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LessonPage from './pages/LessonPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanel from './pages/AdminPanel';
import CheckoutPage from './pages/CheckoutPage';
import MasterclassDetailPage from './pages/MasterclassDetailPage';
import EntertainmentDetailPage from './pages/EntertainmentDetailPage';
import PricingPage from './pages/PricingPage';
import FreeLessonPage from './pages/FreeLessonPage';
import MyListPage from './pages/MyListPage';
import LibraryPage from './pages/LibraryPage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import { useEffect } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isLoginPage && <Header />}
      <main className="flex-grow">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/masterclass" element={<MasterclassPage />} />
            <Route path="/masterclass/:slug" element={<MasterclassDetailPage />} />
            <Route path="/entertainment" element={<EntertainmentPage />} />
            <Route path="/entertainment/:slug" element={<EntertainmentDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:category" element={<CourseDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lesson/:courseId" element={<LessonPage />} />
            <Route path="/lesson/:courseId/:lessonId" element={<LessonPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/free-lesson" element={<FreeLessonPage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            {/* Fallback to Masterclass for demo purposes */}
            <Route path="*" element={<MasterclassPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
