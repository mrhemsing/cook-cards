'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Camera, RotateCcw, Save, Sparkles, Loader2 } from 'lucide-react';

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

  const extractRecipeWithAI = async (imageData: string) => {
    setAiProcessing(true);
    try {
      console.log('Starting AI extraction...'); // Debug log

      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create FormData for the API
      const formData = new FormData();
      formData.append('image', blob, 'recipe-card.jpg');

      console.log('Calling AI API...'); // Debug log

      // Call AI service to extract recipe
      const aiResponse = await fetch('/api/extract-recipe', {
        method: 'POST',
        body: formData
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`AI extraction failed: ${aiResponse.status}`);
      }

      const recipeData = await aiResponse.json();
      console.log('AI response:', recipeData); // Debug log

      // Auto-fill the form fields
      setTitle(recipeData.title || '');
      setIngredients(recipeData.ingredients || '');
      setInstructions(recipeData.instructions || '');

      setAiCompleted(true); // Mark AI as completed

      console.log('Fields updated:', {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions
      }); // Debug log
    } catch (error) {
      console.error('AI extraction error:', error);
      // Show error to user for debugging
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`AI extraction failed: ${errorMessage}. Please fill in manually.`);
    } finally {
      setAiProcessing(false);
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);

      // Automatically extract recipe with AI
      if (imageSrc) {
        console.log('Image captured, calling AI...'); // Debug log
        extractRecipeWithAI(imageSrc);
      }
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setTitle('');
    setIngredients('');
    setInstructions('');
    setAiCompleted(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const saveRecipe = async () => {
    if (!user?.id) {
      alert('You must be logged in to save recipes');
      return;
    }

    if (
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
        image_url: publicUrl
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
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                  }}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg p-8 text-center text-white">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>Position your recipe card in the frame</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={capture}
                  disabled={aiProcessing}
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
                  <img
                    src={capturedImage}
                    alt="Captured recipe"
                    className="w-full h-48 object-cover rounded-lg"
                  />
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
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Grandma's Chocolate Chip Cookies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredients
                    </label>
                    <textarea
                      value={ingredients}
                      onChange={e => setIngredients(e.target.value)}
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
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
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
