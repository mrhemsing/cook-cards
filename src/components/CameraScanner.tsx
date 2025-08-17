'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Camera, RotateCcw, Save } from 'lucide-react';

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setTitle('');
    setIngredients('');
    setInstructions('');
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const saveRecipe = async () => {
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
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Upload image to Supabase Storage
      const fileName = `recipe-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('recipe-images').getPublicUrl(fileName);

      // Save recipe to database
      const { error: dbError } = await supabase.from('recipes').insert({
        user_id: user!.id,
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        image_url: publicUrl
      });

      if (dbError) throw dbError;

      onRecipeAdded();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Error saving recipe. Please try again.');
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
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all">
                  <Camera className="h-5 w-5 inline mr-2" />
                  Capture Image
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
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe Title
                    </label>
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={retake}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Retake Photo
                </button>
                <button
                  onClick={saveRecipe}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    <>
                      <Save className="h-5 w-5 inline mr-2" />
                      Save Recipe
                    </>
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
