import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (user) => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    // maybeSingle → no 406 when 0 rows
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch:', error.message);
    }

    if (data) {
      setProfile(data);
      return data;
    }

    // Profile missing (trigger delayed / failed) — create it
    const meta = user.user_metadata || {};
    const row = {
      id: user.id,
      full_name: meta.full_name || user.email?.split('@')[0] || 'Student',
      role: 'student',
      registration_number: meta.registration_number || null,
      roll_number: meta.roll_number || null,
    };

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (insertError) {
      console.warn('Profile create:', insertError.message);
      // Still set a minimal local profile so UI works
      setProfile(row);
      return row;
    }

    setProfile(created || row);
    return created || row;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        await ensureProfile(currentSession.user);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await ensureProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = async ({ email, password, metadata = {} }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    // If session exists immediately, ensure profile row
    if (!error && data?.user) {
      await ensureProfile(data.user);
    }

    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data?.user) {
      await ensureProfile(data.user);
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      return ensureProfile(session.user);
    }
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAuthenticated: !!session?.user,
    role: profile?.role ?? null,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
