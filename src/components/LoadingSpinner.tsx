'use client';

import { useState, useEffect } from 'react';

export default function LoadingSpinner() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <div className="text-lg text-gray-600 font-medium">
          Loading{dots}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Please wait while we set up your recipe collection
        </div>
      </div>
    </div>
  );
}
