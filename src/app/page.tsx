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
    const checkUsername = async () => {
      if (user) {
        try {
          // Check if user has a username in their metadata
          const hasUsername =
            user.user_metadata?.username || user.user_metadata?.display_name;

          if (!hasUsername) {
            // Check profiles table for username
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();

            if (!profile?.username) {
              setShowUsernameSetup(true);
            }
          }
        } catch (error) {
          console.error('Error checking username:', error);
          // If there's an error, assume they need to set username
          setShowUsernameSetup(true);
        }
        setCheckingUsername(false);
      }
    };

    checkUsername();
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
