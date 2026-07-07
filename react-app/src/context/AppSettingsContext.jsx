import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

const AppSettingsContext = createContext({});

export const useAppSettings = () => useContext(AppSettingsContext);

export const AppSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        site_name: 'Castly',
        primary_color: '#6366f1',
        maintenance_mode: false,
        maintenance_message: 'We are performing scheduled maintenance.',
        announcement_enabled: false,
        announcement_text: ''
    });
    const [loading, setLoading] = useState(true);
    const subscriptionRef = useRef(null);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
        setupRealtimeSubscription();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('key, value');

            if (error) {
                console.warn('[AppSettings] Error fetching settings:', error);
                return;
            }

            if (data) {
                const settingsObj = {};
                data.forEach(item => {
                    try {
                        settingsObj[item.key] = JSON.parse(item.value);
                    } catch {
                        settingsObj[item.key] = item.value;
                    }
                });
                setSettings(prev => ({ ...prev, ...settingsObj }));
                console.log('[AppSettings] ⚙️ Loaded settings:', settingsObj);
            }
        } catch (err) {
            console.error('[AppSettings] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        subscriptionRef.current = supabase
            .channel('app-settings-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'app_settings'
            }, (payload) => {
                console.log('[AppSettings] 🔄 Realtime update:', payload.eventType, payload.new?.key);

                if (payload.new) {
                    const { key, value } = payload.new;
                    try {
                        const parsedValue = JSON.parse(value);
                        setSettings(prev => ({ ...prev, [key]: parsedValue }));

                        // Log specific important settings changes
                        if (key === 'maintenance_mode') {
                            console.log('[AppSettings] 🚧 Maintenance mode:', parsedValue ? 'ENABLED' : 'DISABLED');
                        }
                    } catch {
                        setSettings(prev => ({ ...prev, [key]: value }));
                    }
                }
            })
            .subscribe((status) => {
                console.log('[AppSettings] Subscription status:', status);
            });
    };

    const value = {
        ...settings,
        loading,
        isMaintenanceMode: settings.maintenance_mode === true || settings.maintenance_mode === 'true',
        refresh: fetchSettings
    };

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
};

export default AppSettingsContext;
