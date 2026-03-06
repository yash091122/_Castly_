import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/supabase';
import Loader from './Loader';
import '../styles/reviews.css';

function ReviewSection({ movieId }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [movieId]);

    const loadReviews = async () => {
        try {
            const { data, error } = await db.getReviews(movieId);
            if (!error && data) {
                setReviews(data);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to leave a review');
            return;
        }
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            const { data, error } = await db.addReview(user.id, movieId, rating, comment);
            if (error) throw error;

            setReviews([data, ...reviews]);
            setComment('');
            setRating(5);
        } catch (error) {
            console.error('Error adding review:', error);
            alert('Failed to add review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const { error } = await db.deleteReview(reviewId);
            if (!error) {
                setReviews(reviews.filter(r => r.id !== reviewId));
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const getInitials = (name) => name ? name[0].toUpperCase() : '?';

    return (
        <div className="reviews-section">
            <h3 className="section-title">Reviews ({reviews.length})</h3>

            {user && (
                <div className="add-review-card glass-card">
                    <div className="rating-selector">
                        <span>Your Rating:</span>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                className={`star-btn ${star <= rating ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                            >
                                <i className="fas fa-star"></i>
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your review here..."
                            rows="3"
                            disabled={submitting}
                        />
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Posting...' : 'Post Review'}
                        </button>
                    </form>
                </div>
            )}

            <div className="reviews-list">
                {loading ? (
                    <Loader size="medium" fullScreen={false} />
                ) : reviews.length === 0 ? (
                    <div className="no-reviews">No reviews yet. Be the first!</div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="review-card glass-card">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <div className="avatar-placeholder-small">
                                        {review.user?.avatar_url ? (
                                            <img src={review.user.avatar_url} alt="User" />
                                        ) : (
                                            getInitials(review.user?.display_name || 'User')
                                        )}
                                    </div>
                                    <div>
                                        <span className="reviewer-name">
                                            {review.user?.display_name || 'Anonymous'}
                                        </span>
                                        <div className="review-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}></i>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {user && user.id === review.user_id && (
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(review.id)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                            </div>
                            <div className="review-content">
                                {review.comment}
                            </div>
                            <div className="review-date">
                                {new Date(review.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ReviewSection;
