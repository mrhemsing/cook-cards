'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CameraScanner from './CameraScanner';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';
import ErrorBoundary from './ErrorBoundary';
import { ChefHat, Camera, LogOut, Plus, Search, Share2 } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
}

export default function RecipeBook() {
  const { user, signOut } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchRecipes();
    }
  }, [user?.id, fetchRecipes]);

  const handleRecipeAdded = () => {
    setShowForm(false);
    setShowScanner(false);
    fetchRecipes();
  };

  const handleShareRecipeBook = async () => {
    try {
      // Create a shareable URL for the user's personal recipe collection
      const shareUrl = `${window.location.origin}/collection/${user?.id}`;

      // Try to use native sharing if available
      if (navigator.share) {
        await navigator.share({
          title: `${
            user?.user_metadata?.full_name || user?.email
          }'s Recipe Collection`,
          text: `Check out my personal recipe collection on Taste of Time! I have ${recipes.length} recipes saved.`,
          url: shareUrl
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Your personal recipe collection link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing recipe book:', error);
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/collection/${user?.id}`
        );
        alert('Your personal recipe collection link copied to clipboard!');
      } catch {
        alert('Failed to share your recipe collection. Please try again.');
      }
    }
  };

  const filteredRecipes = recipes.filter(
    recipe =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Taste of Time</h1>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <span className="text-sm text-gray-600 text-right">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareRecipeBook}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Share my recipe collection">
                  <Share2 className="h-4 w-4" />
                  Share My Collection
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg">
            <Camera className="h-5 w-5" />
            Scan Recipe Card
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Plus className="h-5 w-5" />
            Add Recipe Manually
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Recipe List */}
        <RecipeList
          recipes={filteredRecipes}
          loading={loading}
          onRecipeUpdated={fetchRecipes}
        />

        {/* Scanner Modal */}
        {showScanner && (
          <ErrorBoundary>
            <CameraScanner
              onClose={() => setShowScanner(false)}
              onRecipeAdded={handleRecipeAdded}
            />
          </ErrorBoundary>
        )}

        {/* Form Modal */}
        {showForm && (
          <RecipeForm
            onClose={() => setShowForm(false)}
            onRecipeAdded={handleRecipeAdded}
          />
        )}
      </main>
    </div>
  );
}
