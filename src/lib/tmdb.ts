import axios from 'axios';
import type { Movie, TVShow, Genre, Season, Episode, TMDBSearchResponse } from '@/types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// This will be set from storage
let TMDB_API_KEY = '';

export const setTMDBApiKey = (key: string) => {
  TMDB_API_KEY = key;
};

export const getTMDBApiKey = () => {
  return TMDB_API_KEY;
};

// Validate TMDB API Key
export const validateTMDBApiKey = async (key: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/configuration`, {
      params: { api_key: key }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
});

tmdbApi.interceptors.request.use((config) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }
  
  config.params = {
    ...config.params,
    api_key: TMDB_API_KEY,
  };
  return config;
});

export const getTMDBImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-poster.jpg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const searchMovies = async (query: string, page: number = 1): Promise<TMDBSearchResponse<Movie>> => {
  const response = await tmdbApi.get('/search/movie', {
    params: { query, page }
  });
  return response.data;
};

export const searchTVShows = async (query: string, page: number = 1): Promise<TMDBSearchResponse<TVShow>> => {
  const response = await tmdbApi.get('/search/tv', {
    params: { query, page }
  });
  return response.data;
};

export const getMovieDetails = async (id: number): Promise<Movie> => {
  const response = await tmdbApi.get(`/movie/${id}`);
  return response.data;
};

export const getTVShowDetails = async (id: number): Promise<TVShow> => {
  const response = await tmdbApi.get(`/tv/${id}`);
  return response.data;
};

export const getTVShowSeasons = async (id: number): Promise<Season[]> => {
  const response = await tmdbApi.get(`/tv/${id}`);
  return response.data.seasons || [];
};

export const getSeasonEpisodes = async (showId: number, seasonNumber: number): Promise<Episode[]> => {
  const response = await tmdbApi.get(`/tv/${showId}/season/${seasonNumber}`);
  return response.data.episodes || [];
};

export const getMovieGenres = async (): Promise<Genre[]> => {
  const response = await tmdbApi.get('/genre/movie/list');
  return response.data.genres;
};

export const getTVGenres = async (): Promise<Genre[]> => {
  const response = await tmdbApi.get('/genre/tv/list');
  return response.data.genres;
};

export const getPopularMovies = async (page: number = 1): Promise<TMDBSearchResponse<Movie>> => {
  const response = await tmdbApi.get('/movie/popular', {
    params: { page }
  });
  return response.data;
};

export const getPopularTVShows = async (page: number = 1): Promise<TMDBSearchResponse<TVShow>> => {
  const response = await tmdbApi.get('/tv/popular', {
    params: { page }
  });
  return response.data;
};

export const getTrendingMovies = async (): Promise<TMDBSearchResponse<Movie>> => {
  const response = await tmdbApi.get('/trending/movie/week');
  return response.data;
};

export const getTrendingTVShows = async (): Promise<TMDBSearchResponse<TVShow>> => {
  const response = await tmdbApi.get('/trending/tv/week');
  return response.data;
};