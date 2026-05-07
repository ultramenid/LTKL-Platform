import { useId } from 'react';

// Generic skeleton placeholder for tab content while data is loading
export function TabSkeleton() {
  const skeletonId = useId();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-8 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 w-48 bg-gray-100 rounded" />

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-64 bg-gray-50 rounded-xl" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-50 rounded-xl" />
          <div className="h-32 bg-gray-50 rounded-xl" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`${skeletonId}-stat-${index}`}
            className="h-24 bg-gray-50 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
