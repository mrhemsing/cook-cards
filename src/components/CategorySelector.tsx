'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export interface Category {
  id: number;
  name: string;
  display_name: string;
  color: string;
}

interface CategorySelectorProps {
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number) => void;
  onBack?: () => void;
  categories: Category[];
  required?: boolean;
  className?: string;
}

export default function CategorySelector({
  selectedCategory,
  onCategorySelect,
  onBack,
  categories,
  required = false,
  className = ''
}: CategorySelectorProps) {
  const [showError, setShowError] = useState(false);

  const handleCategoryClick = (categoryId: number) => {
    onCategorySelect(categoryId);
    setShowError(false);
  };

  const handleContinue = () => {
    if (required && !selectedCategory) {
      setShowError(true);
      return;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Recipe Category
        </h3>
        <p className="text-sm text-gray-600">
          Choose the category that best fits your recipe
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105
              ${
                selectedCategory === category.id
                  ? 'border-gray-900 bg-gray-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}>
            {/* Selected Checkmark */}
            {selectedCategory === category.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Category Icon */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: category.color }}>
                {category.display_name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {category.display_name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {showError && (
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Please select a category to continue
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="text-center pt-2 space-y-3">
        {/* Continue Button */}
        {required && (
          <button
            onClick={handleContinue}
            disabled={!selectedCategory}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${
                selectedCategory
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}>
            Continue
          </button>
        )}

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
