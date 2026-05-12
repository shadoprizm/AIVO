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

const adminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionChecked = false;

    // Set up the auth state listener
    // This Supabase API property name is unrelated to paid-plan subscriptions.
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          // Only update state after initial session check is complete
          // This prevents the listener from setting null before storage is read
          if (initialSessionChecked) {
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
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
      if (mounted) {
        initialSessionChecked = true;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.unsubscribe();
    };
  }, []);

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

  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  const value = {
    user,
    session,
    loading,
    isAdmin,
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
