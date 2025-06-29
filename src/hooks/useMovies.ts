import { useQuery } from '@tanstack/react-query';
import { 
  searchMovies, 
  searchTVShows, 
  getMovieDetails, 
  getTVShowDetails,
  getPopularMovies,
  getPopularTVShows,
  getTrendingMovies,
  getTrendingTVShows,
  getMovieGenres,
  getTVGenres
} from '@/lib/tmdb';

export const useSearchMovies = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['search', 'movies', query],
    queryFn: () => searchMovies(query),
    enabled: enabled && query.length > 0,
  });
};

export const useSearchTVShows = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['search', 'tv', query],
    queryFn: () => searchTVShows(query),
    enabled: enabled && query.length > 0,
  });
};

export const useMovieDetails = (id: number) => {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
    enabled: !!id,
  });
};

export const useTVShowDetails = (id: number) => {
  return useQuery({
    queryKey: ['tv', id],
    queryFn: () => getTVShowDetails(id),
    enabled: !!id,
  });
};

export const usePopularMovies = () => {
  return useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => getPopularMovies(),
  });
};

export const usePopularTVShows = () => {
  return useQuery({
    queryKey: ['tv', 'popular'],
    queryFn: () => getPopularTVShows(),
  });
};

export const useTrendingMovies = () => {
  return useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrendingMovies(),
  });
};

export const useTrendingTVShows = () => {
  return useQuery({
    queryKey: ['tv', 'trending'],
    queryFn: () => getTrendingTVShows(),
  });
};

export const useMovieGenres = () => {
  return useQuery({
    queryKey: ['genres', 'movies'],
    queryFn: () => getMovieGenres(),
  });
};

export const useTVGenres = () => {
  return useQuery({
    queryKey: ['genres', 'tv'],
    queryFn: () => getTVGenres(),
  });
};