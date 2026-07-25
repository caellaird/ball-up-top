import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ListSkeleton({ count = 3, avatar = true }) {
  return (
    <div className="space-y-2 px-4 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-3xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            {avatar && <Skeleton className="w-11 h-11 rounded-full" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mt-3" />
          <Skeleton className="h-3 w-2/3 mt-1" />
        </div>
      ))}
    </div>
  );
}