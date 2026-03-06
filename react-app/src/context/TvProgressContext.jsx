import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/supabase';
import { getTvShowById } from '../data/tvShows';

const TvProgressContext = createContext();

export function TvProgressProvider({ children }) {
    const { user } = useAuth();
    const [continueWatching, setContinueWatching] = useState([]);
    const [watchHistory, setWatchHistory] = useState({});
    const [loading, setLoading] = useState(true);

    // Load user's TV watch history
    useEffect(() => {
        if (!user) {
            setContinueWatching([]);
            setWatchHistory({});
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                // Try to load from database
                const { data } = await db.getContinueWatchingTv?.(user.id) || { data: null };
                
                if (data && data.length > 0) {
                    // Map database data to show data
                    const mapped = data.map(item => {
                        const show = getTvShowById(item.show_id);
                        if (!show) return null;
                        return {
                            ...show,
                            currentSeason: item.season_number,
                            currentEpisode: item.episode_number,
                            progress: (item.progress / item.duration) * 100,
                            lastWatched: new Date(item.last_watched)
                        };
                    }).filter(Boolean);
                    
                    setContinueWatching(mapped);
                } else {
                    // Use localStorage fallback
                    const stored = localStorage.getItem(`tv_progress_${user.id}`);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setWatchHistory(parsed);
                        
                        // Build continue watching list
                        const continueList = Object.entries(parsed)
                            .map(([showId, data]) => {
                                const show = getTvShowById(showId);
                                if (!show) return null;
                                return {
                                    ...show,
                                    currentSeason: data.season,
                                    currentEpisode: data.episode,
                                    progress: data.progress,
                                    lastWatched: new Date(data.lastWatched)
                                };
                            })
                            .filter(item => item && item.progress < 95)
                            .sort((a, b) => b.lastWatched - a.lastWatched);
                        
                        setContinueWatching(continueList);
                    }
                }
            } catch (error) {
                console.error('Error loading TV watch history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [user]);

    // Update watch progress
    const updateProgress = useCallback(async (showId, season, episode, progress, duration) => {
        if (!user) return;

        const progressPercent = (progress / duration) * 100;
        const completed = progressPercent >= 90;

        // Update local state
        setWatchHistory(prev => ({
            ...prev,
            [showId]: {
                season,
                episode,
                progress: progressPercent,
                duration,
                completed,
                lastWatched: new Date().toISOString()
            }
        }));

        // Save to localStorage
        const stored = localStorage.getItem(`tv_progress_${user.id}`);
        const existing = stored ? JSON.parse(stored) : {};
        existing[showId] = {
            season,
            episode,
            progress: progressPercent,
            duration,
            completed,
            lastWatched: new Date().toISOString()
        };
        localStorage.setItem(`tv_progress_${user.id}`, JSON.stringify(existing));

        // Try to save to database
        try {
            await db.updateTvWatchProgress?.(user.id, showId, season, episode, progress, duration);
        } catch (error) {
            console.error('Error saving TV progress to database:', error);
        }

        // Update continue watching list
        const show = getTvShowById(showId);
        if (show && !completed) {
            setContinueWatching(prev => {
                const filtered = prev.filter(s => s.id !== showId);
                return [{
                    ...show,
                    currentSeason: season,
                    currentEpisode: episode,
                    progress: progressPercent,
                    lastWatched: new Date()
                }, ...filtered].slice(0, 10);
            });
        } else if (completed) {
            // Remove from continue watching if completed
            setContinueWatching(prev => prev.filter(s => s.id !== showId));
        }
    }, [user]);

    // Get progress for a specific show
    const getShowProgress = useCallback((showId) => {
        return watchHistory[showId] || null;
    }, [watchHistory]);

    // Get progress for a specific episode
    const getEpisodeProgress = useCallback((showId, season, episode) => {
        const showProgress = watchHistory[showId];
        if (!showProgress) return 0;
        if (showProgress.season === season && showProgress.episode === episode) {
            return showProgress.progress;
        }
        // If we're past this episode, it's completed
        if (showProgress.season > season || 
            (showProgress.season === season && showProgress.episode > episode)) {
            return 100;
        }
        return 0;
    }, [watchHistory]);

    // Mark episode as completed
    const markEpisodeCompleted = useCallback(async (showId, season, episode) => {
        if (!user) return;

        const show = getTvShowById(showId);
        if (!show) return;

        // Find episode duration
        const seasonData = show.seasons.find(s => s.seasonNumber === season);
        const episodeData = seasonData?.episodes.find(e => e.episodeNumber === episode);
        const duration = episodeData ? parseInt(episodeData.duration) * 60 : 3600;

        await updateProgress(showId, season, episode, duration, duration);
    }, [user, updateProgress]);

    return (
        <TvProgressContext.Provider value={{
            continueWatching,
            watchHistory,
            loading,
            updateProgress,
            getShowProgress,
            getEpisodeProgress,
            markEpisodeCompleted
        }}>
            {children}
        </TvProgressContext.Provider>
    );
}

export const useTvProgress = () => {
    const context = useContext(TvProgressContext);
    if (!context) {
        throw new Error('useTvProgress must be used within a TvProgressProvider');
    }
    return context;
};
