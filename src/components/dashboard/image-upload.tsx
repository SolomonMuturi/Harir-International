'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
}

export function ImageUpload({ onImageSelect, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setFileName(file.name);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Call parent handler
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="image-upload"
        disabled={isLoading}
      />
      
      {preview ? (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              {fileName}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={isLoading}
            >
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isLoading ? (
                <Upload className="w-6 h-6 text-primary animate-pulse" />
              ) : (
                <Camera className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-700">
                {isLoading ? 'Uploading...' : 'Click to upload image'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Upload pictorial evidence (Max 5MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}