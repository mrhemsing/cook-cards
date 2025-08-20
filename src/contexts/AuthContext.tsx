'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with timeout protection
    const getSession = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 8000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { data: { session } } = result;
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.warn('Session check failed or timed out:', error);
        // On timeout or error, assume no session and stop loading
        setUser(null);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Refresh user data to get latest metadata with timeout
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('User refresh timeout')), 5000)
          );
          
          const userPromise = supabase.auth.getUser();
          const result = await Promise.race([userPromise, timeoutPromise]);
          const { data: { user: refreshedUser } } = result;
          
          setUser(refreshedUser);
        } else {
          setUser(session?.user ?? null);
        }
        setLoading(false);
      } catch (error) {
        console.warn('Auth state change handling failed:', error);
        // On error, use the session data we have and stop loading
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
