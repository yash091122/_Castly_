import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { db, realtime } from '../config/supabase';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);
    const subscriptionRef = useRef(null);

    // Load favorites from Supabase when user logs in
    useEffect(() => {
        if (user) {
            loadFavorites();

            // Subscribe to realtime changes
            subscriptionRef.current = realtime.subscribeToFavorites(user.id, (payload) => {
                console.log('Favorites realtime update:', payload);
                if (payload.eventType === 'INSERT') {
                    const newItemId = payload.new.movie_id || payload.new.series_id;
                    if (newItemId) {
                        setFavorites(prev => {
                            if (!prev.includes(newItemId)) return [newItemId, ...prev];
                            return prev;
                        });
                    }
                } else if (payload.eventType === 'DELETE') {
                    // Since DELETE payload usually only contains the primary key (favorite row id),
                    // and we only store content IDs, we must re-fetch to ensure accuracy.
                    // We call refreshFavorites to avoid toggling the loading state.
                    refreshFavorites();
                }
            });

            return () => {
                if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                }
            };
        } else {
            setFavorites([]);
        }
    }, [user]);

    const loadFavorites = async () => {
        if (!user) return;
        setLoading(true);
        await refreshFavorites();
        setLoading(false);
    };

    const refreshFavorites = async () => {
        if (!user) return;
        const { data, error } = await db.getFavorites(user.id);
        if (!error && data) {
            // Extract IDs from both movies and series columns
            const ids = data.map(fav => fav.movie_id || fav.series_id).filter(Boolean);
            setFavorites(ids);
        } else if (error) {
            console.error('Error fetching favorites:', error);
            addToast({ type: 'error', message: 'Failed to load favorites' });
        }
    };

    const addFavorite = async (itemId, type = 'movie') => {
        if (!user) {
            addToast({ type: 'warning', message: 'Please login to add favorites' });
            return false;
        }

        // Optimistic update
        setFavorites(prev => {
            if (!prev.includes(itemId)) {
                return [itemId, ...prev];
            }
            return prev;
        });

        const { error } = await db.addFavorite(user.id, itemId, type);
        if (error) {
            console.error('Failed to add favorite:', error);
            // Revert on error
            setFavorites(prev => prev.filter(id => id !== itemId));
            addToast({ type: 'error', message: 'Failed to add favorite' });
            return false;
        }

        addToast({ type: 'success', message: 'Added to favorites' });
        return true;
    };

    const removeFavorite = async (itemId, type = 'movie') => {
        if (!user) {
            addToast({ type: 'warning', message: 'Please login to manage favorites' });
            return false;
        }

        // Optimistic update
        setFavorites(prev => prev.filter(id => id !== itemId));

        const { error } = await db.removeFavorite(user.id, itemId, type);
        if (error) {
            console.error('Failed to remove favorite:', error);
            // Revert on error
            setFavorites(prev => [itemId, ...prev]);
            addToast({ type: 'error', message: 'Failed to remove favorite' });
            return false;
        }

        addToast({ type: 'info', message: 'Removed from favorites' });
        return true;
    };

    const toggleFavorite = async (itemId, type = 'movie') => {
        if (favorites.includes(itemId)) {
            await removeFavorite(itemId, type);
            return false;
        } else {
            await addFavorite(itemId, type);
            return true;
        }
    };

    const isFavorite = (itemId) => favorites.includes(itemId);

    return (
        <FavoritesContext.Provider value={{
            favorites,
            loading,
            addFavorite,
            removeFavorite,
            toggleFavorite,
            isFavorite,
            refreshFavorites
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
