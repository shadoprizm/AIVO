import { useState } from 'react';
import { Chrome, Github } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../lib/analytics';

export default function OAuthButtons() {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setLoadingProvider(provider);
    trackEvent(provider === 'google' ? 'oauth_google_started' : 'oauth_github_started');

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : 'Unable to start OAuth sign in.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-center gap-2"
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth('google')}
      >
        <Chrome className="h-5 w-5" />
        {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-center gap-2"
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth('github')}
      >
        <Github className="h-5 w-5" />
        {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
      </Button>

      <p className="text-center text-sm text-gray-500">Free account. No credit card.</p>
    </div>
  );
}
