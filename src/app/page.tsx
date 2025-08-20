'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoginPage from '@/components/LoginPage';
import RecipeBook from '@/components/RecipeBook';
import UsernameSetup from '@/components/UsernameSetup';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { user, loading } = useAuth();
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(true);

  useEffect(() => {
    const checkDisplayName = async () => {
      if (user) {
        try {
          // Check if user has a display name in their metadata
          const hasDisplayName =
            user.user_metadata?.display_name || user.user_metadata?.username;

          if (!hasDisplayName) {
            // Check profiles table for display name with timeout
            try {
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
              );
              
              const profilePromise = supabase
                .from('profiles')
                .select('display_name')
                .eq('id', user.id)
                .single();

              const result = await Promise.race([profilePromise, timeoutPromise]);
              const { data: profile } = result;

              if (!profile?.display_name) {
                setShowUsernameSetup(true);
              }
            } catch (profileError) {
              console.warn(
                'Profiles table check failed or timed out:',
                profileError
              );
              // If profiles table check fails, assume they need to set username
              setShowUsernameSetup(true);
            }
          }
        } catch (error) {
          console.error('Error checking display name:', error);
          // If there's an error, assume they need to set username
          setShowUsernameSetup(true);
        } finally {
          // Always set checkingUsername to false, regardless of success or failure
          setCheckingUsername(false);
        }
      } else {
        // No user, stop checking
        setCheckingUsername(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setCheckingUsername(false);
    }, 10000); // 10 second timeout

    checkDisplayName();

    return () => clearTimeout(timeoutId);
  }, [user]);

  if (loading || checkingUsername) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (showUsernameSetup) {
    return <UsernameSetup onComplete={() => setShowUsernameSetup(false)} />;
  }

  return <RecipeBook />;
}
