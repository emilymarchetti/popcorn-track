export interface User {
  id: string;
  login: string;
  avatar_url: string;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Season {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface WatchedMovie {
  id: number;
  movie: Movie;
  rating: number;
  watched_date: string;
  user_id: string;
}

export interface WatchedShow {
  id: number;
  show: TVShow;
  rating: number;
  status: 'watching' | 'completed' | 'dropped';
  watched_episodes: number[];
  user_id: string;
  updated_date: string;
}

export interface WatchlistItem {
  id: number;
  type: 'movie' | 'tv';
  item_id: number;
  movie?: Movie;
  show?: TVShow;
  added_date: string;
  user_id: string;
}

export type MediaType = 'movie' | 'tv';

export interface SearchFilters {
  type: MediaType | 'all';
  genre: string;
  year: string;
  sort_by: string;
}

export interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}