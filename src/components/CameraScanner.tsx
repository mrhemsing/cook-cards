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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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

  const extractRecipeWithAI = async (imageData: string) => {
    if (!imageData) {
      console.error('No image data provided to AI extraction');
      return;
    }

    setAiProcessing(true);
    try {
      console.log('Starting AI extraction...'); // Debug log

      // Validate image data format
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }

      // Convert base64 to blob with error handling
      let blob: Blob;
      try {
        const response = await fetch(imageData);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        blob = await response.blob();
        console.log('Blob created, size:', blob.size); // Debug log
      } catch (fetchError) {
        console.error('Error creating blob:', fetchError);
        throw new Error('Failed to process image data');
      }

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Invalid image blob');
      }

      // Create FormData for the API
      const formData = new FormData();
      formData.append('image', blob, 'recipe-card.jpg');

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

        // Auto-fill the form fields with safe defaults and type checking
        setTitle(typeof recipeData.title === 'string' ? recipeData.title : '');
        setIngredients(
          typeof recipeData.ingredients === 'string'
            ? recipeData.ingredients
            : ''
        );
        setInstructions(
          typeof recipeData.instructions === 'string'
            ? recipeData.instructions
            : ''
        );

        setAiCompleted(true); // Mark AI as completed

        console.log('Fields updated:', {
          title: recipeData.title,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions
        }); // Debug log
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('AI extraction timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      // Show error to user for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`AI extraction failed: ${errorMessage}. Please fill in manually.`);

      // Reset AI states on error
      setAiCompleted(false);
    } finally {
      setAiProcessing(false);
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
      setCapturedImage(imageSrc);

      // Automatically extract recipe with AI
      console.log('Image captured, calling AI...'); // Debug log
      extractRecipeWithAI(imageSrc);
    } catch (error) {
      console.error('Error in capture function:', error);
      alert('Error capturing image. Please try again.');
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setTitle('');
    setIngredients('');
    setInstructions('');
    setAiCompleted(false);
    setCameraError(null); // Reset camera error when retaking
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
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
      !capturedImage
    ) {
      alert('Please fill in all fields and capture an image');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting recipe save process...'); // Debug log
      console.log('User ID:', user?.id); // Debug log

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size); // Debug log

      // Upload image to Supabase Storage
      const fileName = `${user!.id}/recipe-${Date.now()}.jpg`;
      console.log('Uploading to storage:', fileName); // Debug log

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('Storage upload error:', uploadError); // Debug log
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('Storage upload successful:', uploadData); // Debug log

      // Get public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('recipe-images').getPublicUrl(fileName);

      console.log('Public URL:', publicUrl); // Debug log

      // Save recipe to database
      const recipeData = {
        user_id: user!.id,
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        image_url: publicUrl,
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Scan Recipe Card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!capturedImage ? (
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
                      <div className="border-2 border-white border-dashed rounded-lg p-8 text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p>Position your recipe card in the frame</p>
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
            </div>
          ) : (
            /* Recipe Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative w-full h-48">
                    <Image
                      src={capturedImage}
                      alt="Captured recipe"
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  {aiProcessing && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is reading your recipe card...
                    </div>
                  )}
                  {aiCompleted && !aiProcessing && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <Sparkles className="h-4 w-4" />
                      AI has extracted your recipe!
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
                  Retake Photo
                </button>
              </div>

              {/* Debug info */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <div>
                  Debug: capturedImage = {capturedImage ? 'Set' : 'Not set'}
                </div>
                <div>Debug: title = &quot;{title}&quot;</div>
                <div>Debug: ingredients = &quot;{ingredients}&quot;</div>
                <div>Debug: instructions = &quot;{instructions}&quot;</div>
                <div>Debug: aiProcessing = {aiProcessing ? 'Yes' : 'No'}</div>
                <div>Debug: aiCompleted = {aiCompleted ? 'Yes' : 'No'}</div>
              </div>

              {/* Floating Save Button for Mobile */}
              <div className="fixed bottom-4 left-4 right-4 z-60 md:hidden">
                <button
                  onClick={saveRecipe}
                  disabled={
                    loading ||
                    !title.trim() ||
                    !ingredients.trim() ||
                    !instructions.trim()
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
