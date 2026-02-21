import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const AnnouncementContext = createContext({});

export const useAnnouncements = () => useContext(AnnouncementContext);

export const AnnouncementProvider = ({ children }) => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [dismissedIds, setDismissedIds] = useState(() => {
        const saved = localStorage.getItem('dismissed_announcements');
        return saved ? JSON.parse(saved) : [];
    });
    const subscriptionRef = useRef(null);

    useEffect(() => {
        fetchAnnouncements();
        setupRealtimeSubscription();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, []);

    // Save dismissed IDs to localStorage
    useEffect(() => {
        localStorage.setItem('dismissed_announcements', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.warn('[Announcements] Error fetching:', error);
                return;
            }

            if (data) {
                setAnnouncements(data);
                // Check for new announcements user hasn't seen
                const unread = data.find(a => !dismissedIds.includes(a.id));
                if (unread) {
                    setCurrentAnnouncement(unread);
                    setShowPopup(true);
                }
                console.log('[Announcements] 📢 Loaded', data.length, 'announcements');
            }
        } catch (err) {
            console.error('[Announcements] Fetch error:', err);
        }
    };

    const setupRealtimeSubscription = () => {
        subscriptionRef.current = supabase
            .channel('admin-notifications-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'admin_notifications'
            }, (payload) => {
                console.log('[Announcements] 🔔 New announcement:', payload.new.title);
                setAnnouncements(prev => [payload.new, ...prev]);

                // Show popup for new announcement
                if (!dismissedIds.includes(payload.new.id)) {
                    setCurrentAnnouncement(payload.new);
                    setShowPopup(true);
                }
            })
            .subscribe((status) => {
                console.log('[Announcements] Subscription status:', status);
            });
    };

    const dismissAnnouncement = useCallback((id) => {
        setDismissedIds(prev => [...prev, id]);
        setShowPopup(false);
        setCurrentAnnouncement(null);

        // Check if there are more unread announcements
        setTimeout(() => {
            const nextUnread = announcements.find(a =>
                !dismissedIds.includes(a.id) && a.id !== id
            );
            if (nextUnread) {
                setCurrentAnnouncement(nextUnread);
                setShowPopup(true);
            }
        }, 500);
    }, [announcements, dismissedIds]);

    const dismissAll = useCallback(() => {
        setDismissedIds(prev => [...prev, ...announcements.map(a => a.id)]);
        setShowPopup(false);
        setCurrentAnnouncement(null);
    }, [announcements]);

    const value = {
        announcements,
        currentAnnouncement,
        showPopup,
        unreadCount: announcements.filter(a => !dismissedIds.includes(a.id)).length,
        dismissAnnouncement,
        dismissAll,
        closePopup: () => setShowPopup(false),
        refresh: fetchAnnouncements
    };

    return (
        <AnnouncementContext.Provider value={value}>
            {children}
        </AnnouncementContext.Provider>
    );
};

export default AnnouncementContext;
