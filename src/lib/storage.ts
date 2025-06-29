import type { WatchedMovie, WatchedShow, WatchlistItem, User, Movie, TVShow } from '@/types';
import { executeQuery, executeNonQuery, initDatabase } from './database';

export const storage = {
  // Initialize database
  init: async () => {
    await initDatabase();
  },

  // User data
  setUser: async (user: User) => {
    await executeNonQuery(
      `INSERT OR REPLACE INTO users (id, login, avatar_url, name) 
       VALUES (?, ?, ?, ?)`,
      [user.id, user.login, user.avatar_url, user.name]
    );
  },

  getUser: async (): Promise<User | null> => {
    const users = await executeQuery('SELECT * FROM users LIMIT 1');
    return users.length > 0 ? users[0] as User : null;
  },

  getAllProfiles: async (): Promise<User[]> => {
    const users = await executeQuery('SELECT * FROM users ORDER BY name');
    return users as User[];
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);
    
    await executeNonQuery(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );
  },

  deleteUser: async (userId: string) => {
    // Delete user and all their data
    await executeNonQuery('DELETE FROM watched_movies WHERE user_id = ?', [userId]);
    await executeNonQuery('DELETE FROM watched_shows WHERE user_id = ?', [userId]);
    await executeNonQuery('DELETE FROM watchlist WHERE user_id = ?', [userId]);
    await executeNonQuery('DELETE FROM users WHERE id = ?', [userId]);
  },

  // TMDB API Key - Global for all users
  setTMDBApiKey: async (key: string) => {
    await executeNonQuery(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) 
       VALUES ('tmdb_api_key', ?, CURRENT_TIMESTAMP)`,
      [key]
    );
  },

  getTMDBApiKey: async (): Promise<string | null> => {
    const results = await executeQuery(
      'SELECT value FROM settings WHERE key = ?',
      ['tmdb_api_key']
    );
    return results.length > 0 ? results[0].value : null;
  },

  // Cache movie data
  cacheMovie: async (movie: Movie) => {
    await executeNonQuery(
      `INSERT OR REPLACE INTO movies 
       (id, title, overview, poster_path, backdrop_path, release_date, vote_average, genre_ids, genres)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie.id,
        movie.title,
        movie.overview,
        movie.poster_path,
        movie.backdrop_path,
        movie.release_date,
        movie.vote_average,
        JSON.stringify(movie.genre_ids || []),
        JSON.stringify(movie.genres || [])
      ]
    );
  },

  // Cache TV show data
  cacheTVShow: async (show: TVShow) => {
    await executeNonQuery(
      `INSERT OR REPLACE INTO tv_shows 
       (id, name, overview, poster_path, backdrop_path, first_air_date, vote_average, genre_ids, genres, number_of_seasons, number_of_episodes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        show.id,
        show.name,
        show.overview,
        show.poster_path,
        show.backdrop_path,
        show.first_air_date,
        show.vote_average,
        JSON.stringify(show.genre_ids || []),
        JSON.stringify(show.genres || []),
        show.number_of_seasons,
        show.number_of_episodes
      ]
    );
  },

  // Get cached movie
  getCachedMovie: async (movieId: number): Promise<Movie | null> => {
    const results = await executeQuery('SELECT * FROM movies WHERE id = ?', [movieId]);
    if (results.length === 0) return null;
    
    const movie = results[0];
    return {
      ...movie,
      genre_ids: JSON.parse(movie.genre_ids || '[]'),
      genres: JSON.parse(movie.genres || '[]')
    } as Movie;
  },

  // Get cached TV show
  getCachedTVShow: async (showId: number): Promise<TVShow | null> => {
    const results = await executeQuery('SELECT * FROM tv_shows WHERE id = ?', [showId]);
    if (results.length === 0) return null;
    
    const show = results[0];
    return {
      ...show,
      genre_ids: JSON.parse(show.genre_ids || '[]'),
      genres: JSON.parse(show.genres || '[]')
    } as TVShow;
  },

  // Watched Movies
  getWatchedMovies: async (userId: string): Promise<WatchedMovie[]> => {
    const results = await executeQuery(
      `SELECT wm.*, m.* FROM watched_movies wm
       JOIN movies m ON wm.movie_id = m.id
       WHERE wm.user_id = ?
       ORDER BY wm.watched_date DESC`,
      [userId]
    );

    return results.map(row => ({
      id: row.id,
      rating: row.rating,
      watched_date: row.watched_date,
      user_id: row.user_id,
      movie: {
        id: row.movie_id,
        title: row.title,
        overview: row.overview,
        poster_path: row.poster_path,
        backdrop_path: row.backdrop_path,
        release_date: row.release_date,
        vote_average: row.vote_average,
        genre_ids: JSON.parse(row.genre_ids || '[]'),
        genres: JSON.parse(row.genres || '[]')
      }
    }));
  },

  addWatchedMovie: async (movie: WatchedMovie) => {
    // Cache movie data first
    await storage.cacheMovie(movie.movie);
    
    // Add to watched movies
    await executeNonQuery(
      `INSERT OR REPLACE INTO watched_movies (user_id, movie_id, rating, watched_date)
       VALUES (?, ?, ?, ?)`,
      [movie.user_id, movie.movie.id, movie.rating, movie.watched_date]
    );
  },

  removeWatchedMovie: async (movieId: number, userId: string) => {
    await executeNonQuery(
      'DELETE FROM watched_movies WHERE movie_id = ? AND user_id = ?',
      [movieId, userId]
    );
  },

  updateMovieRating: async (movieId: number, userId: string, rating: number) => {
    await executeNonQuery(
      'UPDATE watched_movies SET rating = ? WHERE movie_id = ? AND user_id = ?',
      [rating, movieId, userId]
    );
  },

  // Watched Shows
  getWatchedShows: async (userId: string): Promise<WatchedShow[]> => {
    const results = await executeQuery(
      `SELECT ws.*, s.* FROM watched_shows ws
       JOIN tv_shows s ON ws.show_id = s.id
       WHERE ws.user_id = ?
       ORDER BY ws.updated_at DESC`,
      [userId]
    );

    return results.map(row => ({
      id: row.id,
      rating: row.rating,
      status: row.status,
      watched_episodes: JSON.parse(row.watched_episodes || '[]'),
      user_id: row.user_id,
      updated_date: row.updated_at,
      show: {
        id: row.show_id,
        name: row.name,
        overview: row.overview,
        poster_path: row.poster_path,
        backdrop_path: row.backdrop_path,
        first_air_date: row.first_air_date,
        vote_average: row.vote_average,
        genre_ids: JSON.parse(row.genre_ids || '[]'),
        genres: JSON.parse(row.genres || '[]'),
        number_of_seasons: row.number_of_seasons,
        number_of_episodes: row.number_of_episodes
      }
    }));
  },

  addWatchedShow: async (show: WatchedShow) => {
    // Cache show data first
    await storage.cacheTVShow(show.show);
    
    // Add to watched shows
    await executeNonQuery(
      `INSERT OR REPLACE INTO watched_shows (user_id, show_id, rating, status, watched_episodes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        show.user_id,
        show.show.id,
        show.rating,
        show.status,
        JSON.stringify(show.watched_episodes),
        show.updated_date
      ]
    );
  },

  updateWatchedShow: async (show: WatchedShow) => {
    await executeNonQuery(
      `UPDATE watched_shows 
       SET rating = ?, status = ?, watched_episodes = ?, updated_at = ?
       WHERE show_id = ? AND user_id = ?`,
      [
        show.rating,
        show.status,
        JSON.stringify(show.watched_episodes),
        show.updated_date,
        show.show.id,
        show.user_id
      ]
    );
  },

  removeWatchedShow: async (showId: number, userId: string) => {
    await executeNonQuery(
      'DELETE FROM watched_shows WHERE show_id = ? AND user_id = ?',
      [showId, userId]
    );
  },

  // Watchlist
  getWatchlist: async (userId: string): Promise<WatchlistItem[]> => {
    const results = await executeQuery(
      `SELECT w.*, 
              m.title as movie_title, m.overview as movie_overview, m.poster_path as movie_poster,
              m.backdrop_path as movie_backdrop, m.release_date, m.vote_average as movie_rating,
              m.genre_ids as movie_genre_ids, m.genres as movie_genres,
              s.name as show_name, s.overview as show_overview, s.poster_path as show_poster,
              s.backdrop_path as show_backdrop, s.first_air_date, s.vote_average as show_rating,
              s.genre_ids as show_genre_ids, s.genres as show_genres,
              s.number_of_seasons, s.number_of_episodes
       FROM watchlist w
       LEFT JOIN movies m ON w.item_type = 'movie' AND w.item_id = m.id
       LEFT JOIN tv_shows s ON w.item_type = 'tv' AND w.item_id = s.id
       WHERE w.user_id = ?
       ORDER BY w.added_date DESC`,
      [userId]
    );

    return results.map(row => ({
      id: row.id,
      type: row.item_type,
      item_id: row.item_id,
      added_date: row.added_date,
      user_id: row.user_id,
      movie: row.item_type === 'movie' ? {
        id: row.item_id,
        title: row.movie_title,
        overview: row.movie_overview,
        poster_path: row.movie_poster,
        backdrop_path: row.movie_backdrop,
        release_date: row.release_date,
        vote_average: row.movie_rating,
        genre_ids: JSON.parse(row.movie_genre_ids || '[]'),
        genres: JSON.parse(row.movie_genres || '[]')
      } : undefined,
      show: row.item_type === 'tv' ? {
        id: row.item_id,
        name: row.show_name,
        overview: row.show_overview,
        poster_path: row.show_poster,
        backdrop_path: row.show_backdrop,
        first_air_date: row.first_air_date,
        vote_average: row.show_rating,
        genre_ids: JSON.parse(row.show_genre_ids || '[]'),
        genres: JSON.parse(row.show_genres || '[]'),
        number_of_seasons: row.number_of_seasons,
        number_of_episodes: row.number_of_episodes
      } : undefined
    }));
  },

  addToWatchlist: async (item: WatchlistItem) => {
    // Cache the media data first
    if (item.movie) {
      await storage.cacheMovie(item.movie);
    }
    if (item.show) {
      await storage.cacheTVShow(item.show);
    }
    
    // Add to watchlist
    await executeNonQuery(
      `INSERT OR REPLACE INTO watchlist (user_id, item_type, item_id, added_date)
       VALUES (?, ?, ?, ?)`,
      [item.user_id, item.type, item.item_id, item.added_date]
    );
  },

  removeFromWatchlist: async (itemId: number, type: 'movie' | 'tv', userId: string) => {
    await executeNonQuery(
      'DELETE FROM watchlist WHERE item_id = ? AND item_type = ? AND user_id = ?',
      [itemId, type, userId]
    );
  },

  // Clear all data for a specific user
  clearUserData: async (userId: string) => {
    const tables = [
      'watched_movies',
      'watched_shows', 
      'watchlist'
    ];
    
    for (const table of tables) {
      await executeNonQuery(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
    }
  },

  // Clear all data
  clear: async () => {
    const tables = [
      'watched_movies',
      'watched_shows', 
      'watchlist',
      'settings',
      'movies',
      'tv_shows',
      'users'
    ];
    
    for (const table of tables) {
      await executeNonQuery(`DELETE FROM ${table}`);
    }
  }
};