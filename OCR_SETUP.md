# OCR Services Setup Guide

This guide will help you set up Google Cloud Vision API and Azure Computer Vision API to improve handwritten recipe recognition in your app.

## 🚀 Why Multiple OCR Services?

- **Primary AI Service**: Your existing AI service for initial extraction
- **Google Cloud Vision**: Excellent for handwritten text recognition
- **Smart Fallback**: Automatically tries Google Vision when ingredients are missing

## 🔑 Google Cloud Vision API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Cloud Vision API

### 2. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key

### 3. Add to Environment Variables

Add this to your `.env.local` file:

```bash
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

## 📱 How It Works

1. **User takes photo** of handwritten recipe
2. **Primary AI service** attempts extraction first
3. **If ingredients missing** → Automatically tries Google Vision
4. **Best results combined** → Form filled with successful extractions

## 💰 Pricing (Approximate)

### Google Cloud Vision

- **First 1,000 requests/month**: FREE
- **Additional requests**: $1.50 per 1,000 requests

## 🧪 Testing

1. Take a photo of a handwritten recipe
2. Check browser console for service switching logs
3. Look for "Processing with [Service Name]..." messages
4. Use "Retry All Services" button if needed

## 🔧 Troubleshooting

### Common Issues:

- **"API not configured"**: Check environment variables
- **"API failed"**: Verify API keys and quotas
- **"Processing timed out"**: Check network connectivity

### Debug Info:

The app shows which OCR service is currently being used in the processing indicator.

## 🎯 Best Practices

1. **Take multiple photos** from different angles
2. **Ensure good lighting** for better OCR results
3. **Keep phone steady** during capture
4. **Use the retry button** if ingredients are missing

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure you have sufficient API quota
4. Check network connectivity to external APIs
