import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Loader from '../components/Loader';

function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const handleEmailConfirmation = async () => {
            try {
                // Get the hash from URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');
                const errorParam = hashParams.get('error');
                const errorDescription = hashParams.get('error_description');

                console.log('Auth callback params:', { type, hasAccessToken: !!accessToken, error: errorParam });

                // Handle errors from OAuth or email verification
                if (errorParam) {
                    setStatus('error');
                    setMessage(errorDescription || 'Authentication failed. Please try again.');
                    console.error('Auth error:', errorParam, errorDescription);
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                    return;
                }

                // If no parameters at all, redirect to home
                if (!accessToken && !type && !errorParam) {
                    console.log('No auth parameters, redirecting to home');
                    navigate('/');
                    return;
                }

                if (type === 'signup' && accessToken) {
                    // Set the session
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        setStatus('error');
                        setMessage('Failed to verify email. Please try again.');
                        console.error('Email verification error:', error);
                    } else {
                        setStatus('success');
                        setMessage('Email verified successfully! Redirecting...');
                        
                        // Redirect to home after 2 seconds
                        setTimeout(() => {
                            navigate('/');
                        }, 2000);
                    }
                } else if (type === 'recovery' && accessToken) {
                    // Password recovery
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        setStatus('error');
                        setMessage('Failed to verify recovery link.');
                        console.error('Recovery verification error:', error);
                    } else {
                        setStatus('success');
                        setMessage('Verification successful! Redirecting to reset password...');
                        
                        setTimeout(() => {
                            navigate('/reset-password');
                        }, 2000);
                    }
                } else if (accessToken && !type) {
                    // OAuth callback (Google, etc.)
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        setStatus('error');
                        setMessage('Failed to sign in. Please try again.');
                        console.error('OAuth error:', error);
                    } else {
                        setStatus('success');
                        setMessage('Sign in successful! Redirecting...');
                        
                        setTimeout(() => {
                            navigate('/');
                        }, 2000);
                    }
                } else {
                    setStatus('error');
                    setMessage('Invalid verification link.');
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification.');
                console.error('Verification error:', error);
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        };

        handleEmailConfirmation();
    }, [navigate]);

    return (
        <div className="auth-container">
            <div className="auth-box" style={{ textAlign: 'center', padding: '40px' }}>
                {status === 'verifying' && (
                    <>
                        <Loader />
                        <h2 style={{ marginTop: '20px', color: 'white' }}>{message}</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '10px' }}>
                            Please wait while we verify your email...
                        </p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '4rem', color: '#4ade80', marginBottom: '20px' }}>
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '10px' }}>{message}</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            You will be redirected automatically...
                        </p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '20px' }}>
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '10px' }}>{message}</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
                            The verification link may have expired or is invalid.
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default AuthCallback;
