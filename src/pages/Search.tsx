import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaFilters } from '@/components/filters/MediaFilters';
import { useSearchMovies, useSearchTVShows, useMovieGenres, useTVGenres } from '@/hooks/useMovies';
import { motion } from 'framer-motion';
import type { SearchFilters } from '@/types';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    genre: 'all',
    year: 'all',
    sort_by: 'popularity.desc',
  });

  const { data: movieGenres } = useMovieGenres();
  const { data: tvGenres } = useTVGenres();
  
  const { data: movieResults, isLoading: moviesLoading } = useSearchMovies(
    debouncedQuery,
    debouncedQuery.length > 0
  );
  
  const { data: showResults, isLoading: showsLoading } = useSearchTVShows(
    debouncedQuery,
    debouncedQuery.length > 0
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
  };

  const genres = filters.type === 'movie' ? movieGenres : 
                filters.type === 'tv' ? tvGenres : 
                [...(movieGenres || []), ...(tvGenres || [])];

  return (
    <div className="container px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Discover</h1>
        <p className="text-muted-foreground">
          Search for movies and TV shows to add to your collection
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for movies and TV shows..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 bg-slate-50/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 bg-red-600/95 hover:bg-red-700/95">Search</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
          <CardContent className="p-6">
            <MediaFilters
              filters={filters}
              onFiltersChange={setFilters}
              genres={genres}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {debouncedQuery ? (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                Search results for "{debouncedQuery}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-slate-100/95 dark:bg-slate-800/95">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white/95 dark:data-[state=active]:bg-slate-700/95">All Results</TabsTrigger>
                  <TabsTrigger value="movies" className="data-[state=active]:bg-white/95 dark:data-[state=active]:bg-slate-700/95">
                    Movies ({movieResults?.total_results || 0})
                  </TabsTrigger>
                  <TabsTrigger value="shows" className="data-[state=active]:bg-white/95 dark:data-[state=active]:bg-slate-700/95">
                    TV Shows ({showResults?.total_results || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6">
                  <div className="space-y-8">
                    {movieResults?.results && movieResults.results.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Movies</h3>
                        <MediaGrid
                          items={movieResults.results.slice(0, 10)}
                          type="movie"
                          loading={moviesLoading}
                        />
                      </div>
                    )}
                    
                    {showResults?.results && showResults.results.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">TV Shows</h3>
                        <MediaGrid
                          items={showResults.results.slice(0, 10)}
                          type="tv"
                          loading={showsLoading}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="movies" className="mt-6">
                  <MediaGrid
                    items={movieResults?.results || []}
                    type="movie"
                    loading={moviesLoading}
                  />
                </TabsContent>
                
                <TabsContent value="shows" className="mt-6">
                  <MediaGrid
                    items={showResults?.results || []}
                    type="tv"
                    loading={showsLoading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a movie or TV show title to get started
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};