import { supabase } from '../config/supabase';
import { getAllMovies as getStaticMovies, getMovieById as getStaticMovieById } from '../data/movies';
import { getAllTvShows as getStaticTvShows, getTvShowById as getStaticTvShowById } from '../data/tvShows';

// ============================================
// CONTENT SERVICE - Prioritizes static data over Supabase
// ============================================

// Set to true to use static data files as primary source
const USE_STATIC_DATA = true;

// ============================================
// MOVIES
// ============================================

export const getMovies = async (filters = {}) => {
    // PRIORITIZE STATIC DATA
    if (USE_STATIC_DATA) {
        console.log('[ContentService] Using static movies data');
        let movies = getStaticMovies();
        
        // Apply filters if provided
        if (filters.genre) {
            movies = movies.filter(m => m.genre === filters.genre || m.genre?.includes(filters.genre));
        }
        if (filters.search) {
            const query = filters.search.toLowerCase();
            movies = movies.filter(m => 
                m.title?.toLowerCase().includes(query) ||
                m.description?.toLowerCase().includes(query)
            );
        }
        
        return movies;
    }

    // Fallback to database
    try {
        let query = supabase
            .from('movies')
            .select('*')
            .eq('status', 'published');

        if (filters.genre) {
            query = query.eq('genre', filters.genre);
        }
        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // If database returns empty, fall back to static data
        if (!data || data.length === 0) {
            console.log('[ContentService] No movies in database, using static data');
            return getStaticMovies();
        }

        // Transform database format to match static data format
        return data.map(movie => ({
            id: movie.id,
            title: movie.title,
            description: movie.description,
            posterUrl: movie.poster_url,
            bannerUrl: movie.banner_url,
            trailerUrl: movie.trailer_url,
            videoUrl: movie.video_url,
            genre: movie.genre,
            duration: movie.duration,
            year: movie.year,
            rating: movie.rating,
            viewCount: movie.view_count
        }));
    } catch (err) {
        console.warn('[ContentService] Database unavailable, using static data:', err.message);
        return getStaticMovies();
    }
};

export const getMovieById = async (id) => {
    // PRIORITIZE STATIC DATA
    if (USE_STATIC_DATA) {
        const movie = getStaticMovieById(id);
        if (movie) {
            console.log('[ContentService] Using static movie:', id);
            return movie;
        }
    }

    // Fallback to database
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            posterUrl: data.poster_url,
            bannerUrl: data.banner_url,
            trailerUrl: data.trailer_url,
            videoUrl: data.video_url,
            genre: data.genre,
            duration: data.duration,
            year: data.year,
            rating: data.rating,
            viewCount: data.view_count,
            cast: data.cast || []
        };
    } catch (err) {
        console.warn('[ContentService] Fallback to static movie:', id);
        return getStaticMovieById(id);
    }
};

export const getTrendingMovies = async (limit = 10) => {
    // PRIORITIZE STATIC DATA
    if (USE_STATIC_DATA) {
        return getStaticMovies().slice(0, limit);
    }

    // Fallback to database
    try {
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .eq('status', 'published')
            .order('view_count', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) throw error;

        return data.map(movie => ({
            id: movie.id,
            title: movie.title,
            description: movie.description,
            posterUrl: movie.poster_url,
            bannerUrl: movie.banner_url,
            genre: movie.genre,
            duration: movie.duration,
            year: movie.year,
            rating: movie.rating
        }));
    } catch (err) {
        console.warn('[ContentService] Fallback to static trending');
        return getStaticMovies().slice(0, limit);
    }
};

// ============================================
// TV SHOWS / SERIES
// ============================================

export const getTvShows = async (filters = {}) => {
    // PRIORITIZE STATIC DATA
    if (USE_STATIC_DATA) {
        console.log('[ContentService] Using static TV shows data');
        let shows = getStaticTvShows();
        
        // Apply filters if provided
        if (filters.genre) {
            shows = shows.filter(s => s.genre?.includes(filters.genre));
        }
        if (filters.search) {
            const query = filters.search.toLowerCase();
            shows = shows.filter(s => 
                s.title?.toLowerCase().includes(query) ||
                s.description?.toLowerCase().includes(query)
            );
        }
        
        return shows;
    }

    // Fallback to database
    try {
        let query = supabase
            .from('series')
            .select('*, seasons(id, season_number, episodes(id))')
            .eq('status', 'published');

        if (filters.genre) {
            query = query.eq('genre', filters.genre);
        }
        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // If database returns empty, fall back to static data
        if (!data || data.length === 0) {
            console.log('[ContentService] No TV shows in database, using static data');
            return getStaticTvShows();
        }

        return data.map(show => ({
            id: show.id,
            title: show.title,
            description: show.description,
            posterUrl: show.poster_url,
            bannerUrl: show.banner_url,
            genre: show.genre?.split(',').map(g => g.trim()) || [],
            seasonCount: show.seasons?.length || 0,
            episodeCount: show.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0,
            rating: show.rating || '8.0'
        }));
    } catch (err) {
        console.warn('[ContentService] Fallback to static TV shows:', err.message);
        return getStaticTvShows();
    }
};

export const getTvShowById = async (id) => {
    // PRIORITIZE STATIC DATA
    if (USE_STATIC_DATA) {
        const show = getStaticTvShowById(id);
        if (show) {
            console.log('[ContentService] Using static TV show:', id);
            return show;
        }
    }

    // Fallback to database
    try {
        const { data, error } = await supabase
            .from('series')
            .select('*, seasons(*, episodes(*))')
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            posterUrl: data.poster_url,
            bannerUrl: data.banner_url,
            genre: data.genre?.split(',').map(g => g.trim()) || [],
            rating: data.rating || '8.0',
            seasons: data.seasons?.map(season => ({
                seasonNumber: season.season_number,
                title: season.title,
                episodes: season.episodes?.map(ep => ({
                    episodeNumber: ep.episode_order,
                    title: ep.title,
                    description: ep.description,
                    duration: ep.duration,
                    thumbnailUrl: ep.thumbnail_url,
                    videoUrl: ep.video_url
                })) || []
            })) || []
        };
    } catch (err) {
        console.warn('[ContentService] Fallback to static TV show:', id);
        return getStaticTvShowById(id);
    }
};

// ============================================
// EPISODES
// ============================================

export const getEpisodeById = async (showId, seasonNum, episodeNum) => {
    try {
        // First get the series to find the season
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*, seasons(*, episodes(*))')
            .eq('id', showId)
            .single();

        if (seriesError) throw seriesError;

        const season = series.seasons?.find(s => s.season_number === parseInt(seasonNum));
        if (!season) return null;

        const episode = season.episodes?.find(e => e.episode_order === parseInt(episodeNum));
        if (!episode) return null;

        return {
            id: episode.id,
            episodeNumber: episode.episode_order,
            title: episode.title,
            description: episode.description,
            duration: episode.duration,
            thumbnailUrl: episode.thumbnail_url,
            videoUrl: episode.video_url,
            seasonNumber: season.season_number,
            showId: series.id,
            showTitle: series.title
        };
    } catch (err) {
        console.warn('[ContentService] Failed to get episode:', err.message);
        // Fallback to static data
        const { getEpisodeById: getStaticEpisode } = await import('../data/tvShows');
        return getStaticEpisode(showId, seasonNum, episodeNum);
    }
};

export const getNextEpisode = async (showId, seasonNum, episodeNum) => {
    try {
        const { data: series, error } = await supabase
            .from('series')
            .select('*, seasons(*, episodes(*))')
            .eq('id', showId)
            .single();

        if (error) throw error;

        const currentSeason = series.seasons?.find(s => s.season_number === parseInt(seasonNum));
        if (!currentSeason) return null;

        // Sort episodes by order
        const sortedEpisodes = currentSeason.episodes?.sort((a, b) => a.episode_order - b.episode_order) || [];
        const currentIndex = sortedEpisodes.findIndex(e => e.episode_order === parseInt(episodeNum));

        // Check next episode in current season
        if (currentIndex < sortedEpisodes.length - 1) {
            const nextEp = sortedEpisodes[currentIndex + 1];
            return {
                id: nextEp.id,
                episodeNumber: nextEp.episode_order,
                title: nextEp.title,
                duration: nextEp.duration,
                videoUrl: nextEp.video_url,
                seasonNumber: currentSeason.season_number
            };
        }

        // Check first episode of next season
        const nextSeason = series.seasons?.find(s => s.season_number === parseInt(seasonNum) + 1);
        if (nextSeason && nextSeason.episodes?.length > 0) {
            const firstEp = nextSeason.episodes.sort((a, b) => a.episode_order - b.episode_order)[0];
            return {
                id: firstEp.id,
                episodeNumber: firstEp.episode_order,
                title: firstEp.title,
                duration: firstEp.duration,
                videoUrl: firstEp.video_url,
                seasonNumber: nextSeason.season_number
            };
        }

        return null;
    } catch (err) {
        console.warn('[ContentService] Failed to get next episode:', err.message);
        const { getNextEpisode: getStaticNext } = await import('../data/tvShows');
        return getStaticNext(showId, seasonNum, episodeNum);
    }
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export const subscribeToMovies = (callback) => {
    return supabase
        .channel('content-movies-realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'movies'
        }, (payload) => {
            console.log('[ContentService] Movie change:', payload.eventType);
            callback(payload);
        })
        .subscribe((status) => {
            console.log('[ContentService] Movies subscription:', status);
        });
};

export const subscribeToSeries = (callback) => {
    return supabase
        .channel('content-series-realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'series'
        }, (payload) => {
            console.log('[ContentService] Series change:', payload.eventType);
            callback(payload);
        })
        .subscribe((status) => {
            console.log('[ContentService] Series subscription:', status);
        });
};

export const subscribeToEpisodes = (callback) => {
    return supabase
        .channel('content-episodes-realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'episodes'
        }, (payload) => {
            console.log('[ContentService] Episode change:', payload.eventType);
            callback(payload);
        })
        .subscribe((status) => {
            console.log('[ContentService] Episodes subscription:', status);
        });
};

export const unsubscribe = (channel) => {
    if (channel) {
        supabase.removeChannel(channel);
    }
};

// ============================================
// UTILITIES
// ============================================

export const incrementViewCount = async (movieId) => {
    try {
        await supabase.rpc('increment_view_count', { movie_id: movieId });
    } catch (err) {
        console.warn('[ContentService] Failed to increment view count:', err.message);
    }
};

export default {
    getMovies,
    getMovieById,
    getTrendingMovies,
    getTvShows,
    getTvShowById,
    getEpisodeById,
    getNextEpisode,
    subscribeToMovies,
    subscribeToSeries,
    subscribeToEpisodes,
    unsubscribe,
    incrementViewCount
};
