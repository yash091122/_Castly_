import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import '../styles/auth.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage('Password reset link sent! Check your email inbox (and spam folder).');
            setEmail('');
        } catch (err) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="back-button-container">
                    <Link to="/login" className="nav-item" id="back-button">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>

                <h1>Reset Password</h1>
                <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

                {message && (
                    <div className="auth-success">
                        <i className="fas fa-check-circle"></i>
                        {message}
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-signin"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <p className="signup-text">
                        Remember your password?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;
