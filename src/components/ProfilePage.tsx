'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Mail, Edit2, Check, X, Camera, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProfilePhoto from './ProfilePhoto';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(
        user.user_metadata?.display_name || user.user_metadata?.username || ''
      );
      setProfilePhoto(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  const handleUpdateDisplayName = async () => {
    if (!username.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (username.length < 2) {
      setError('Display name must be at least 2 characters long');
      return;
    }

    if (username.length > 30) {
      setError('Display name must be 30 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(username)) {
      setError('Display name can only contain letters, numbers, and spaces');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First try to update the user's metadata (this always works)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.toLowerCase().replace(/\s+/g, '_'),
          display_name: username
        }
      });

      if (updateError) throw updateError;

      // Try to update the profiles table if it exists
      if (user?.id) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: username.toLowerCase().replace(/\s+/g, '_'),
              display_name: username,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.warn(
              'Profiles table update failed, but user metadata was updated:',
              profileError
            );
          }
        } catch (profileError) {
          console.warn(
            'Profiles table does not exist or is not accessible:',
            profileError
          );
          // This is okay - the user metadata was already updated
        }
      }

      setSuccess('Display name updated successfully!');
      setIsEditing(false);
    } catch (error: unknown) {
      console.error('Error updating display name:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update display name';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(
      user?.user_metadata?.display_name || user?.user_metadata?.username || ''
    );
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setProfilePhoto(publicUrl);
      setSuccess('Profile photo updated successfully!');
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      setError(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !profilePhoto) return;

    setUploadingPhoto(true);
    setError('');

    try {
      // Update user metadata to remove avatar_url
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      if (updateError) throw updateError;

      setProfilePhoto(null);
      setSuccess('Profile photo removed successfully!');
    } catch (error: unknown) {
      console.error('Error removing photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove photo';
      setError(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors" />
              </Link>
              <Image
                src="/moms_yums_logo.svg"
                alt="Moms Yums Logo"
                width={32}
                height={32}
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-xl font-bold text-[#C76572] font-calistoga">
                MOM&apos;S YUMS
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                     {/* Profile Header */}
           <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-white">
             <div className="flex items-center space-x-4">
               <div className="relative">
                 <ProfilePhoto 
                   src={profilePhoto} 
                   size="xl" 
                   className="bg-white bg-opacity-20"
                 />
                 
                 {/* Photo upload controls */}
                 <div className="absolute -bottom-2 -right-2 flex space-x-1">
                   <label className="cursor-pointer bg-green-500 hover:bg-green-600 p-1 rounded-full transition-colors">
                     <Camera className="h-3 w-3 text-white" />
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handlePhotoUpload}
                       className="hidden"
                       disabled={uploadingPhoto}
                     />
                   </label>
                   {profilePhoto && (
                     <button
                       onClick={handleRemovePhoto}
                       disabled={uploadingPhoto}
                       className="bg-red-500 hover:bg-red-600 p-1 rounded-full transition-colors disabled:opacity-50"
                     >
                       <Trash2 className="h-3 w-3 text-white" />
                     </button>
                   )}
                 </div>
                 
                 {uploadingPhoto && (
                   <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   </div>
                 )}
               </div>
               <div>
                 <h1 className="text-3xl font-bold">{username || 'User'}</h1>
                 <p className="text-orange-100">Profile Settings</p>
               </div>
             </div>
           </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Display Name</p>
                    {isEditing ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter display name"
                        />
                        <button
                          onClick={handleUpdateDisplayName}
                          disabled={loading}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-gray-900">{username || 'Not set'}</p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-center">
                  Back to Recipe Collection
                </Link>
                <button
                  onClick={signOut}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
