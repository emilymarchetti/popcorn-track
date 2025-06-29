import React, { useState, useEffect } from 'react';
import { Play, Eye, Clock, Plus, Star, CheckCircle, Calendar, Key, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuickSearchModal } from '@/components/modals/QuickSearchModal';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { getTMDBImageUrl, setTMDBApiKey } from '@/lib/tmdb';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { WatchedMovie, WatchedShow, WatchlistItem } from '@/types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [watchedShows, setWatchedShows] = useState<WatchedShow[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  const loadData = async () => {
    if (user) {
      try {
        setLoading(true);
        const [movies, shows, list, apiKey] = await Promise.all([
          storage.getWatchedMovies(user.id),
          storage.getWatchedShows(user.id),
          storage.getWatchlist(user.id),
          storage.getTMDBApiKey()
        ]);
        
        setWatchedMovies(movies);
        setWatchedShows(shows);
        setWatchlist(list);
        
        // Set API key and update state
        if (apiKey) {
          setTMDBApiKey(apiKey);
          setHasApiKey(true);
        } else {
          setHasApiKey(false);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Listen for API key changes
  useEffect(() => {
    const checkApiKey = async () => {
      const apiKey = await storage.getTMDBApiKey();
      if (apiKey) {
        setTMDBApiKey(apiKey);
        setHasApiKey(true);
      } else {
        setHasApiKey(false);
      }
    };

    // Check API key when component mounts
    checkApiKey();

    // Listen for API key updates
    const handleApiKeyUpdate = () => {
      checkApiKey();
    };

    window.addEventListener('apiKeyUpdated', handleApiKeyUpdate);
    
    // Set up interval to check for API key changes every 3 seconds
    const interval = setInterval(checkApiKey, 3000);
    
    return () => {
      window.removeEventListener('apiKeyUpdated', handleApiKeyUpdate);
      clearInterval(interval);
    };
  }, []);

  const recentlyWatched = [
    ...watchedMovies.map(m => ({ ...m, type: 'movie' as const })),
    ...watchedShows.map(s => ({ ...s, type: 'tv' as const }))
  ]
    .sort((a, b) => new Date(b.watched_date || b.updated_date).getTime() - 
                    new Date(a.watched_date || a.updated_date).getTime())
    .slice(0, 8);

  const currentlyWatching = watchedShows.filter(show => show.status === 'watching').slice(0, 8);
  const upcomingWatchlist = watchlist.slice(0, 8);

  const markAsWatched = async (item: WatchlistItem) => {
    if (!user) return;
    
    try {
      if (item.type === 'movie' && item.movie) {
        const watchedMovie = {
          id: Date.now(),
          movie: item.movie,
          rating: 0,
          watched_date: new Date().toISOString(),
          user_id: user.id,
        };
        await storage.addWatchedMovie(watchedMovie);
        setWatchedMovies(await storage.getWatchedMovies(user.id));
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
        setWatchedShows(await storage.getWatchedShows(user.id));
      }
      
      await storage.removeFromWatchlist(item.item_id, item.type, user.id);
      setWatchlist(await storage.getWatchlist(user.id));
      toast.success('Moved to watched list!');
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      toast.error('Failed to update');
    }
  };

  const handleQuickSearchItemAdded = () => {
    // Reload watchlist data when an item is added
    loadData();
  };

  const quickStats = [
    {
      title: 'Total Watched',
      value: watchedMovies.length + watchedShows.length,
      icon: Eye,
      color: 'text-blue-600',
    },
    {
      title: 'Currently Watching',
      value: currentlyWatching.length,
      icon: Play,
      color: 'text-green-600',
    },
    {
      title: 'In Watchlist',
      value: watchlist.length,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'This Month',
      value: recentlyWatched.filter(item => {
        const date = new Date(item.watched_date || item.updated_date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      color: 'text-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what you're watching.
        </p>
      </motion.div>

      {/* TMDB API Key Warning */}
      {!hasApiKey && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Alert className="bg-amber-50/95 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
            <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">
                  TMDB API Key Required
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  To search and discover movies and TV shows, you need to configure your TMDB API key.{' '}
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Get your free API key here
                  </a>
                </p>
              </div>
              <Button
                asChild
                size="sm"
                className="ml-4 bg-amber-600/95 hover:bg-amber-700/95 text-white"
              >
                <a href="/settings">
                  <SettingsIcon className="h-4 w-4 mr-1" />
                  Configure
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + (hasApiKey ? 0.2 : 0.3) }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content - Expanded Layout */}
      <div className="space-y-6">
        {/* Currently Watching - Full Width Expanded Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasApiKey ? 0.6 : 0.7 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Currently Watching
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentlyWatching.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Play className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <p className="text-xl font-medium mb-3">No shows in progress</p>
                  <p className="text-sm">Start watching a TV series to see it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentlyWatching.map((show) => (
                    <div key={show.id} className="flex flex-col gap-4 p-5 rounded-xl bg-slate-50/95 dark:bg-slate-800/95 hover:bg-slate-100/95 dark:hover:bg-slate-700/95 transition-all duration-300 hover:shadow-md">
                      <div className="w-full aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={getTMDBImageUrl(show.show.poster_path, 'w300')}
                          alt={show.show.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base line-clamp-2 leading-tight">{show.show.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs bg-white/95 dark:bg-slate-700/95">TV Show</Badge>
                          {show.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{show.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{show.watched_episodes.length} episodes</span>
                          </div>
                          <Progress 
                            value={show.show.number_of_episodes ? 
                              (show.watched_episodes.length / show.show.number_of_episodes) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Watchlist - Full Width Expanded Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasApiKey ? 0.7 : 0.8 }}
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Watchlist
                </div>
                {hasApiKey && (
                  <Button 
                    onClick={() => setShowQuickSearch(true)}
                    size="sm"
                    variant="outline" 
                    className="bg-white/95 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-700/95"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Content
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingWatchlist.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Plus className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <p className="text-xl font-medium mb-3">Your watchlist is empty</p>
                  <p className="text-sm mb-6">Add movies and TV shows you want to watch later</p>
                  {hasApiKey ? (
                    <Button 
                      onClick={() => setShowQuickSearch(true)}
                      className="bg-red-600/95 hover:bg-red-700/95"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Content
                    </Button>
                  ) : (
                    <Button asChild className="bg-red-600/95 hover:bg-red-700/95" size="lg">
                      <a href="/settings">Configure API Key</a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {upcomingWatchlist.map((item) => (
                      <div key={item.id} className="flex flex-col gap-4 p-5 rounded-xl bg-slate-50/95 dark:bg-slate-800/95 hover:bg-slate-100/95 dark:hover:bg-slate-700/95 transition-all duration-300 hover:shadow-md">
                        <div className="w-full aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                          <img
                            src={getTMDBImageUrl(item.movie?.poster_path || item.show?.poster_path, 'w300')}
                            alt={item.movie?.title || item.show?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base line-clamp-2 leading-tight">
                            {item.movie?.title || item.show?.name}
                          </h4>
                          <Badge variant="outline" className="text-xs bg-white/95 dark:bg-slate-700/95 w-fit">
                            {item.type === 'movie' ? 'Movie' : 'TV Show'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => markAsWatched(item)}
                            className="w-full bg-green-600/95 hover:bg-green-700/95"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Watched
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button asChild variant="outline" className="flex-1 bg-white/95 dark:bg-slate-800/95 hover:bg-slate-50/95 dark:hover:bg-slate-700/95">
                      <a href="/watchlist">View All Watchlist ({watchlist.length} items)</a>
                    </Button>
                    {hasApiKey && (
                      <Button 
                        onClick={() => setShowQuickSearch(true)}
                        className="bg-red-600/95 hover:bg-red-700/95"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recently Watched - Full Width */}
        {recentlyWatched.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasApiKey ? 0.8 : 0.9 }}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Recently Watched
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recentlyWatched.map((item, index) => (
                    <div key={index} className="flex flex-col gap-4 p-5 rounded-xl bg-slate-50/95 dark:bg-slate-800/95 hover:bg-slate-100/95 dark:hover:bg-slate-700/95 transition-all duration-300 hover:shadow-md">
                      <div className="w-full aspect-[2/3] bg-muted rounded-lg overflow-hidden">
                        <img
                          src={getTMDBImageUrl(
                            item.type === 'movie' 
                              ? (item as WatchedMovie).movie.poster_path
                              : (item as WatchedShow).show.poster_path,
                            'w300'
                          )}
                          alt={
                            item.type === 'movie' 
                              ? (item as WatchedMovie).movie.title
                              : (item as WatchedShow).show.name
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base line-clamp-2 leading-tight">
                          {item.type === 'movie' 
                            ? (item as WatchedMovie).movie.title
                            : (item as WatchedShow).show.name
                          }
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs bg-white/95 dark:bg-slate-700/95">
                            {item.type === 'movie' ? 'Movie' : 'TV Show'}
                          </Badge>
                          {item.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{item.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Watched on {new Date(item.watched_date || item.updated_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Quick Search Modal */}
      <QuickSearchModal
        open={showQuickSearch}
        onOpenChange={setShowQuickSearch}
        onItemAdded={handleQuickSearchItemAdded}
      />
    </div>
  );
};