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

const withTimeout = async <T,>(promise: Promise<T>, ms = 5000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('[Auth] Fetch profile');
      console.log('[Auth] profile query started');

      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        5000
      );

      console.log('[Auth] profile query finished');

      if (error) {
        console.error('[Auth] Profile fetch error:', error);
        setProfile(null);
        return null;
      }

      if (data) {
        console.log('[Auth] Profile found');
        setProfile(data);
        return data;
      }

      console.warn('[Auth] Profile not found, creating...');

      const { data: userData, error: userError } = await withTimeout(
        supabase.auth.getUser(),
        5000
      );

      if (userError) {
        console.error('[Auth] Get user error:', userError);
        setProfile(null);
        return null;
      }

      const email = userData.user?.email ?? null;

      const { data: createdProfile, error: createError } = await withTimeout(
        supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            role: 'user',
            is_blocked: false,
          })
          .select('*')
          .single(),
        5000
      );

      if (createError) {
        console.error('[Auth] Profile create error:', createError);
        setProfile(null);
        return null;
      }

      console.log('[Auth] Profile created');
      setProfile(createdProfile);
      return createdProfile;
    } catch (err) {
      console.error('[Auth] Unexpected profile error:', err);
      setProfile(null);
      return null;
    }
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
        const { data, error } = await withTimeout(supabase.auth.getSession(), 5000);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event);

      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      setTimeout(async () => {
        try {
          await fetchProfile(session.user.id);
        } catch (err) {
          console.error('[Auth] Auth state profile fetch error:', err);
          setProfile(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);

      const { error } = await withTimeout(supabase.auth.signOut(), 5000);

      if (error) {
        console.error('[Auth] Sign out error:', error);
      }

      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[Auth] Sign out unexpected error:', err);
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
