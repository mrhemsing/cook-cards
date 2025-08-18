# OCR Services Setup Guide

This guide explains the current OCR setup for your recipe app.

## 🚀 Current OCR Strategy

- **Primary AI Service**: Your existing AI service for recipe extraction
- **Google Vision API**: Currently disabled
- **Simple Fallback**: Retries with enhanced image preprocessing if fields are missing

## 📱 How It Works Now

1. **User takes photo** of handwritten recipe
2. **Primary AI service** attempts extraction
3. **If fields missing** → Automatically retries with enhanced image preprocessing
4. **Best results used** → Form filled with successful extractions

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

## 🔄 Re-enabling Google Vision

If you want to re-enable Google Vision API in the future:

1. Set up Google Cloud Vision API credentials
2. Add `GOOGLE_CLOUD_VISION_API_KEY` to environment variables
3. Re-add the Google Vision API route
4. Update the CameraScanner component to include Google Vision fallback
