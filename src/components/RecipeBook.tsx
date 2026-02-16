'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CameraScanner from './CameraScanner';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';
import ErrorBoundary from './ErrorBoundary';
import ProfilePhoto from './ProfilePhoto';
import { Camera, LogOut, Plus, Search, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  created_at: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    display_name: string;
    color: string;
  };
}

export default function RecipeBook() {
  const { user, signOut } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<{
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);

  // Categories data
  const categories = [
    { id: 3, name: 'appetizers', display_name: 'Appetizers', color: '#10B981' },
    { id: 4, name: 'salad', display_name: 'Salad', color: '#3B82F6' },
    { id: 5, name: 'main', display_name: 'Main', color: '#EF4444' },
    { id: 2, name: 'desserts', display_name: 'Desserts', color: '#EC4899' },
    { id: 1, name: 'baking', display_name: 'Baking', color: '#F59E0B' },
    { id: 6, name: 'other', display_name: 'Other', color: '#6B7280' }
  ];

  // Fetch profile data from profiles table
  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        setProfileData(profile);
      } else {
        // Fallback to user metadata
        setProfileData({
          username: user.user_metadata?.username,
          display_name: user.user_metadata?.display_name,
          avatar_url: user.user_metadata?.avatar_url
        });
      }
    } catch (error) {
      console.warn('Error fetching profile data:', error);
      // Fallback to user metadata
      setProfileData({
        username: user.user_metadata?.username,
        display_name: user.user_metadata?.display_name,
        avatar_url: user.user_metadata?.avatar_url
      });
    }
  }, [user?.id, user?.user_metadata]);

  const fetchRecipes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          category:categories(id, name, display_name, color)
        `
        )
        .eq('user_id', user.id)
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
    fetchRecipes();
    fetchProfileData(); // Fetch profile data on mount
  }, [fetchRecipes, fetchProfileData]);

  const handleRecipeAdded = () => {
    setShowForm(false);
    setShowScanner(false);
    fetchRecipes();
    fetchProfileData(); // Refresh profile data when recipes are added
  };

  const handleShareRecipeBook = async () => {
    try {
      // Create a shareable URL for the user's personal recipe collection
      const shareUrl = `${window.location.origin}/collection/${user?.id}`;

      // Try to use native sharing if available
      if (navigator.share) {
        await navigator.share({
          title: `${
            user?.user_metadata?.display_name ||
            user?.user_metadata?.username ||
            user?.user_metadata?.full_name ||
            user?.email
          }'s Recipe Collection`,
          text: `Check out my personal recipe collection on Mom's Yums! I have ${recipes.length} recipes saved.`,
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

  const filteredRecipes = recipes.filter(recipe => {
    // Category filter
    if (selectedCategory && recipe.category_id !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      return (
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/moms_yums_logo.svg"
                alt="Mom's Yums Logo"
                width={32}
                height={32}
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-xl text-[#C76572] font-calistoga">
                MOM&apos;S YUMS
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Profile Photo - Desktop Only */}
              <div className="hidden md:block">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <ProfilePhoto
                    src={
                      profileData?.avatar_url || user?.user_metadata?.avatar_url
                    }
                    size="md"
                    displayName={
                      profileData?.display_name ||
                      profileData?.username ||
                      user?.user_metadata?.display_name ||
                      user?.user_metadata?.username ||
                      user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0]
                    }
                  />
                  <span className="text-sm text-gray-600 hover:text-[#C76572] transition-colors">
                    {profileData?.display_name ||
                      profileData?.username ||
                      user?.user_metadata?.display_name ||
                      user?.user_metadata?.username ||
                      user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0]}
                  </span>
                </Link>
              </div>

              {/* Mobile Layout - Username and Sign Out on separate lines */}
              <div className="md:hidden flex flex-col items-end space-y-1">
                <div className="flex items-center space-x-2 mb-1">
                  <ProfilePhoto
                    src={
                      profileData?.avatar_url || user?.user_metadata?.avatar_url
                    }
                    size="sm"
                    displayName={
                      profileData?.display_name ||
                      profileData?.username ||
                      user?.user_metadata?.display_name ||
                      user?.user_metadata?.username ||
                      user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0]
                    }
                  />
                  <Link
                    href="/profile"
                    className="text-sm text-gray-600 hover:text-[#C76572] transition-colors font-medium">
                    {profileData?.display_name ||
                      profileData?.username ||
                      user?.user_metadata?.display_name ||
                      user?.user_metadata?.username ||
                      user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0]}
                  </Link>
                </div>
                <button
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  Sign Out
                </button>
              </div>

              {/* Desktop Sign Out Button */}
              <div className="hidden md:block">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:mt-[10px] lg:mb-[10px]">
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

        {/* Share Collection Button */}
        <div className="mb-6">
          <button
            onClick={handleShareRecipeBook}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
            title="Share my recipe collection">
            <Share2 className="h-4 w-4" />
            Share My Recipe Collection
          </button>
        </div>

        {/* Page Heading */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <ProfilePhoto
              src={profileData?.avatar_url || user?.user_metadata?.avatar_url}
              size="lg"
              displayName={
                profileData?.display_name ||
                profileData?.username ||
                user?.user_metadata?.display_name ||
                user?.user_metadata?.username ||
                user?.user_metadata?.full_name ||
                user?.email?.split('@')[0]
              }
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profileData?.display_name ||
                  profileData?.username ||
                  user?.user_metadata?.display_name ||
                  user?.user_metadata?.username ||
                  user?.user_metadata?.full_name ||
                  user?.email?.split('@')[0]}
                &apos;s Recipe Collection
              </h1>
              <p className="text-lg text-gray-600">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your
                collection
              </p>
            </div>
          </div>
        </div>

        {/* Search and Category Filters */}
        <div className="mb-8 space-y-6">
          {/* Search */}
          <div>
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

          {/* Category Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Filter by Category
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === null
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'text-white shadow-md'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === category.id
                        ? category.color
                        : category.color + '20',
                    color:
                      selectedCategory === category.id
                        ? 'white'
                        : category.color,
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
        </div>

        {/* Recipe Count and List */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredRecipes.length} of {recipes.length} recipes
            {selectedCategory &&
              ` in ${
                categories.find(c => c.id === selectedCategory)?.display_name
              }`}
          </p>
        </div>

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
