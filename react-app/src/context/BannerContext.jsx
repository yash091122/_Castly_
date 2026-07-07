import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

const BannerContext = createContext({});

export const useBanners = () => useContext(BannerContext);

export const BannerProvider = ({ children }) => {
    const [banners, setBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const subscriptionRef = useRef(null);
    const autoRotateRef = useRef(null);

    useEffect(() => {
        fetchBanners();
        setupRealtimeSubscription();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
            }
        };
    }, []);

    // Auto-rotate banners every 8 seconds
    useEffect(() => {
        if (banners.length > 1) {
            autoRotateRef.current = setInterval(() => {
                setCurrentBannerIndex(prev => (prev + 1) % banners.length);
            }, 8000);

            return () => clearInterval(autoRotateRef.current);
        }
    }, [banners.length]);

    const fetchBanners = async () => {
        try {
            const { data, error } = await supabase
                .from('hero_banners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                console.warn('[Banners] Error fetching:', error);
                return;
            }

            if (data) {
                setBanners(data);
                console.log('[Banners] 🎯 Loaded', data.length, 'banners');
            }
        } catch (err) {
            console.error('[Banners] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        subscriptionRef.current = supabase
            .channel('hero-banners-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'hero_banners'
            }, (payload) => {
                console.log('[Banners] 🔄 Realtime update:', payload.eventType);

                if (payload.eventType === 'INSERT') {
                    if (payload.new.is_active) {
                        setBanners(prev => [...prev, payload.new].sort((a, b) => a.display_order - b.display_order));
                        console.log('[Banners] ➕ New banner added:', payload.new.title);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    if (payload.new.is_active) {
                        setBanners(prev => {
                            const exists = prev.find(b => b.id === payload.new.id);
                            if (exists) {
                                return prev.map(b => b.id === payload.new.id ? payload.new : b)
                                    .sort((a, b) => a.display_order - b.display_order);
                            } else {
                                return [...prev, payload.new].sort((a, b) => a.display_order - b.display_order);
                            }
                        });
                        console.log('[Banners] ✏️ Banner updated:', payload.new.title);
                    } else {
                        setBanners(prev => prev.filter(b => b.id !== payload.new.id));
                        console.log('[Banners] 🔕 Banner deactivated:', payload.new.title);
                    }
                } else if (payload.eventType === 'DELETE') {
                    setBanners(prev => prev.filter(b => b.id !== payload.old.id));
                    console.log('[Banners] ➖ Banner deleted');
                }
            })
            .subscribe((status) => {
                console.log('[Banners] Subscription status:', status);
            });
    };

    const goToNext = () => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    };

    const goToPrev = () => {
        setCurrentBannerIndex(prev => (prev - 1 + banners.length) % banners.length);
    };

    const goTo = (index) => {
        setCurrentBannerIndex(index);
    };

    const value = {
        banners,
        currentBanner: banners[currentBannerIndex] || null,
        currentBannerIndex,
        loading,
        goToNext,
        goToPrev,
        goTo,
        refresh: fetchBanners
    };

    return (
        <BannerContext.Provider value={value}>
            {children}
        </BannerContext.Provider>
    );
};

export default BannerContext;
