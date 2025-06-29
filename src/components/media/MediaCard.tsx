import React, { useState, useEffect } from 'react';
import { Star, Calendar, Plus, Check, Play, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { getTMDBImageUrl } from '@/lib/tmdb';
import type { Movie, TVShow, MediaType } from '@/types';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

interface MediaCardProps {
  item: Movie | TVShow;
  type: MediaType;
  onAddToWatchlist?: () => void;
  onMarkWatched?: () => void;
  onRate?: (rating: number) => void;
  isInWatchlist?: boolean;
  isWatched?: boolean;
  userRating?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  type,
  onAddToWatchlist,
  onMarkWatched,
  onRate,
  isInWatchlist: propIsInWatchlist,
  isWatched: propIsWatched,
  userRating,
}) => {
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(propIsInWatchlist || false);
  const [isWatched, setIsWatched] = useState(propIsWatched || false);
  const [isLoading, setIsLoading] = useState(false);

  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'TBA';

  // Check if item is in watchlist or watched when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        const [watchlistItems, watchedMovies, watchedShows] = await Promise.all([
          storage.getWatchlist(user.id),
          storage.getWatchedMovies(user.id),
          storage.getWatchedShows(user.id)
        ]);

        // Check if in watchlist
        const inWatchlist = watchlistItems.some(
          w => w.item_id === item.id && w.type === type
        );
        setIsInWatchlist(inWatchlist);

        // Check if watched
        let watched = false;
        if (type === 'movie') {
          watched = watchedMovies.some(m => m.movie.id === item.id);
        } else {
          watched = watchedShows.some(s => s.show.id === item.id);
        }
        setIsWatched(watched);
      } catch (error) {
        console.error('Failed to check item status:', error);
      }
    };

    checkStatus();
  }, [user, item.id, type]);

  const handleAddToWatchlist = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
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
      setIsInWatchlist(true);
      onAddToWatchlist?.();
      toast.success('Added to watchlist!');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      toast.error('Failed to add to watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkWatched = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      if (type === 'movie') {
        const watchedMovie = {
          id: Date.now(),
          movie: item as Movie,
          rating: 0,
          watched_date: new Date().toISOString(),
          user_id: user.id,
        };
        await storage.addWatchedMovie(watchedMovie);
      } else {
        const watchedShow = {
          id: Date.now(),
          show: item as TVShow,
          rating: 0,
          status: 'completed' as const,
          watched_episodes: [],
          user_id: user.id,
          updated_date: new Date().toISOString(),
        };
        await storage.addWatchedShow(watchedShow);
      }
      
      // Remove from watchlist if it was there
      if (isInWatchlist) {
        await storage.removeFromWatchlist(item.id, type, user.id);
        setIsInWatchlist(false);
      }
      
      setIsWatched(true);
      onMarkWatched?.();
      toast.success('Marked as watched!');
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      toast.error('Failed to mark as watched');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) return;
    
    try {
      if (type === 'movie') {
        await storage.updateMovieRating(item.id, user.id, rating);
      } else {
        // For TV shows, we'd need to implement updateShowRating
        // For now, we'll just call the onRate callback
      }
      
      onRate?.(rating);
      toast.success(`Rated ${rating} stars!`);
    } catch (error) {
      console.error('Failed to update rating:', error);
      toast.error('Failed to update rating');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={getTMDBImageUrl(item.poster_path)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 mb-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm font-medium">
                {item.vote_average.toFixed(1)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {!isInWatchlist && !isWatched && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAddToWatchlist}
                  disabled={isLoading}
                  className="flex-1 h-8 bg-white/90 hover:bg-white text-slate-900"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isLoading ? 'Adding...' : 'Watchlist'}
                </Button>
              )}
              
              {isInWatchlist && !isWatched && (
                <Button
                  size="sm"
                  onClick={handleMarkWatched}
                  disabled={isLoading}
                  className="flex-1 h-8 bg-green-600/90 hover:bg-green-700/90"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isLoading ? 'Adding...' : 'Watched'}
                </Button>
              )}
              
              {isWatched && (
                <Badge variant="secondary" className="bg-green-500/90 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Watched
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span>{year}</span>
            <Badge variant="outline" className="text-xs bg-white/95 dark:bg-slate-700/95">
              {type === 'movie' ? 'Movie' : 'TV Show'}
            </Badge>
          </div>
          
          {item.overview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {item.overview}
            </p>
          )}
          
          {userRating !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Your rating:</span>
              <StarRating rating={userRating} readonly size="sm" />
            </div>
          )}
          
          {isWatched && userRating === undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rate:</span>
              <StarRating 
                rating={0} 
                onRatingChange={handleRating}
                size="sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};