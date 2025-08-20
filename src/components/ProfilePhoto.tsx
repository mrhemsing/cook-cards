'use client';

import { User, Camera } from 'lucide-react';
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
  className = ''
}: ProfilePhotoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={parseInt(sizeClasses[size].split('-')[1]) * 4}
          height={parseInt(sizeClasses[size].split('-')[1]) * 4}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Camera className={`${iconSizes[size]} mb-1`} />
          <div className="text-xs font-medium">Add Photo</div>
        </div>
      )}
    </div>
  );
}
