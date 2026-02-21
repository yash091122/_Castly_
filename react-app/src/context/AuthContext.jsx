import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check active session
        const initializeAuth = async () => {
            try {
                const { user: currentUser } = await auth.getCurrentUser();
                setUser(currentUser);
            } catch (err) {
                console.error('Error initializing auth:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, username) => {
        try {
            setError(null);
            setLoading(true);
            const { data, error: signUpError } = await auth.signUp(email, password, username);

            if (signUpError) throw signUpError;

            return { data, error: null };
        } catch (err) {
            setError(err.message);
            return { data: null, error: err };
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            const { data, error: signInError } = await auth.signIn(email, password);

            if (signInError) throw signInError;

            return { data, error: null };
        } catch (err) {
            setError(err.message);
            return { data: null, error: err };
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            const { data, error: googleError } = await auth.signInWithGoogle();

            if (googleError) throw googleError;

            return { data, error: null };
        } catch (err) {
            setError(err.message);
            return { data: null, error: err };
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            const { error: signOutError } = await auth.signOut();

            if (signOutError) throw signOutError;

            setUser(null);
            return { error: null };
        } catch (err) {
            setError(err.message);
            return { error: err };
        }
    };

    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
