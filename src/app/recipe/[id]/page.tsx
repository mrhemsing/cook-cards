import { supabase } from '@/lib/supabase';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RecipeClient from './RecipeClient';

export default async function SharedRecipePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch data server-side
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

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
            Go to Taste Legacy
          </Link>
        </div>
      </div>
    );
  }

  return <RecipeClient recipe={recipe} />;
}
