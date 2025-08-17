'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChefHat, ArrowLeft, Share2, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
  user_id: string;
}

export default function SharedRecipePage({
  params
}: {
  params: { id: string };
}) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setRecipe(data);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setError('Recipe not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: recipe?.title || 'Recipe',
          text: `Check out this recipe: ${recipe?.title}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Recipe link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      } catch (clipboardError) {
        alert('Failed to share recipe. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ChefHat className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recipe Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This recipe may have been deleted or is no longer available.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Taste of Time
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Taste of Time
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-md hover:bg-blue-50"
                title="Share recipe">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all">
                <UserPlus className="h-4 w-4" />
                Create Your Collection
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Recipe Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Recipe Image */}
          {recipe.image_url && (
            <div className="h-96 bg-gray-100">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Recipe Details */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {recipe.title}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Ingredients
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {recipe.ingredients}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Instructions
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {recipe.instructions}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Love this recipe?
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your own digital recipe collection and preserve your
                  family's culinary heritage.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Start Your Recipe Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
