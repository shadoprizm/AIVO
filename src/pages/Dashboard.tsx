import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Calendar, BarChart3, Sparkles, Trash2, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Site } from '../types/database';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [blogMessage, setBlogMessage] = useState('');
  const [blogError, setBlogError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSites();
    }
  }, [user]);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let formattedUrl = siteUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const { data, error } = await supabase
        .from('sites')
        .insert([
          {
            user_id: user!.id,
            name: siteName,
            url: formattedUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSites((currentSites) => [data, ...currentSites]);
      setSiteName('');
      setSiteUrl('');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add site');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSite = async (site: Site) => {
    if (!user) {
      setError('You must be logged in to delete a site');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${site.name}"? This will permanently delete this site and its saved scan history.`
    );

    if (!confirmed) return;

    setError('');
    setDeletingSiteId(site.id);

    try {
      const { count, error } = await supabase
        .from('sites')
        .delete({ count: 'exact' })
        .eq('id', site.id)
        .eq('user_id', user.id);

      if (error) throw error;
      if (count === 0) {
        throw new Error('You can only delete sites that belong to your account.');
      }

      setSites((currentSites) => currentSites.filter((currentSite) => currentSite.id !== site.id));
    } catch (err) {
      console.error('Error deleting site:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete site');
    } finally {
      setDeletingSiteId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleGenerateBlog = async () => {
    if (!isAdmin) {
      setBlogError('Only administrators can generate blog posts.');
      return;
    }

    setGeneratingBlog(true);
    setBlogMessage('');
    setBlogError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to generate blog posts');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate blog post');
      }

      setBlogMessage(`Successfully generated: "${result.topic}"`);
    } catch (err) {
      setBlogError(err instanceof Error ? err.message : 'Failed to generate blog post');
    } finally {
      setGeneratingBlog(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Sites</h1>
            <p className="text-gray-600 mt-2">Manage saved reports and analyze your websites for AI visibility</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button
                onClick={handleGenerateBlog}
                disabled={generatingBlog}
                variant="outline"
                className="flex items-center gap-2"
              >
                {generatingBlog ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            )}
            {sites.length > 0 && !showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Site
              </Button>
            )}
          </div>
        </div>

        {blogMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {blogMessage}
          </div>
        )}
        {blogError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {blogError}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Site</h2>
            <form onSubmit={handleAddSite} className="space-y-4">
              <Input
                label="Site Name"
                type="text"
                required
                placeholder="My Awesome Website"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
              <Input
                label="Website URL"
                type="text"
                required
                placeholder="example.com or https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Site'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setSiteName('');
                    setSiteUrl('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sites...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200">
          <div className="max-w-lg mx-auto px-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to AIVO Insights</h2>
            <p className="text-lg text-gray-700 mb-6">
              Add your first site or save a public scan report to track how AI models interpret your content.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>AIVO Score (0-100) measuring AI visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Category breakdown across 6 key dimensions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Prioritized recommendations with effort estimates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Track improvements over time with scan history</span>
                </li>
              </ul>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="lg" className="flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Add Your First Site
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="group relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <Link
                to={`/sites/${site.id}`}
                className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`View ${site.name} details`}
              />
              <div className="relative z-10 mb-4 flex items-start justify-between gap-3 pointer-events-none">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {site.name}
                  </h3>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-20 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 break-all pointer-events-auto"
                  >
                    {site.url.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSite(site)}
                  disabled={deletingSiteId === site.id}
                  className="relative z-20 shrink-0 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent pointer-events-auto"
                  aria-label={`Delete ${site.name}`}
                  title="Delete site"
                >
                  {deletingSiteId === site.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="relative z-10 border-t border-gray-100 pt-4 space-y-2 pointer-events-none">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last scan: {formatDate(site.last_scanned_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
