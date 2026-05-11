import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SiteDetail from './pages/SiteDetail';
import AdminPanel from './pages/AdminPanel';
import AdminBlog from './pages/AdminBlog';
import PublicReport from './pages/PublicReport';
import {
  AICitationChecker,
  AICrawlerRobotsTxtChecker,
  ChatGPTSEOChecker,
  FreeAIVisibilityChecker,
  GeoAuditChecklist,
  LlmsTxtChecker,
} from './pages/GeoLandingPages';
import SampleAudits from './pages/SampleAudits';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { trackPageView } from './lib/analytics';

function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AnalyticsRouteTracker />
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/report/:token" element={<PublicReport />} />
        <Route path="/free-ai-visibility-checker" element={<FreeAIVisibilityChecker />} />
        <Route path="/chatgpt-seo-checker" element={<ChatGPTSEOChecker />} />
        <Route path="/ai-citation-checker" element={<AICitationChecker />} />
        <Route path="/llms-txt-checker" element={<LlmsTxtChecker />} />
        <Route path="/ai-crawler-robots-txt-checker" element={<AICrawlerRobotsTxtChecker />} />
        <Route path="/geo-audit-checklist" element={<GeoAuditChecklist />} />
        <Route path="/sample-audits" element={<SampleAudits />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites/:siteId"
          element={
            <ProtectedRoute>
              <SiteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBlog />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
