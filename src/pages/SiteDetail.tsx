import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Play, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Button from '../components/ui/Button';
import ScanDetailsModal from '../components/features/ScanDetailsModal';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { Site, Scan } from '../types/database';

export default function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  const fetchSiteAndScans = useCallback(async () => {
    if (!siteId) {
      setError('Site not found');
      setLoading(false);
      return;
    }

    try {
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .maybeSingle();

      if (siteError) throw siteError;
      if (!siteData) {
        setError('Site not found');
        setLoading(false);
        return;
      }

      setSite(siteData);

      const { data: scansData, error: scansError } = await supabase
        .from('scans')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (scansError) throw scansError;
      setScans(scansData || []);
    } catch (err) {
      console.error('Error fetching site:', err);
      setError('Failed to load site details');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchSiteAndScans();
  }, [fetchSiteAndScans]);

  useEffect(() => {
    const hasProcessingScans = scans.some(
      (scan) => scan.status === 'processing' || scan.status === 'pending'
    );

    if (hasProcessingScans) {
      const interval = setInterval(() => {
        fetchSiteAndScans();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [fetchSiteAndScans, scans]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleRunScan = async () => {
    setScanError('');
    setScanning(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-scan`;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to run scan');
      }

      const newScan = await response.json();
      setScans([newScan, ...scans]);
      await fetchSiteAndScans();
    } catch (err) {
      console.error('Error running scan:', err);
      setScanError(err instanceof Error ? err.message : 'Failed to run scan');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading site details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Site not found'}</p>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const completedScans = scans.filter(
    (scan): scan is Scan & { overall_score: number } =>
      scan.status === 'completed' && scan.overall_score !== null
  );

  return (
    <DashboardLayout>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: site?.name || 'Site Details' },
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {scanError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {scanError}
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{site.name}</h1>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
            >
              {site.url.replace(/^https?:\/\//, '')}
              <ExternalLink className="w-4 h-4" />
            </a>

            {completedScans.slice(0, 5).length > 1 && (
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score Trend (Last 5 Scans)</p>
                  <div className="flex items-center gap-2">
                    {completedScans
                      .slice(0, 5)
                      .reverse()
                      .map((scan, idx) => (
                        <span key={scan.id} className="flex items-center">
                          <span className={`font-semibold ${
                            scan.overall_score >= 80 ? 'text-green-600' :
                            scan.overall_score >= 60 ? 'text-blue-600' :
                            scan.overall_score >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {scan.overall_score}
                          </span>
                          {idx < Math.min(4, completedScans.length - 1) && (
                            <span className="mx-1 text-gray-400">→</span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={handleRunScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Scan
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="text-gray-900 font-medium">{formatDate(site.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Scanned</p>
            <p className="text-gray-900 font-medium">
              {site.last_scanned_at ? formatDate(site.last_scanned_at) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan History</h2>

        {scanning && scans.length === 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-blue-900">Scan in progress</p>
                <p className="text-sm text-blue-700">Analyzing your site for AI visibility...</p>
              </div>
            </div>
          </div>
        )}

        {scans.length === 0 && !scanning ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No scans yet</h3>
            <p className="text-gray-600 mb-4">
              Run your first scan to analyze this site's AI visibility and get an AIVO Score.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.status)}
                        <span className={`text-sm font-medium capitalize ${
                          scan.status === 'completed' ? 'text-green-700' :
                          scan.status === 'failed' ? 'text-red-700' :
                          scan.status === 'processing' ? 'text-blue-700' :
                          'text-yellow-700'
                        }`}>
                          {getStatusText(scan.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{formatDate(scan.created_at)}</p>
                    </td>
                    <td className="py-4 px-4">
                      {scan.overall_score !== null ? (
                        <span className={`inline-flex items-center justify-center w-16 h-8 rounded-lg font-bold ${
                          scan.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                          scan.overall_score >= 60 ? 'bg-blue-100 text-blue-700' :
                          scan.overall_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {scan.overall_score}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {scan.status === 'completed' && scan.analysis_json ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScan(scan)}
                        >
                          Open Details
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedScan && site && (
        <ScanDetailsModal
          scan={selectedScan}
          siteName={site.name}
          siteUrl={site.url}
          onClose={() => setSelectedScan(null)}
        />
      )}
    </DashboardLayout>
  );
}
