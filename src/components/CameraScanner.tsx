'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Camera, RotateCcw, Save, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CameraScannerProps {
  onClose: () => void;
  onRecipeAdded: () => void;
}

export default function CameraScanner({
  onClose,
  onRecipeAdded
}: CameraScannerProps) {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiCompleted, setAiCompleted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [currentOCRService, setCurrentOCRService] = useState<string>('');

  // Add OCR service configurations
  const OCR_SERVICES = {
    GOOGLE_VISION: 'google_vision',
    PRIMARY_AI: 'primary_ai',
    AGGRESSIVE_ENHANCEMENT: 'aggressive_enhancement'
  };

  // Add service-specific image preprocessing
  const preprocessForService = (
    imageData: string,
    service: string
  ): Promise<string> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        resolve(imageData); // Fallback to original image
        return;
      }

      const img = new window.Image();

      img.onload = () => {
        // Different preprocessing for different services
        switch (service) {
          case OCR_SERVICES.GOOGLE_VISION:
            // Google Vision works best with high contrast, slightly enhanced images
            canvas.width = img.width * 1.5;
            canvas.height = img.height * 1.5;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Apply Google Vision optimized preprocessing
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              // Increase contrast and brightness for better OCR
              const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const enhanced = Math.min(
                255,
                Math.max(0, (gray - 128) * 1.3 + 128)
              );

              data[i] = enhanced; // R
              data[i + 1] = enhanced; // G
              data[i + 2] = enhanced; // B
            }

            ctx.putImageData(imageData, 0, 0);
            break;

          case OCR_SERVICES.AGGRESSIVE_ENHANCEMENT:
            // Aggressive enhancement for difficult cases
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const aggressiveImageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const aggressiveData = aggressiveImageData.data;

            for (let i = 0; i < aggressiveData.length; i += 4) {
              // Much more aggressive contrast and brightness enhancement
              const gray =
                (aggressiveData[i] +
                  aggressiveData[i + 1] +
                  aggressiveData[i + 2]) /
                3;
              const enhanced = Math.min(
                255,
                Math.max(0, (gray - 128) * 1.8 + 128)
              );

              aggressiveData[i] = enhanced; // R
              aggressiveData[i + 1] = enhanced; // G
              aggressiveData[i + 2] = enhanced; // B
            }

            ctx.putImageData(aggressiveImageData, 0, 0);
            break;

          default:
            // Default preprocessing (existing enhanceImageForOCR logic)
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const defaultImageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const defaultData = defaultImageData.data;

            for (let i = 0; i < defaultData.length; i += 4) {
              const gray =
                (defaultData[i] + defaultData[i + 1] + defaultData[i + 2]) / 3;
              const enhanced = Math.min(
                255,
                Math.max(0, (gray - 128) * 1.2 + 128)
              );

              defaultData[i] = enhanced;
              defaultData[i + 1] = enhanced;
              defaultData[i + 2] = enhanced;
            }

            ctx.putImageData(defaultImageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.src = imageData;
    });
  };

  // Add image enhancement before AI processing (fallback)
  const enhanceImageForOCR = (imageData: string): Promise<string> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        resolve(imageData); // Fallback to original image
        return;
      }

      const img = new window.Image();

      img.onload = () => {
        // Increase canvas size for better resolution
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;

        // Apply image enhancements
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw with higher resolution
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply contrast and brightness adjustments
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Enhance contrast
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128)); // Red
          data[i + 1] = Math.min(
            255,
            Math.max(0, (data[i + 1] - 128) * 1.2 + 128)
          ); // Green
          data[i + 2] = Math.min(
            255,
            Math.max(0, (data[i + 2] - 128) * 1.2 + 128)
          ); // Blue
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.src = imageData;
    });
  };

  // Add Google Cloud Vision API fallback
  const extractWithGoogleVision = async (
    imageData: string
  ): Promise<{
    title: string;
    ingredients: string;
    instructions: string;
  } | null> => {
    try {
      // Note: You'll need to set up Google Cloud Vision API credentials
      // This is a placeholder for the actual implementation
      const response = await fetch('/api/google-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) throw new Error('Google Vision API failed');

      const result = await response.json();
      return {
        title: result.title || '',
        ingredients: result.ingredients || '',
        instructions: result.instructions || ''
      };
    } catch (error) {
      console.error('Google Vision failed:', error);
      return null;
    }
  };

  // Enhanced extraction with multiple services
  const extractRecipeWithMultipleServices = async (
    imageDataArray: string[],
    retryCount: number = 0
  ): Promise<void> => {
    if (!imageDataArray || imageDataArray.length === 0) {
      console.error('No image data provided to multi-service extraction');
      return;
    }

    setAiProcessing(true);

    try {
      console.log(
        `Starting multi-service extraction... (attempt ${retryCount + 1})`
      );

      // Try Google Vision first (optimized for handwritten text)
      setCurrentOCRService('Google Vision');
      const enhancedImage = await preprocessForService(
        imageDataArray[0],
        OCR_SERVICES.GOOGLE_VISION
      );
      let recipeData = await extractWithGoogleVision(enhancedImage);

      // If Google Vision failed or has missing fields, try primary AI as backup
      if (!recipeData) {
        console.log('Google Vision failed, trying Primary AI...');
        setCurrentOCRService('Primary AI');
        recipeData = await extractRecipeWithAI(imageDataArray, retryCount);
      } else {
        // Check if any fields are missing or too short
        const hasTitle =
          recipeData.title &&
          typeof recipeData.title === 'string' &&
          recipeData.title.trim().length > 3;

        const hasIngredients =
          recipeData.ingredients &&
          typeof recipeData.ingredients === 'string' &&
          recipeData.ingredients.trim().length > 10;

        const hasInstructions =
          recipeData.instructions &&
          typeof recipeData.instructions === 'string' &&
          recipeData.instructions.trim().length > 10;

        // If any field is missing, try primary AI as backup
        if (
          (!hasTitle || !hasIngredients || !hasInstructions) &&
          imageDataArray.length > 0
        ) {
          console.log('Some fields missing, trying Primary AI as backup...');
          setCurrentOCRService('Primary AI');

          const aiResult = await extractRecipeWithAI(
            imageDataArray,
            retryCount
          );

          // Merge results, prioritizing AI for missing fields
          if (aiResult) {
            console.log('Primary AI backup results:', aiResult);

            // Only use AI results for fields that are missing or too short
            if (
              !hasTitle &&
              aiResult.title &&
              aiResult.title.trim().length > 3
            ) {
              recipeData.title = aiResult.title;
              console.log('Primary AI filled in missing title');
            }

            if (
              !hasIngredients &&
              aiResult.ingredients &&
              aiResult.ingredients.trim().length > 10
            ) {
              recipeData.ingredients = aiResult.ingredients;
              console.log('Primary AI filled in missing ingredients');
            }

            if (
              !hasInstructions &&
              aiResult.instructions &&
              aiResult.instructions.trim().length > 10
            ) {
              recipeData.instructions = aiResult.instructions;
              console.log('Primary AI filled in missing instructions');
            }
          }

          // If still missing fields, try with different image preprocessing
          const stillMissingFields =
            !recipeData.title ||
            recipeData.title.trim().length <= 3 ||
            !recipeData.ingredients ||
            recipeData.ingredients.trim().length <= 10 ||
            !recipeData.instructions ||
            recipeData.instructions.trim().length <= 10;

          if (stillMissingFields && imageDataArray.length > 0) {
            console.log(
              'Still missing fields, trying with enhanced image preprocessing...'
            );

            // Try with aggressive image enhancement
            const enhancedImage = await preprocessForService(
              imageDataArray[0],
              OCR_SERVICES.AGGRESSIVE_ENHANCEMENT
            );

            // Try Google Vision again with the enhanced image
            const retryResult = await extractWithGoogleVision(enhancedImage);

            if (retryResult) {
              console.log('Enhanced preprocessing retry results:', retryResult);

              // Fill in any still-missing fields
              if (!recipeData.title || recipeData.title.trim().length <= 3) {
                recipeData.title = retryResult.title || recipeData.title;
              }
              if (
                !recipeData.ingredients ||
                recipeData.ingredients.trim().length <= 10
              ) {
                recipeData.ingredients =
                  retryResult.ingredients || recipeData.ingredients;
              }
              if (
                !recipeData.instructions ||
                recipeData.instructions.trim().length <= 10
              ) {
                recipeData.instructions =
                  retryResult.instructions || recipeData.instructions;
              }
            }
          }
        }
      }

      // Update form with best results
      if (recipeData) {
        setTitle(recipeData.title || '');
        setIngredients(recipeData.ingredients || '');
        setInstructions(recipeData.instructions || '');

        // Check if we still have missing fields after all services
        const finalHasTitle =
          recipeData.title &&
          typeof recipeData.title === 'string' &&
          recipeData.title.trim().length > 3;

        const finalHasIngredients =
          recipeData.ingredients &&
          typeof recipeData.ingredients === 'string' &&
          recipeData.ingredients.trim().length > 10;

        const finalHasInstructions =
          recipeData.instructions &&
          typeof recipeData.instructions === 'string' &&
          recipeData.instructions.trim().length > 10;

        // If any field is still missing, automatically retry with different approach
        if (!finalHasTitle || !finalHasIngredients || !finalHasInstructions) {
          console.log(
            'Fields still missing after all services, auto-retrying...'
          );

          // Wait a moment for any pending state updates, then retry
          setTimeout(() => {
            if (imageDataArray.length > 0) {
              console.log(
                'Auto-retrying extraction with different approach...'
              );
              extractRecipeWithMultipleServices(imageDataArray, retryCount + 1);
            }
          }, 1000);
        } else {
          setAiCompleted(true);
        }
      }
    } catch (error) {
      console.error('Multi-service extraction failed:', error);

      // Fallback to retry logic
      if (imageDataArray.length > 1 && retryCount < 2) {
        console.log('Trying with fewer images...');
        const fewerImages = imageDataArray.slice(
          0,
          Math.ceil(imageDataArray.length / 2)
        );
        return extractRecipeWithMultipleServices(fewerImages, retryCount + 1);
      }

      alert(
        'Both Google Vision and Primary AI failed. Please fill in manually or try taking clearer photos.'
      );
      setAiCompleted(false);
    } finally {
      setAiProcessing(false);
    }
  };

  const extractRecipeWithAI = async (
    imageDataArray: string[],
    retryCount = 0
  ): Promise<{
    title: string;
    ingredients: string;
    instructions: string;
  } | null> => {
    if (!imageDataArray || imageDataArray.length === 0) {
      console.error('No image data provided to AI extraction');
      return null;
    }

    try {
      console.log(`Starting AI extraction... (attempt ${retryCount + 1})`); // Debug log

      // Validate image data format for all images
      for (const imageData of imageDataArray) {
        if (!imageData.startsWith('data:image/')) {
          throw new Error('Invalid image format');
        }
      }

      // Create FormData for the API with multiple images
      const formData = new FormData();

      // Add all images to the form data
      for (let i = 0; i < imageDataArray.length; i++) {
        const response = await fetch(imageDataArray[i]);
        if (!response.ok) {
          throw new Error(`Failed to fetch image ${i + 1}: ${response.status}`);
        }
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error(`Invalid image blob for image ${i + 1}`);
        }
        formData.append('images', blob, `recipe-card-${i + 1}.jpg`);
      }

      console.log('Calling AI API...'); // Debug log

      // Call AI service to extract recipe with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const aiResponse = await fetch('/api/extract-recipe', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          throw new Error(`AI extraction failed: ${aiResponse.status}`);
        }

        const recipeData = await aiResponse.json();
        console.log('AI response:', recipeData); // Debug log
        console.log('AI response types:', {
          title: typeof recipeData.title,
          ingredients: typeof recipeData.ingredients,
          instructions: typeof recipeData.instructions
        }); // Debug log

        // Validate AI response
        if (!recipeData || typeof recipeData !== 'object') {
          throw new Error('Invalid AI response format');
        }

        // Check if ingredients are missing or too short
        const hasIngredients =
          recipeData.ingredients &&
          typeof recipeData.ingredients === 'string' &&
          recipeData.ingredients.trim().length > 10;

        // If ingredients are missing and we have multiple images, try with different combinations
        if (!hasIngredients && imageDataArray.length > 1 && retryCount < 2) {
          console.log(
            'Ingredients missing, trying with different image combination...'
          );

          // Try with just the first image
          const singleImageArray = [imageDataArray[0]];
          return extractRecipeWithAI(singleImageArray, retryCount + 1);
        }

        // Return the recipe data for the multi-service function to handle
        return {
          title: typeof recipeData.title === 'string' ? recipeData.title : '',
          ingredients:
            typeof recipeData.ingredients === 'string'
              ? recipeData.ingredients
              : '',
          instructions:
            typeof recipeData.instructions === 'string'
              ? recipeData.instructions
              : ''
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('AI extraction timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('AI extraction error:', error);

      // If we have multiple images and this failed, try with fewer images
      if (imageDataArray.length > 1 && retryCount < 2) {
        console.log('AI extraction failed, trying with fewer images...');
        const fewerImages = imageDataArray.slice(
          0,
          Math.ceil(imageDataArray.length / 2)
        );
        return extractRecipeWithAI(fewerImages, retryCount + 1);
      }

      // Show error to user
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`AI extraction failed: ${errorMessage}. Please fill in manually.`);

      // Reset AI states on error
      setAiCompleted(false);
      return null;
    }
  };

  const capture = useCallback(() => {
    try {
      if (!webcamRef.current) {
        console.error('Webcam ref not available');
        alert('Camera not ready. Please try again.');
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.error('Failed to capture image');
        alert('Failed to capture image. Please try again.');
        return;
      }

      console.log('Image captured successfully, size:', imageSrc.length);

      // Crop and enhance the image
      cropImageToRecipeCard(imageSrc)
        .then(croppedImage => {
          if (!croppedImage) {
            console.error('Failed to crop image');
            alert('Failed to process image. Please try again.');
            return;
          }

          // Enhance the cropped image for better OCR
          return enhanceImageForOCR(croppedImage);
        })
        .then(enhancedImage => {
          if (!enhancedImage) {
            console.error('Failed to enhance image');
            alert('Failed to process image. Please try again.');
            return;
          }

          const newImages = [...capturedImages, enhancedImage];
          setCapturedImages(newImages);

          // Automatically extract recipe with multi-service OCR using all images
          console.log(
            'Image captured, cropped, and enhanced, calling multi-service extraction with',
            newImages.length,
            'images...'
          ); // Debug log
          extractRecipeWithMultipleServices(newImages);
        })
        .catch(error => {
          console.error('Error processing image:', error);
          alert('Failed to process image. Please try again.');
        });
    } catch (error) {
      console.error('Error in capture function:', error);
      alert('Error capturing image. Please try again.');
    }
  }, [capturedImages]);

  const retake = () => {
    setCapturedImages([]);
    setTitle('');
    setIngredients('');
    setInstructions('');
    setAiCompleted(false);
    setCameraError(null); // Reset camera error when retaking
    setShowAddPhoto(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const addAnotherPhoto = () => {
    setShowAddPhoto(true);
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    if (newImages.length === 0) {
      setShowAddPhoto(false);
    }
  };

  // Function to crop image to recipe card boundaries
  const cropImageToRecipeCard = (imageSrc: string): Promise<string | null> => {
    return new Promise(resolve => {
      try {
        // Create a canvas element for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get canvas context');
          resolve(null);
          return;
        }

        // Create an image element to load the captured image
        const img = new window.Image();
        img.onload = () => {
          try {
            // Set canvas dimensions to match the recipe card boundaries
            // The boundaries are centered and take up most of the camera view
            const cropWidth = img.width * 0.8; // 80% of image width
            const cropHeight = img.height * 0.8; // 80% of image height
            const cropX = (img.width - cropWidth) / 2; // Center horizontally
            const cropY = (img.height - cropHeight) / 2; // Center vertically

            // Set canvas size to the cropped dimensions
            canvas.width = cropWidth;
            canvas.height = cropHeight;

            // Draw the cropped portion of the image
            ctx.drawImage(
              img,
              cropX,
              cropY,
              cropWidth,
              cropHeight, // Source rectangle
              0,
              0,
              cropWidth,
              cropHeight // Destination rectangle
            );

            // Return the cropped image as base64
            const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
            resolve(croppedImage);
          } catch (error) {
            console.error('Error processing cropped image:', error);
            resolve(null);
          }
        };

        img.onerror = () => {
          console.error('Failed to load image for cropping');
          resolve(null);
        };

        // Set the source to start loading
        img.src = imageSrc;
      } catch (error) {
        console.error('Error setting up image cropping:', error);
        resolve(null);
      }
    });
  };

  const saveRecipe = async () => {
    if (!user?.id) {
      alert('You must be logged in to save recipes');
      return;
    }

    // Ensure all fields are strings and not empty
    if (
      typeof title !== 'string' ||
      typeof ingredients !== 'string' ||
      typeof instructions !== 'string' ||
      !title.trim() ||
      !ingredients.trim() ||
      !instructions.trim() ||
      capturedImages.length === 0
    ) {
      alert('Please fill in all fields and capture at least one image');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting recipe save process...'); // Debug log
      console.log('User ID:', user?.id); // Debug log

      // Upload all images to Supabase Storage
      const imageUrls: string[] = [];

      for (let i = 0; i < capturedImages.length; i++) {
        const response = await fetch(capturedImages[i]);
        const blob = await response.blob();
        console.log(`Blob ${i + 1} created, size:`, blob.size); // Debug log

        // Upload image to Supabase Storage
        const fileName = `${user!.id}/recipe-${Date.now()}-${i + 1}.jpg`;
        console.log(`Uploading image ${i + 1} to storage:`, fileName); // Debug log

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, blob);

        if (uploadError) {
          console.error(
            `Storage upload error for image ${i + 1}:`,
            uploadError
          ); // Debug log
          throw new Error(
            `Storage upload failed for image ${i + 1}: ${uploadError.message}`
          );
        }

        console.log(
          `Storage upload successful for image ${i + 1}:`,
          uploadData
        ); // Debug log

        // Get public URL
        const {
          data: { publicUrl }
        } = supabase.storage.from('recipe-images').getPublicUrl(fileName);

        imageUrls.push(publicUrl);
        console.log(`Public URL for image ${i + 1}:`, publicUrl); // Debug log
      }

      // Use the first image as the main image_url for backward compatibility
      const mainImageUrl = imageUrls[0];

      // Save recipe to database
      const recipeData = {
        user_id: user!.id,
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        image_url: mainImageUrl,
        display_name:
          user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
      };

      console.log('Saving recipe to database:', recipeData); // Debug log

      const { data: dbData, error: dbError } = await supabase
        .from('recipes')
        .insert(recipeData);

      if (dbError) {
        console.error('Database insert error:', dbError); // Debug log
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('Database insert successful:', dbData); // Debug log

      onRecipeAdded();
    } catch (error) {
      console.error('Error saving recipe:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving recipe: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Scan Recipe Card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {capturedImages.length === 0 ? (
            /* Camera View */
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {cameraError ? (
                  <div className="w-full h-64 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <Camera className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="text-red-200 mb-2">{cameraError}</p>
                      <button
                        onClick={() => setCameraError(null)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        facingMode: facingMode,
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                      }}
                      className="w-full h-64 object-cover"
                      onError={error => {
                        console.error('Webcam error:', error);
                        setCameraError(
                          'Camera error. Please check permissions and try again.'
                        );
                      }}
                      onUserMediaError={error => {
                        console.error('User media error:', error);
                        setCameraError(
                          'Camera access denied. Please allow camera permissions and try again.'
                        );
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="border-2 border-white border-dashed rounded-lg p-8 text-center text-white"
                        style={{ width: '80%', height: '80%' }}>
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          Position your recipe card within this frame
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          Only this area will be saved
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={capture}
                  disabled={aiProcessing || !!cameraError}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
                  {aiProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 inline mr-2" />
                      Capture Image
                    </>
                  )}
                </button>
                <button
                  onClick={toggleCamera}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>

              {/* Add guidance for multiple photos */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  💡 Pro Tip: Take Multiple Photos
                </h4>
                <p className="text-xs text-blue-700">
                  For handwritten recipes, try taking 2-3 photos from slightly
                  different angles.
                </p>
              </div>
            </div>
          ) : (
            /* Recipe Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Multiple Images Display */}
                  <div className="space-y-3">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="relative w-full h-48">
                          <Image
                            src={image}
                            alt={`Recipe card ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove this image">
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Photo {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Another Photo Button */}
                  {!showAddPhoto && (
                    <button
                      onClick={addAnotherPhoto}
                      className="w-full mt-3 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
                      <Camera className="h-5 w-5 inline mr-2" />
                      Add Another Photo
                    </button>
                  )}

                  {/* Camera for Additional Photos */}
                  {showAddPhoto && (
                    <div className="mt-3 space-y-3">
                      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{
                            facingMode: facingMode,
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                          }}
                          className="w-full h-32 object-cover"
                          onError={error => {
                            console.error('Webcam error:', error);
                            setCameraError(
                              'Camera error. Please check permissions and try again.'
                            );
                          }}
                          onUserMediaError={error => {
                            console.error('User media error:', error);
                            setCameraError(
                              'Camera access denied. Please allow camera permissions and try again.'
                            );
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="border-2 border-white border-dashed rounded-lg p-4 text-center text-white"
                            style={{ width: '80%', height: '80%' }}>
                            <Camera className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-sm">Add another photo</p>
                            <p className="text-xs opacity-75">
                              Only this area will be saved
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={capture}
                          disabled={aiProcessing || !!cameraError}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
                          {aiProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 inline mr-2" />
                              Capture
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowAddPhoto(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {aiProcessing && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {currentOCRService
                        ? `Processing with ${currentOCRService}...`
                        : 'AI is reading your recipe cards...'}
                    </div>
                  )}
                  {aiCompleted && !aiProcessing && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                        <Sparkles className="h-4 w-4" />
                        AI has extracted your recipe!
                      </div>

                      {/* Add feedback buttons */}
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => {
                            // Option to retry with different image processing
                            if (capturedImages.length > 1) {
                              alert(
                                'Try taking another photo from a different angle, or ensure the text is well-lit and clearly visible.'
                              );
                            }
                          }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          Missing ingredients?
                        </button>
                        <button
                          onClick={() => {
                            if (capturedImages.length > 0) {
                              setAiCompleted(false);
                              extractRecipeWithMultipleServices(
                                capturedImages,
                                0
                              );
                            }
                          }}
                          disabled={aiProcessing || capturedImages.length === 0}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors">
                          🔄 Retry All Services
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Recipe Title
                      </label>
                      {aiProcessing && (
                        <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={title || ''}
                      onChange={e => setTitle(e.target.value || '')}
                      placeholder="e.g., Grandma's Chocolate Chip Cookies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredients
                    </label>
                    <textarea
                      value={ingredients || ''}
                      onChange={e => setIngredients(e.target.value || '')}
                      placeholder="List ingredients here..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={instructions || ''}
                      onChange={e => setInstructions(e.target.value || '')}
                      placeholder="Step-by-step instructions..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={retake}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Retake All Photos
                </button>
              </div>

              {/* Debug info */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <div>
                  Debug: capturedImages = {capturedImages.length} images
                </div>
                <div>Debug: title = &quot;{title}&quot;</div>
                <div>Debug: ingredients = &quot;{ingredients}&quot;</div>
                <div>Debug: instructions = &quot;{instructions}&quot;</div>
                <div>Debug: aiProcessing = {aiProcessing ? 'Yes' : 'No'}</div>
                <div>Debug: aiCompleted = {aiCompleted ? 'Yes' : 'No'}</div>
                <div>Debug: showAddPhoto = {showAddPhoto ? 'Yes' : 'No'}</div>
                <div>
                  Debug: Image cropping enabled - Only 80% center area saved
                </div>
              </div>

              {/* Floating Save Button for Mobile */}
              <div className="fixed bottom-4 left-4 right-4 z-60 md:hidden">
                <button
                  onClick={saveRecipe}
                  disabled={
                    loading ||
                    !title.trim() ||
                    !ingredients.trim() ||
                    !instructions.trim() ||
                    capturedImages.length === 0
                  }
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-lg font-medium shadow-xl border-2 border-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Save className="h-6 w-6" />
                      💾 SAVE RECIPE
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
