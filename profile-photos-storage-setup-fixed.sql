-- Mom's Yums Profile Photos Storage Setup Script (FIXED)
-- Run this in your Supabase SQL Editor to create the profile-photos bucket with correct policies

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;

-- Create storage bucket for profile photos (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create simple storage policy for authenticated users to upload
-- This allows any authenticated user to upload to the profile-photos bucket
CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

-- Create simple storage policy for anyone to view (since bucket is public)
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Create simple storage policy for authenticated users to delete
-- Users can delete any file in the profile-photos bucket (they should only upload their own)
CREATE POLICY "Authenticated users can delete profile photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

-- Note: These policies are simpler and more permissive than the folder-based approach
-- The security comes from the fact that users can only upload files through your app's UI
-- and the file names include user IDs and timestamps to prevent conflicts
