'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Check } from 'lucide-react';
import Image from 'next/image';

interface UsernameSetupProps {
  onComplete: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      setLoading(false);
      return;
    }

    // Check if username contains only letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    try {
      // Update the user's profile with the username
      const { error } = await supabase.from('profiles').upsert({
        username: username.toLowerCase(),
        display_name: username,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      // Update the user's metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.toLowerCase(),
          display_name: username
        }
      });

      if (updateError) throw updateError;

      onComplete();
    } catch (error: unknown) {
      console.error('Error setting username:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to set username';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/moms_yums_logo.svg"
              alt="Moms Yums Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Mom&apos;s Yums!
          </h1>
          <p className="text-gray-600">
            Let&apos;s set up your profile. Choose a username to get started.
          </p>
        </div>

        {/* Username Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Choose Your Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setError('');
                }}
                required
                minLength={3}
                maxLength={20}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your username"
              />
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>

            {/* Username requirements */}
            <div className="mt-2 text-xs text-gray-500 text-left">
              <p>• 3-20 characters long</p>
              <p>• Letters, numbers, and underscores only</p>
              <p>• This will be your display name</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || username.length < 3}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 shadow-lg">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check className="h-5 w-5" />
            )}
            {loading ? 'Setting Username...' : 'Continue to App'}
          </button>
        </form>
      </div>
    </div>
  );
}
