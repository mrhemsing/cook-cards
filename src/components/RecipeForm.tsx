'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save, Upload } from 'lucide-react';
import Image from 'next/image';

interface RecipeFormProps {
  onClose: () => void;
  onRecipeAdded: () => void;
}

export default function RecipeForm({
  onClose,
  onRecipeAdded
}: RecipeFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveRecipe = async () => {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';

      if (imageFile) {
        // Upload image to Supabase Storage
        const fileName = `recipe-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl }
        } = supabase.storage.from('recipe-images').getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Save recipe to database
      const { error: dbError } = await supabase.from('recipes').insert({
        user_id: user!.id,
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        image_url: imageUrl,
        display_name:
          user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            Add Recipe Manually
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recipe Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients *
            </label>
            <textarea
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              placeholder="List all ingredients with measurements..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions *
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Step-by-step cooking instructions..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Image (Optional)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Click to upload image</span>
              </label>

              {imagePreview && (
                <div className="relative">
                  <div className="relative w-full h-48">
                    <Image
                      src={imagePreview}
                      alt="Recipe preview"
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Cancel
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
      </div>
    </div>
  );
}
