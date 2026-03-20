
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
}

export function StarRating({ rating, maxRating = 5, size = 16, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'transition-colors',
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
          )}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
