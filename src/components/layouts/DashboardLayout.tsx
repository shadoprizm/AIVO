import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, Home, BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Brain className="w-6 h-6 text-blue-600" />
              <span>AIVO Insights</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/blog" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                <BookOpen className="w-4 h-4" />
                <span>Blog</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
