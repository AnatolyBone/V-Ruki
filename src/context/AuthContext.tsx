import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileUserIdRef = useRef<string | null>(null);
  const fetchingUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string, force = false) => {
    if (!force && profileUserIdRef.current === userId) return;
    if (fetchingUserIdRef.current === userId) return;

    fetchingUserIdRef.current = userId;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    fetchingUserIdRef.current = null;

    if (error) {
      console.error('[Auth] profile error:', error);
      return;
    }

    profileUserIdRef.current = userId;
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id, true);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] session error:', error);
        }

        const currentUser = data.session?.user ?? null;

        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          profileUserIdRef.current = null;
        }
      } catch (err) {
        console.error('[Auth] init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        profileUserIdRef.current = null;
        fetchingUserIdRef.current = null;
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
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
