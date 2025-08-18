-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, display_name, color) VALUES
  ('baking', 'Baking', '#F59E0B'),
  ('desserts', 'Desserts', '#EC4899'),
  ('appetizers', 'Appetizers', '#10B981'),
  ('salad', 'Salad', '#3B82F6'),
  ('main', 'Main', '#EF4444'),
  ('other', 'Other', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Add category_id to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Update existing recipes to have 'other' category
UPDATE recipes SET category_id = (SELECT id FROM categories WHERE name = 'other') WHERE category_id IS NULL;

-- Make category_id required for new recipes
ALTER TABLE recipes ALTER COLUMN category_id SET NOT NULL;
