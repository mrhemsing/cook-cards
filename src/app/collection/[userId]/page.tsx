import { supabase, supabaseAdmin } from '@/lib/supabase';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CollectionClient from './CollectionClient';

export default async function SharedCollectionPage({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Fetch data server-side
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !recipes || recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ChefHat className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Collection Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This recipe collection may have been deleted or is no longer
            available.
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

  // Get user profile information using admin client
  let displayName = 'User';
  try {
    const { data: userProfile } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (userProfile?.user) {
      displayName =
        userProfile.user.user_metadata?.full_name ||
        userProfile.user.email?.split('@')[0] ||
        'User';
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Fallback to extracting from email if available
    const userEmail = recipes[0]?.user_id || '';
    if (userEmail.includes('@')) {
      displayName = userEmail.split('@')[0];
    }
  }

  return <CollectionClient recipes={recipes} displayName={displayName} />;
}
