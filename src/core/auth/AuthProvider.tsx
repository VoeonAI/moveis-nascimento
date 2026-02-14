import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  profileError: { code?: string; message?: string; details?: any } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para timeout
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), ms)
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<{ code?: string; message?: string; details?: any } | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false); // Prevenir reentrância

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      // Promise.race com timeout de 2.5s
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        timeout(2500)
      ]) as any;

      // Log diagnóstico detalhado
      console.log('[AuthProvider] profile_fetch_attempt', {
        userId,
        status: error ? 'error' : (data ? 'success' : 'not_found'),
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        hasData: !!data,
      });

      if (error) {
        console.error('[AuthProvider] profile_fetch_error', {
          userId,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Categorizar erro
        let errorCategory: string;
        const statusCode = error.code || (typeof error.status === 'number' ? error.status : null);

        if (statusCode === 401 || statusCode === 403) {
          errorCategory = 'RLS blocked / no permission';
        } else if (statusCode === 400 || statusCode === 422) {
          errorCategory = 'invalid query / column does not exist';
        } else if (error.message?.includes('timeout')) {
          errorCategory = 'request timeout';
        } else {
          errorCategory = 'unknown error';
        }

        setProfileError({
          code: error.code,
          message: error.message,
          details: {
            category: errorCategory,
            userId,
            statusCode,
          },
        });
        
        if (mountedRef.current) setProfile(null);
      } else if (mountedRef.current) {
        if (data) {
          setProfile(data);
          setProfileError(null);
        } else {
          // data null sem error => perfil não existe
          console.warn('[AuthProvider] profile_not_found', { userId });
          setProfileError({
            code: 'PGRST116',
            message: 'Profile not found',
            details: {
              category: 'profile does not exist',
              userId,
            },
          });
          setProfile(null);
        }
      }
    } catch (err: any) {
      if (err?.message === 'timeout') {
        console.error('[AuthProvider] profile_fetch_error', {
          userId,
          code: 'TIMEOUT',
          message: 'Request timeout',
        });
        setProfileError({
          code: 'TIMEOUT',
          message: 'Request timeout',
          details: {
            category: 'request timeout',
            userId,
          },
        });
      } else {
        console.error('[AuthProvider] profile_fetch_error', {
          userId,
          code: err?.code,
          message: err?.message,
        });
        setProfileError({
          code: err?.code || 'UNKNOWN',
          message: err?.message || 'Unknown error',
          details: {
            category: 'unknown error',
            userId,
          },
        });
      }
      if (mountedRef.current) setProfile(null);
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      
      setLoading(true);
      setError(null);

      try {
        // Promise.race com timeout de 4s
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeout(4000)
        ]) as any;

        if (mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err: any) {
        if (err?.message === 'timeout') {
          console.error('[AuthProvider] auth_init_failed', 'timeout');
          if (mountedRef.current) setError('timeout');
        } else {
          console.error('[AuthProvider] auth_init_failed', err?.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        inFlightRef.current = false;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (inFlightRef.current) return;
        
        if (mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setProfileError(null);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, profileLoading, error, profileError, signOut }}>
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