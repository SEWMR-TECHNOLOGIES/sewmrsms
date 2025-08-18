// components/ui/upload-progress.tsx
import React from 'react';
import { Progress } from './progress';

interface UploadProgressProps {
  message?: string;
  progress: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  message = 'Uploading...',
  progress,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
};
