import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

const FeaturedContext = createContext({});

export const useFeatured = () => useContext(FeaturedContext);

export const FeaturedProvider = ({ children }) => {
    const [featuredContent, setFeaturedContent] = useState({
        hero: [],
        trending: [],
        featured: [],
        new_releases: [],
        recommended: []
    });
    const [loading, setLoading] = useState(true);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        fetchFeaturedContent();
        setupRealtimeSubscription();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, []);

    const fetchFeaturedContent = async () => {
        try {
            // Fetch featured content with related movie/series data
            const { data, error } = await supabase
                .from('featured_content')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                console.warn('[Featured] Error fetching:', error);
                return;
            }

            if (data) {
                // Group by section
                const grouped = {
                    hero: [],
                    trending: [],
                    featured: [],
                    new_releases: [],
                    recommended: []
                };

                // Transform data and join with content from ContentContext or fetch individually if needed
                // For now, we will just pass the ID and let the UI or a separate fetch handle it
                // Or better, we can assume the data is in ContentContext if it's loaded there.

                // Since we removed the join, we need to handle the data structure differently
                data.forEach(item => {
                    if (grouped[item.section]) {
                        // We don't have the full movie/series object here anymore from the join
                        // We constructing a minimal object. 
                        // ideally we would look this up from ContentContext.movies but we are inside a provider 
                        // that doesn't consume ContentContext.

                        // Temporarily pushing a placeholder that expects the ID to be resolved later
                        // or we can fetch the details here in parallel if we really need to.

                        grouped[item.section].push({
                            id: item.content_id,
                            featuredId: item.id,
                            contentType: item.content_type,
                            // Fallback properties if the UI expects them immediately
                            title: 'Loading...',
                            poster_url: null
                        });
                    }
                });

                setFeaturedContent(grouped);
                console.log('[Featured] 🌟 Loaded featured content:', Object.keys(grouped).map(k => `${k}: ${grouped[k].length}`).join(', '));
            }
        } catch (err) {
            console.error('[Featured] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        subscriptionRef.current = supabase
            .channel('featured-content-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'featured_content'
            }, (payload) => {
                console.log('[Featured] 🔄 Realtime update:', payload.eventType);
                // Refetch all on any change for simplicity
                fetchFeaturedContent();
            })
            .subscribe((status) => {
                console.log('[Featured] Subscription status:', status);
            });
    };

    const value = {
        ...featuredContent,
        loading,
        hasFeaturedContent: Object.values(featuredContent).some(arr => arr.length > 0),
        refresh: fetchFeaturedContent
    };

    return (
        <FeaturedContext.Provider value={value}>
            {children}
        </FeaturedContext.Provider>
    );
};

export default FeaturedContext;
