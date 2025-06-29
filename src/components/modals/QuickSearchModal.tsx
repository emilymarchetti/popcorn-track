import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Film, Tv, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchMovies, useSearchTVShows } from '@/hooks/useMovies';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Movie, TVShow, MediaType } from '@/types';

interface QuickSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded?: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  open,
  onOpenChange,
  onItemAdded,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const { data: movieResults, isLoading: moviesLoading } = useSearchMovies(
    debouncedQuery,
    debouncedQuery.length > 0 && open
  );
  
  const { data: showResults, isLoading: showsLoading } = useSearchTVShows(
    debouncedQuery,
    debouncedQuery.length > 0 && open
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
      setAddingItems(new Set());
    }
  }, [open]);

  const handleAddToWatchlist = async (item: Movie | TVShow, type: MediaType) => {
    if (!user) return;
    
    const itemKey = `${type}-${item.id}`;
    if (addingItems.has(itemKey)) return;

    setAddingItems(prev => new Set(prev).add(itemKey));
    
    try {
      const watchlistItem = {
        id: Date.now(),
        type,
        item_id: item.id,
        movie: type === 'movie' ? item as Movie : undefined,
        show: type === 'tv' ? item as TVShow : undefined,
        added_date: new Date().toISOString(),
        user_id: user.id,
      };
      
      await storage.addToWatchlist(watchlistItem);
      
      const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
      toast.success(`${title} added to watchlist!`);
      onItemAdded?.();
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      toast.error('Failed to add to watchlist');
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const allResults = [
    ...(movieResults?.results?.slice(0, 5).map(movie => ({ ...movie, type: 'movie' as const })) || []),
    ...(showResults?.results?.slice(0, 5).map(show => ({ ...show, type: 'tv' as const })) || [])
  ].slice(0, 8);

  const isLoading = moviesLoading || showsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Search className="h-5 w-5" />
            Quick Add to Watchlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Search for movies and TV shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-slate-50/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {!debouncedQuery ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search for movies and TV shows</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-slate-100/95 dark:bg-slate-800/95">
                    <div className="w-12 h-16 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
                      <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allResults.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{debouncedQuery}"</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-2">
                  {allResults.map((item, index) => {
                    const title = item.type === 'movie' ? (item as Movie).title : (item as TVShow).name;
                    const releaseDate = item.type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;
                    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'TBA';
                    const itemKey = `${item.type}-${item.id}`;
                    const isAdding = addingItems.has(itemKey);

                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-all duration-200 bg-slate-50/95 dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
                                <img
                                  src={getTMDBImageUrl(item.poster_path, 'w200')}
                                  alt={title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {title}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-white/95 dark:bg-slate-700/95 text-slate-700 dark:text-slate-300"
                                  >
                                    {item.type === 'movie' ? (
                                      <><Film className="h-3 w-3 mr-1" />Movie</>
                                    ) : (
                                      <><Tv className="h-3 w-3 mr-1" />TV Show</>
                                    )}
                                  </Badge>
                                  <span>{year}</span>
                                  {item.vote_average > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                      <span>{item.vote_average.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                                {item.overview && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {item.overview}
                                  </p>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={() => handleAddToWatchlist(item, item.type)}
                                disabled={isAdding}
                                className="shrink-0 bg-red-600/95 hover:bg-red-700/95 text-white"
                              >
                                {isAdding ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    Adding...
                                  </div>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Search powered by TMDB
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white/95 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-700/95 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};