import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { SITE } from '../../config/site';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white mb-4">
              <Brain className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold">{SITE.name}</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Optimize your website for AI visibility. Analyze how AI models interpret your content and get actionable recommendations to improve discoverability.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div className="md:text-right">
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><a href={`mailto:${SITE.supportEmail}`} className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-400 space-y-2">
          <p>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p className="text-sm text-gray-500 mt-2">
            Custom Built by{' '}
            <a
              href="https://www.astrawebdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Astra Web Dev
            </a>
            , a division of North Star Holdings.
          </p>
        </div>
      </div>
    </footer>
  );
}
