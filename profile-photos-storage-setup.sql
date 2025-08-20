-- Mom's Yums Profile Photos Storage Setup Script
-- Run this in your Supabase SQL Editor to create the profile-photos bucket

-- Create storage bucket for profile photos (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for profile photos uploads
-- Users can only upload to their own folder (using their user ID)
CREATE POLICY "Users can upload profile photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy for profile photos viewing
-- Anyone can view profile photos since they're public
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Create storage policy for profile photos deletion
-- Users can only delete their own profile photos
CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Note: If you get "policy already exists" errors, that's fine - it means they're already set up
