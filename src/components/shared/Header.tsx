import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

export default function Header() {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Brain className="w-6 h-6 text-blue-600" />
            <span>AIVO Insights</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link to="/how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link to="/blog" className="text-gray-700 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Login
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>

          <button className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
