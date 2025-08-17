-- Mom&apos;s Yums Simple Storage Setup Script
-- Alternative approach with simpler policies

-- Create storage bucket for recipe images (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recipe images" ON storage.objects;

-- Create simple storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.uid() IS NOT NULL);

-- Create simple storage policy for anyone to view (since bucket is public)
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');
