import React from 'react';
import { MediaCard } from './MediaCard';
import type { Movie, TVShow, MediaType } from '@/types';

interface MediaGridProps {
  items: (Movie | TVShow)[];
  type: MediaType;
  loading?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ items, type, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No results found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <MediaCard
          key={`${type}-${item.id}`}
          item={item}
          type={type}
        />
      ))}
    </div>
  );
};