'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfilePhotoProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  displayName?: string;
}

export default function ProfilePhoto({
  src,
  alt = 'Profile photo',
  size = 'md',
  className = '',
  displayName = ''
}: ProfilePhotoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  // If there's no src, image error, or src is empty, show the placeholder
  const shouldShowPlaceholder =
    !src || imageError || (typeof src === 'string' && src.trim() === '');

  // Get the first letter of the display name for the placeholder
  const getInitial = () => {
    if (!displayName || displayName.trim() === '') return '?';
    return displayName.trim().charAt(0).toUpperCase();
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center ${className}`}>
      {!shouldShowPlaceholder ? (
        <Image
          src={src}
          alt={alt}
          width={parseInt(sizeClasses[size].split('-')[1]) * 4}
          height={parseInt(sizeClasses[size].split('-')[1]) * 4}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      ) : (
        <div className="flex items-center justify-center text-gray-600 font-semibold">
          <span className={textSizes[size]}>{getInitial()}</span>
        </div>
      )}
    </div>
  );
}
