// components/ui/Loader.tsx
import React from 'react';

interface LoaderProps {
  className?: string; // optional to adjust size/position
  overlay?: boolean; // if true, show as absolute overlay
}

export const Loader: React.FC<LoaderProps> = ({ className = '', overlay = false }) => {
  const base = (
    <div
      className={`animate-spin rounded-full h-16 w-16 border-t-4 border-solid border-gray-200 ${className}`}
      style={{ borderTopColor: 'hsl(6, 99%, 64%)' }}
    ></div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
        {base}
      </div>
    );
  }

  return base;
};
