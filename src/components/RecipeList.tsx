'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Eye, X } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
}

interface RecipeListProps {
  recipes: Recipe[];
  loading: boolean;
  onRecipeUpdated: () => void;
}

export default function RecipeList({
  recipes,
  loading,
  onRecipeUpdated
}: RecipeListProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    ingredients: '',
    instructions: ''
  });

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditForm({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions
    });
  };

  const handleUpdate = async () => {
    if (!editingRecipe) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .update({
          title: editForm.title.trim(),
          ingredients: editForm.ingredients.trim(),
          instructions: editForm.instructions.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecipe.id);

      if (error) throw error;

      setEditingRecipe(null);
      onRecipeUpdated();
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Error updating recipe. Please try again.');
    }
  };

  const handleDelete = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      onRecipeUpdated();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Error deleting recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No recipes yet
        </h3>
        <p className="text-gray-500">
          Start by scanning a recipe card or adding one manually!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Recipe Image */}
            <div className="h-48 bg-gray-100 relative">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Recipe Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {recipe.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {recipe.ingredients}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(recipe)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="px-3 py-2 text-red-600 hover:text-red-700 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedRecipe.title}
                </h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {selectedRecipe.image_url && (
                <img
                  src={selectedRecipe.image_url}
                  alt={selectedRecipe.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ingredients
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedRecipe.ingredients}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Instructions
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedRecipe.instructions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Recipe</h2>
                <button
                  onClick={() => setEditingRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipe Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients
                  </label>
                  <textarea
                    value={editForm.ingredients}
                    onChange={e =>
                      setEditForm({ ...editForm, ingredients: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={editForm.instructions}
                    onChange={e =>
                      setEditForm({ ...editForm, instructions: e.target.value })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingRecipe(null)}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all">
                    Update Recipe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
