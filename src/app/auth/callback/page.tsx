'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          // Redirect to login page after a delay
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (session) {
          setStatus('success');
          // Redirect to main app after successful authentication
          setTimeout(() => router.push('/'), 1000);
        } else {
          // No session found, redirect to login
          setStatus('error');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4">
            {status === 'loading' && (
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Completing Sign In...'}
            {status === 'success' && 'Welcome Back!'}
            {status === 'error' && 'Authentication Error'}
          </h1>

          <p className="text-gray-600">
            {status === 'loading' &&
              'Please wait while we complete your authentication.'}
            {status === 'success' &&
              'Redirecting you to your recipe collection...'}
            {status === 'error' &&
              'Something went wrong. Redirecting to login...'}
          </p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}
