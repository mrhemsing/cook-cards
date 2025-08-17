# 🍳 Taste Legacy - Recipes Preserved for Generations

A simple and intuitive Next.js web application that lets you scan handwritten recipe cards and organize them into your own digital recipe book. Perfect for preserving family recipes and organizing your cooking collection!

## ✨ Features

- **📱 Camera Scanning**: Use your device's camera to scan handwritten recipe cards
- **🔐 Simple Authentication**: Login with Google (no passwords to remember!)
- **📚 Digital Recipe Book**: Organize and search through all your recipes
- **🖼️ Image Storage**: Store recipe images securely in the cloud
- **✏️ Manual Entry**: Add recipes manually if you prefer typing
- **🔍 Smart Search**: Find recipes by title or ingredients
- **📱 Mobile Friendly**: Works perfectly on phones, tablets, and computers
- **🎨 Beautiful UI**: Clean, modern design that's easy to use

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great!)
- Google developer account (for authentication)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd taste-legacy
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to **Settings > API**
3. Copy your **Project URL** and **anon public key**

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

In your Supabase dashboard, go to **SQL Editor** and run this SQL:

```sql
-- Create recipes table
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own recipes
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own recipes
CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own recipes
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own recipes
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);

-- Create storage policy for recipe images
CREATE POLICY "Users can upload recipe images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view recipe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-images');
```

### 5. Configure Authentication

1. In Supabase, go to **Authentication > Providers**
2. Enable **Google** provider
3. Add your OAuth credentials from Google Cloud Console

#### Google OAuth Setup:

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 6. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 📱 How to Use

### First Time Setup

1. Open the app in your browser
2. Click "Continue with Google"
3. Grant camera permissions when prompted
4. You're ready to start scanning!

### Scanning Recipe Cards

1. Click the **"Scan Recipe Card"** button
2. Position your handwritten recipe card in the camera frame
3. Click **"Capture Image"** when ready
4. Fill in the recipe details:
   - Recipe title
   - Ingredients list
   - Cooking instructions
5. Click **"Save Recipe"** to add it to your collection

### Adding Recipes Manually

1. Click **"Add Recipe Manually"**
2. Fill in all the recipe details
3. Optionally upload an image
4. Click **"Save Recipe"**

### Managing Your Recipes

- **View**: Click the "View" button to see full recipe details
- **Edit**: Click the edit icon to modify recipe information
- **Delete**: Click the trash icon to remove recipes
- **Search**: Use the search bar to find specific recipes

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Camera**: react-webcam
- **Icons**: Lucide React

## 🔧 Customization

### Changing Colors

The app uses a warm orange-to-red color scheme. To customize:

1. Open `tailwind.config.js`
2. Modify the color values in the `extend.colors` section
3. Update gradient classes throughout the components

### Adding New Features

The modular component structure makes it easy to add new features:

- **New Recipe Fields**: Modify the database schema and update forms
- **Recipe Categories**: Add a `category` field and filtering
- **Recipe Sharing**: Implement sharing functionality
- **Recipe Export**: Add PDF or print functionality

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app works on any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you run into any issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. Open an issue in this repository

## 🎯 Roadmap

- [ ] Recipe categories and tags
- [ ] Recipe sharing between users
- [ ] Recipe export (PDF, print)
- [ ] Recipe scaling (adjust servings)
- [ ] Cooking timer integration
- [ ] Recipe rating and reviews
- [ ] Meal planning calendar
- [ ] Shopping list generation

---

**Happy Cooking! 🍳✨**

Built with ❤️ using Next.js and Supabase
