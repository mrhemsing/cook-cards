-- Mom&apos;s Yums Storage Setup Script
-- Run this in your Supabase SQL Editor to fix storage issues

-- Create storage bucket for recipe images (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for recipe images uploads
CREATE POLICY "Users can upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy for recipe images viewing
CREATE POLICY "Users can view recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');

-- Note: If you get "policy already exists" errors, that's fine - it means they're already set up
