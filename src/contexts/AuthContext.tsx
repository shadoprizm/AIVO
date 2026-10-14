import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { clearPostAuthRedirect, getPostAuthRedirectUrl } from '../lib/authRedirect';

interface AuthResult {
  user: User | null;
  session: Session | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<{ userId: string; allowed: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    // Set up the auth state listener
    // This Supabase API property name is unrelated to paid-plan subscriptions.
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authEventReceived = true;
        applySession(session);
        if (event === 'SIGNED_IN') {
          const provider = session?.user.app_metadata.provider;
          if (provider === 'google' || provider === 'github') {
            trackEvent(provider === 'google' ? 'oauth_google_completed' : 'oauth_github_completed');
            clearPostAuthRedirect();
          }
        }
      }
    );

    // Get the initial session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      // A newer auth event takes precedence over this initial storage read.
      if (!authEventReceived) applySession(session);
    }).catch((error) => {
      console.error('Unable to restore session', error);
      if (!authEventReceived) applySession(null);
    });

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;
    setAdminAccess(null);
    if (!userId) return;

    // Run outside onAuthStateChange so database requests cannot hold the auth lock.
    void checkIsAdmin(userId).then((allowed) => {
      if (!cancelled) setAdminAccess({ userId, allowed });
    }).catch((error) => {
      console.error('Unable to check administrator access', error);
      if (!cancelled) setAdminAccess({ userId, allowed: false });
    });

    return () => { cancelled = true; };
  }, [userId]);

  const signup = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getPostAuthRedirectUrl() },
    });

    if (error) throw error;
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: getPostAuthRedirectUrl() },
    });

    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    // A signed-in user is not ready for route checks until their own lookup finishes.
    loading: loading || Boolean(userId && adminAccess?.userId !== userId),
    isAdmin: Boolean(userId && adminAccess?.userId === userId && adminAccess.allowed),
    signup,
    login,
    signInWithGoogle,
    signInWithGithub,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The auth hook intentionally lives beside its provider so consumers share one context instance.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
