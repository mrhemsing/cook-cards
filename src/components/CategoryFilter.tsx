'use client';

import { Category } from './CategorySelector';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  className?: string;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  className = ''
}: CategoryFilterProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Filter by Category</h4>

      <div className="flex flex-wrap gap-2">
        {/* All Categories Button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`
            px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${
              selectedCategory === null
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}>
          All
        </button>

        {/* Category Buttons */}
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`
              px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${
                selectedCategory === category.id
                  ? 'text-white shadow-md'
                  : 'hover:opacity-80'
              }
            `}
            style={{
              backgroundColor:
                selectedCategory === category.id
                  ? category.color
                  : category.color + '20',
              color:
                selectedCategory === category.id ? 'white' : category.color,
              border:
                selectedCategory === category.id
                  ? 'none'
                  : `1px solid ${category.color}40`
            }}>
            {category.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}
