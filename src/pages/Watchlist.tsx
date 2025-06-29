import React, { useState, useEffect } from 'react';
import { Shuffle, Filter, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaFilters } from '@/components/filters/MediaFilters';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { WatchlistItem, SearchFilters, Movie, TVShow } from '@/types';

export const Watchlist: React.FC = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [randomPick, setRandomPick] = useState<WatchlistItem | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    genre: 'all',
    year: 'all',
    sort_by: 'popularity.desc',
  });

  useEffect(() => {
    const loadWatchlist = async () => {
      if (user) {
        const watchlistData = await storage.getWatchlist(user.id);
        setWatchlist(watchlistData);
      }
    };
    
    loadWatchlist();
  }, [user]);

  const filteredWatchlist = watchlist.filter(item => {
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    
    if (filters.year !== 'all') {
      const releaseDate = item.movie?.release_date || item.show?.first_air_date;
      if (releaseDate) {
        const year = new Date(releaseDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        
        switch (filters.year) {
          case '-80s':
            if (year >= 1980) return false;
            break;
          case '80s':
            if (decade !== 1980) return false;
            break;
          case '90s':
            if (decade !== 1990) return false;
            break;
          case '00s':
            if (decade !== 2000) return false;
            break;
          case '10s':
            if (decade !== 2010) return false;
            break;
          case '2020+':
            if (year < 2020) return false;
            break;
        }
      }
    }
    
    return true;
  });

  const pickRandom = () => {
    const eligible = filteredWatchlist.length > 0 ? filteredWatchlist : watchlist;
    
    if (eligible.length === 0) {
      toast.error('Your watchlist is empty!');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const pick = eligible[randomIndex];
    setRandomPick(pick);
    
    const title = pick.movie?.title || pick.show?.name;
    toast.success(`Random pick: ${title}!`);
  };

  const removeFromWatchlist = async (itemId: number, type: 'movie' | 'tv') => {
    if (!user) return;
    
    await storage.removeFromWatchlist(itemId, type, user.id);
    const updatedWatchlist = await storage.getWatchlist(user.id);
    setWatchlist(updatedWatchlist);
    toast.success('Removed from watchlist');
  };

  const markAsWatched = async (item: WatchlistItem) => {
    if (!user) return;
    
    if (item.type === 'movie' && item.movie) {
      const watchedMovie = {
        id: Date.now(),
        movie: item.movie,
        rating: 0,
        watched_date: new Date().toISOString(),
        user_id: user.id,
      };
      await storage.addWatchedMovie(watchedMovie);
    } else if (item.type === 'tv' && item.show) {
      const watchedShow = {
        id: Date.now(),
        show: item.show,
        rating: 0,
        status: 'watching' as const,
        watched_episodes: [],
        user_id: user.id,
        updated_date: new Date().toISOString(),
      };
      await storage.addWatchedShow(watchedShow);
    }
    
    await removeFromWatchlist(item.item_id, item.type);
    toast.success('Moved to watched list!');
  };

  const getMediaItems = (): (Movie | TVShow)[] => {
    return filteredWatchlist.map(item => 
      item.movie || item.show!
    );
  };

  return (
    <div className="container px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Watchlist</h1>
            <p className="text-muted-foreground">
              {watchlist.length} items to watch
            </p>
          </div>
          
          <Button onClick={pickRandom} className="flex items-center gap-2 bg-red-600/95 hover:bg-red-700/95">
            <Shuffle className="h-4 w-4" />
            Random Pick
          </Button>
        </div>

        {randomPick && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50/95 dark:bg-red-900/30 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Shuffle className="h-5 w-5" />
                  Random Pick
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 bg-muted rounded-md overflow-hidden">
                    <img
                      src={`https://image.tmdb.org/t/p/w200${randomPick.movie?.poster_path || randomPick.show?.poster_path}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {randomPick.movie?.title || randomPick.show?.name}
                    </h3>
                    <Badge variant="outline" className="mb-2 bg-white/95 dark:bg-slate-700/95">
                      {randomPick.type === 'movie' ? 'Movie' : 'TV Show'}
                    </Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {randomPick.movie?.overview || randomPick.show?.overview}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => markAsWatched(randomPick)}
                      className="w-full bg-green-600/95 hover:bg-green-700/95"
                    >
                      Mark as Watched
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRandomPick(null)}
                      className="bg-white/95 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-700/95"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
          <CardContent className="p-6">
            <MediaFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Watchlist Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {watchlist.length === 0 ? (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
              <p className="text-muted-foreground mb-4">
                Start adding movies and TV shows you want to watch later
              </p>
              <Button asChild className="bg-red-600/95 hover:bg-red-700/95">
                <a href="/search">Browse Content</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {filteredWatchlist.length !== watchlist.length && (
                      <span className="text-muted-foreground">
                        {filteredWatchlist.length} of {watchlist.length} items
                      </span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <MediaGrid
                  items={getMediaItems()}
                  type="movie" // This will be ignored since MediaCard handles both types
                />
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};