# 🚀 Deployment Guide

This guide will help you deploy your Taste of Time application to various platforms.

## 📋 Prerequisites

Before deploying, make sure you have:

1. ✅ Set up your Supabase project
2. ✅ Configured Google authentication provider
3. ✅ Created the database tables
4. ✅ Set up storage buckets
5. ✅ Tested the app locally

## 🌐 Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Step 1: Prepare Your Code

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### Step 3: Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Update OAuth Redirect URLs

In your Supabase dashboard, update the redirect URLs:

```
https://your-project.vercel.app/auth/callback
```

## 🐳 Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Build and Run

```bash
docker build -t taste-of-time .
docker run -p 3000:3000 taste-of-time
```

## ☁️ AWS Deployment

### Option 1: AWS Amplify

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```
4. Add environment variables
5. Deploy

### Option 2: EC2 with Docker

1. Launch an EC2 instance
2. Install Docker
3. Pull and run your container
4. Configure load balancer if needed

## 🐙 GitHub Pages

Note: GitHub Pages doesn't support server-side rendering, so you'll need to export as static HTML.

### Step 1: Configure Next.js

```javascript
// next.config.ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

### Step 2: Build and Deploy

```bash
npm run build
npm run export
# Upload the 'out' folder to GitHub Pages
```

## 🔧 Environment Configuration

### Production Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Production Settings

1. **Row Level Security**: Ensure all policies are properly configured
2. **Storage**: Verify bucket permissions
3. **Authentication**: Test OAuth flows in production
4. **Database**: Monitor performance and add indexes if needed

## 📱 Mobile App Deployment

### PWA (Progressive Web App)

Your app is already PWA-ready! Users can:

1. Add to home screen
2. Use offline (with service worker)
3. Receive push notifications

### React Native (Future Enhancement)

To convert to a native mobile app:

1. Use React Native Web
2. Implement native camera APIs
3. Add offline storage
4. Push notifications

## 🔒 Security Considerations

### Production Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Row Level Security enabled
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation enforced
- [ ] SQL injection protection
- [ ] XSS protection enabled

### Monitoring

- Set up error tracking (Sentry, LogRocket)
- Monitor performance (Vercel Analytics, Google Analytics)
- Set up uptime monitoring
- Configure alerts for errors

## 🚨 Troubleshooting

### Common Issues

**Build Fails**

- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

**Authentication Issues**

- Verify OAuth redirect URLs
- Check Supabase project settings
- Ensure environment variables are correct

**Database Connection**

- Verify Supabase URL and keys
- Check database policies
- Ensure tables exist

**Image Upload Fails**

- Verify storage bucket permissions
- Check file size limits
- Ensure proper CORS configuration

### Getting Help

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js deployment docs](https://nextjs.org/docs/deployment)
3. Check platform-specific documentation
4. Open an issue in this repository

## 🎯 Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize images
npm install @next/image
```

### Runtime Optimization

- Enable compression
- Use CDN for static assets
- Implement caching strategies
- Optimize database queries

---

**Happy Deploying! 🚀✨**
