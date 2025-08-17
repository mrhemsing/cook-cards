'use client';

import { Camera, Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
}

interface CollectionClientProps {
  recipes: Recipe[];
  displayName: string;
}

export default function CollectionClient({
  recipes,
  displayName
}: CollectionClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Mom&apos;s Yums
                </h1>
              </Link>
            </div>

            {/* Removed share button and Create Your Collection button */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collection Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {displayName}&apos;s
            <br />
            Recipe Collection
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            A curated collection of cherished
            <br />
            family recipes
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Camera className="h-5 w-5" />
              <span>{recipes.length} Recipes</span>
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Recipe Image */}
              <div className="h-48 bg-gray-100 relative">
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

                {/* View Recipe Button */}
                <Link
                  href={`/recipe/${recipe.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors">
                  <Plus className="h-4 w-4" />
                  View Recipe
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Inspired by this collection?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Start preserving your own family recipes with Mom&apos;s Yums. Scan
            handwritten recipe cards, organize your collection, and share your
            culinary treasures with loved ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg">
              <UserPlus className="h-5 w-5 mr-2" />
              Start Your Recipe Collection
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <Camera className="h-5 w-5 mr-2" />
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
