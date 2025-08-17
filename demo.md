# 🎯 Quick Demo Guide

Want to see Taste of Time in action? Follow these steps to get up and running quickly!

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your Project URL and anon key
4. Update `.env.local` with your credentials

### 3. Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database-setup.sql`
3. Click **Run** to create tables and policies

### 4. Configure Auth (5 minutes)

1. In Supabase, go to **Authentication > Providers**
2. Enable **Google** and add your OAuth credentials
3. Set redirect URL: `http://localhost:3000/auth/callback`

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start scanning recipes! 📱

## 🧪 Testing Features

### Camera Scanning

- Click "Scan Recipe Card"
- Allow camera permissions
- Position a handwritten recipe in frame
- Capture and fill in details

### Manual Entry

- Click "Add Recipe Manually"
- Fill in recipe information
- Upload an image (optional)
- Save to your collection

### Recipe Management

- View all your recipes in a grid
- Search by title or ingredients
- Edit recipe details
- Delete unwanted recipes

## 🔧 Troubleshooting

**Camera not working?**

- Make sure you're using HTTPS or localhost
- Check browser permissions
- Try refreshing the page

**Can't login?**

- Verify Supabase credentials in `.env.local`
- Check OAuth redirect URLs
- Ensure database tables exist

**Images not uploading?**

- Verify storage bucket permissions
- Check file size limits
- Ensure proper CORS settings

## 📱 Mobile Testing

The app works great on mobile! To test:

1. Run `npm run dev`
2. Find your computer's IP address
3. On your phone, visit `http://YOUR_IP:3000`
4. Test camera scanning on your device

## 🎉 What You'll See

- **Beautiful login page** with Google sign-in
- **Clean dashboard** with recipe scanning and management
- **Responsive design** that works on all devices
- **Real-time updates** as you add/edit recipes
- **Secure storage** of your recipe collection

---

**Ready to start cooking? Let's scan some recipes! 🍳✨**
