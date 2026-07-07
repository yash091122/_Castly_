import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { getPasswordStrength } from '../utils/validators';
import '../styles/auth.css';

function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [isValidSession, setIsValidSession] = useState(false);

    useEffect(() => {
        // Check if we have a valid recovery session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true);
            } else {
                setError('Invalid or expired reset link. Please request a new one.');
            }
        });
    }, []);

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(getPasswordStrength(newPassword));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            alert('✅ Password updated successfully!');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isValidSession && !error) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="back-button-container">
                    <Link to="/login" className="nav-item" id="back-button">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>

                <h1>Set New Password</h1>
                <p className="auth-subtitle">Enter your new password below.</p>

                {error && (
                    <div className="auth-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                {isValidSession && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="New Password"
                                required
                                value={password}
                                onChange={handlePasswordChange}
                            />
                            {passwordStrength && (
                                <div className={`password-strength ${passwordStrength.strength}`}>
                                    <div className="strength-bar">
                                        <div className="strength-fill"></div>
                                    </div>
                                    <span className="strength-text">{passwordStrength.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm New Password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-signin"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {!isValidSession && error && (
                    <div className="auth-actions">
                        <Link to="/forgot-password" className="btn-signin">
                            Request New Reset Link
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
