'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
  user_id: string;
  display_name?: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    display_name: string;
    color: string;
  };
}

interface RecipeClientProps {
  recipe: Recipe;
}

export default function RecipeClient({ recipe }: RecipeClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <h1
                  className="text-xl text-gray-900 font-cormorant-garamond"
                  style={{ fontWeight: 900 }}>
                  Mom&apos;s Yums
                </h1>
              </Link>
            </div>

            {/* Removed share button and Create Your Collection button */}
          </div>
        </div>
      </header>

      {/* Recipe Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Recipe Image */}
          {recipe.image_url && (
            <div className="h-96 bg-gray-100 relative">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Recipe Details */}
          <div className="p-8">
            {/* Category Badge */}
            {recipe.category && (
              <div className="mb-4">
                <span
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white"
                  style={{ backgroundColor: recipe.category.color }}>
                  {recipe.category.display_name}
                </span>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {recipe.title}
            </h1>
            {recipe.display_name && (
              <p className="text-sm text-gray-500 mb-6">
                (from {recipe.display_name}&apos;s recipes)
              </p>
            )}

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
                  family&apos;s culinary treasures.
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
