-- Add display_name column to recipes table
-- Run this in your Supabase SQL Editor

-- Add the display_name column
ALTER TABLE recipes ADD COLUMN display_name TEXT;

-- Update existing recipes with a default display name
-- This will extract the username from the user's email
UPDATE recipes
SET display_name = COALESCE(
  (SELECT
    CASE
      WHEN raw_user_meta_data->>'full_name' IS NOT NULL
      THEN raw_user_meta_data->>'full_name'
      ELSE split_part(email, '@', 1)
    END
  FROM auth.users
  WHERE auth.users.id = recipes.user_id),
  'User'
);

-- Make the column NOT NULL after updating existing data
ALTER TABLE recipes ALTER COLUMN display_name SET NOT NULL;

-- Create an index for better performance
CREATE INDEX idx_recipes_display_name ON recipes(display_name);
