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
            // Check profiles table for display name
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', user.id)
                .single();

              if (!profile?.display_name) {
                setShowUsernameSetup(true);
              }
            } catch (profileError) {
              console.error('Error checking profiles table:', profileError);
              // If profiles table doesn't exist or query fails, show display name setup
              setShowUsernameSetup(true);
            }
          }
        } catch (error) {
          console.error('Error checking display name:', error);
          // If there's an error, assume they need to set username
          setShowUsernameSetup(true);
        }
        setCheckingUsername(false);
      } else {
        // No user, stop checking
        setCheckingUsername(false);
      }
    };

    checkDisplayName();
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
