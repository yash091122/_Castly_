import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateSignupForm, getPasswordStrength } from '../../utils/validators';
import { supabase } from '../../config/supabase';
import '../../styles/auth.css';

export const SignInPage = ({ mode = "signin" }) => {
    const navigate = useNavigate();
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const isSignUp = mode === "signup";

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Debounce username check
    useEffect(() => {
        if (!isSignUp || !formData.username || formData.username.length < 3) return;

        const timeoutId = setTimeout(async () => {
            await checkUsernameAvailability(formData.username);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.username, isSignUp]);

    const checkUsernameAvailability = async (username) => {
        setCheckingUsername(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (data) {
                setErrors(prev => ({ ...prev, username: 'Username already taken' }));
            } else if (error && error.code !== 'PGRST116') {
                // PGRST116 means no rows found, which is good
                console.error('Error checking username:', error);
            } else {
                // Username is available
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.username;
                    return newErrors;
                });
            }
        } catch (err) {
            console.error('Username check failed:', err);
        } finally {
            setCheckingUsername(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        setAuthError('');

        // Check password strength
        if (name === 'password') {
            setPasswordStrength(getPasswordStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSignUp) {
            // Validate form for signup
            const validationErrors = validateSignupForm(formData);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            // Check if username is already taken
            if (errors.username) {
                setAuthError('Please choose a different username');
                return;
            }
        }

        setLoading(true);
        setAuthError('');

        let result;
        if (isSignUp) {
            result = await signUp(formData.email, formData.password, formData.username);

            if (!result.error) {
                // Check if user is already authenticated (email confirmation disabled)
                if (result.data?.session) {
                    console.log('✅ Signup successful, auto-login');
                    navigate('/profiles');
                    return;
                }

                // If no session but user created, email confirmation is required
                if (result.data?.user && !result.data?.session) {
                    setAuthError('');
                    setLoading(false);
                    alert('✅ Account created successfully!\n\nYou can now sign in with your email and password.');
                    // Redirect to login
                    navigate('/login');
                    return;
                }
            }
        } else {
            result = await signIn(formData.email, formData.password);

            if (!result.error) {
                navigate('/profiles');
                return;
            }
        }

        if (result.error) {
            // Check for specific username error
            if (result.error.message && result.error.message.includes('username')) {
                setErrors(prev => ({ ...prev, username: 'Username already taken' }));
                setAuthError('Username is already taken. Please choose another.');
            } else if (result.error.message && (result.error.message.toLowerCase().includes('rate limit') || result.error.message.toLowerCase().includes('too many requests'))) {
                setAuthError('Too many signup attempts. Please wait a few minutes before trying again.');
            } else {
                setAuthError(result.error.message || `Failed to ${isSignUp ? 'create account' : 'sign in'}. Please try again.`);
            }
            setLoading(false);
        } else {
            navigate('/profiles');
        }
    };

    const handleGoogleSignIn = async () => {
        setAuthError('');
        const { error } = await signInWithGoogle();
        if (error) {
            setAuthError(error.message || 'Failed to sign in with Google.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="back-button-container">
                    <Link to="/" className="nav-item" id="back-button">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>

                <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>

                {authError && (
                    <div className="auth-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {authError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className={errors.username ? 'error' : ''}
                            />
                            {checkingUsername && (
                                <span className="checking-message">
                                    <i className="fas fa-spinner fa-spin"></i> Checking availability...
                                </span>
                            )}
                            {errors.username && !checkingUsername && (
                                <span className="error-message">
                                    <i className="fas fa-exclamation-circle"></i> {errors.username}
                                </span>
                            )}
                            {!errors.username && !checkingUsername && formData.username.length >= 3 && (
                                <span className="success-message">
                                    <i className="fas fa-check-circle"></i> Username available
                                </span>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                        />
                        {passwordStrength && isSignUp && (
                            <div className={`password-strength ${passwordStrength.strength}`}>
                                <div className="strength-bar">
                                    <div className="strength-fill"></div>
                                </div>
                                <span className="strength-text">{passwordStrength.message}</span>
                            </div>
                        )}
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    {isSignUp && (
                        <div className="form-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    )}

                    {!isSignUp && (
                        <div className="forgot-password">
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-signin"
                        disabled={loading}
                    >
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    <div className="divider">or</div>

                    <button
                        type="button"
                        className="btn-google"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <i className="fab fa-google"></i> Continue with Google
                    </button>

                    <p className="signup-text">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <Link to={isSignUp ? '/login' : '/signup'}>
                            {isSignUp ? 'Sign in' : 'Sign up'}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignInPage;
