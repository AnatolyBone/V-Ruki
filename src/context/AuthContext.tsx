import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Auth] Fetch profile attempt ${attempt}`);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[Auth] Profile fetch error:', error);

          if (attempt < 3) {
            await sleep(700);
            continue;
          }

          setProfile(null);
          return null;
        }

        if (!data) {
          console.warn('[Auth] Profile not found');
          setProfile(null);
          return null;
        }

        setProfile(data);
        return data;
      } catch (err) {
        console.error('[Auth] Unexpected profile fetch error:', err);

        if (attempt < 3) {
          await sleep(700);
          continue;
        }

        setProfile(null);
        return null;
      }
    }

    setProfile(null);
    return null;
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('[Auth] Init start');
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] Session error:', error);
          if (!mounted) return;

          setUser(null);
          setProfile(null);
          return;
        }

        const session = data.session;

        if (!session?.user) {
          console.log('[Auth] No active session');
          if (!mounted) return;

          setUser(null);
          setProfile(null);
          return;
        }

        console.log('[Auth] Session found:', session.user.id);
        if (!mounted) return;

        setUser(session.user);
        await fetchProfile(session.user.id);
      } catch (err) {
        console.error('[Auth] Init unexpected error:', err);

        if (!mounted) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          console.log('[Auth] Init finished');
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);

      try {
        if (!mounted) return;

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);
        await fetchProfile(session.user.id);
      } catch (err) {
        console.error('[Auth] Auth state change error:', err);

        if (!mounted) return;
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth] Sign out error:', error);
      }

      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
