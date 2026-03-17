"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, alt = "Avatar", fallback, className = "", size = "md" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9", 
    lg: "h-20 w-20"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn('Avatar image failed to load:', src);
    setImageError(true);
    setIsLoading(false);
  };

  const shouldShowImage = src && !imageError && !isLoading;
  const shouldShowFallback = fallback && (imageError || !src);

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden ${className}`}>
      {src && !imageError && (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      )}
      
      {shouldShowFallback && (
        <span className={`font-medium ${textSizes[size]} text-slate-600 dark:text-slate-300`}>
          {fallback}
        </span>
      )}
      
      {!shouldShowImage && !shouldShowFallback && (
        <User className={`${iconSizes[size]} text-slate-400`} />
      )}
    </div>
  );
}