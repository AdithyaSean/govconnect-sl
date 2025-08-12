
"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
}

export function Rating({ rating, totalStars = 5, size = 16, className }: RatingProps) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;
  const emptyStars = totalStars - fullStars - (partialStar ? 1 : 0);

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" className="text-yellow-400" style={{ width: size, height: size }} />
      ))}
      {partialStar && (
         <div style={{ position: 'relative', width: size, height: size }}>
            <Star style={{ width: size, height: size }} className="text-yellow-400" />
            <div style={{ position: 'absolute', top: 0, left: 0, width: `${(rating % 1) * 100}%`, height: '100%', overflow: 'hidden' }}>
                <Star fill="currentColor" style={{ width: size, height: size }} className="text-yellow-400" />
            </div>
         </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="text-yellow-400" style={{ width: size, height: size }} />
      ))}
    </div>
  );
}
