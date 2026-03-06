import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Play, Heart, Users, Star, Calendar, Clock, ChevronRight
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useFriends } from '../context/FriendsContext';
import { useContent } from '../context/ContentContext';
import WatchPartyInviteModal from '../components/WatchPartyInviteModal';
import TrailerModal from '../components/TrailerModal';
import ContentCard from '../components/ContentCard';
import { MovieDetailSkeleton } from '../components/skeletons';
import { getMovieById as getStaticMovieById, getAllMovies as getStaticMovies } from '../data/movies';

function MovieDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { friends } = useFriends();
    const { getMovie, movies } = useContent();

    const [movie, setMovie] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [friendsWhoWatched, setFriendsWhoWatched] = useState([]);

    useEffect(() => {
        const loadMovie = async () => {
            // Try to get from ContentContext first
            let movieData = await getMovie(id);

            // Fallback to static data if not found in database
            if (!movieData) {
                movieData = getStaticMovieById(id);
            }

            if (movieData) {
                setMovie(movieData);
                // Get similar movies by genre - use ContentContext if available
                const allMovies = movies.length > 0 ? movies : getStaticMovies();
                const similar = allMovies.filter(m =>
                    (m.genre === movieData.genre || m.genre?.includes(movieData.genre)) && m.id !== id
                ).slice(0, 4);
                setSimilarMovies(similar);
                // Mock friends who watched
                setFriendsWhoWatched(friends.slice(0, 3));
            }
        };
        loadMovie();
    }, [id, friends, getMovie, movies]);

    const handlePlay = () => {
        navigate(`/player/${movie.id}`);
    };

    const handleWatchParty = () => {
        setShowInviteModal(true);
    };

    if (!movie) {
        return <MovieDetailSkeleton />;
    }

    const favorited = isFavorite(movie.id);

    return (
        <div className="content-container mdp-glass-wrapper">
            {/* Unified Background Container */}
            <div className="mdp-unified-container">
                {/* Cinematic Hero Section */}
                <section className="mdp-hero">
                    <div
                        className="mdp-backdrop"
                        style={{ backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})` }}
                    />
                    <div className="mdp-hero-gradient" />

                    <div className="mdp-hero-content">
                        <div className="mdp-content-stack">
                            {/* Title & Meta */}
                            <div className="mdp-header-group">
                                <div className="mdp-meta-badges">
                                    <span className="mdp-rating-pill">
                                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                                        {movie.rating}
                                    </span>
                                    <span className="mdp-hd-badge">4K HDR</span>
                                    <span className="mdp-year-badge">{movie.year}</span>
                                </div>

                                <h1 className="mdp-title">{movie.title}</h1>

                                <div className="mdp-meta-row">
                                    <span className="mdp-meta-text">
                                        <Clock size={16} style={{ marginBottom: -2 }} /> {movie.duration}
                                    </span>
                                    <span className="mdp-dot">•</span>
                                    <span className="mdp-meta-text">
                                        {movie.genre}
                                    </span>
                                    {movie.director && (
                                        <>
                                            <span className="mdp-dot">•</span>
                                            <span className="mdp-meta-text">Directed by {movie.director}</span>
                                        </>
                                    )}
                                </div>

                                <p className="mdp-description">{movie.description}</p>

                                {/* Action Buttons */}
                                <div className="mdp-actions">
                                    <button className="mdp-btn mdp-btn-play" onClick={handlePlay}>
                                        <Play size={24} fill="currentColor" />
                                        <span>Watch Now</span>
                                    </button>
                                    <button className="mdp-btn mdp-btn-glass" onClick={handleWatchParty}>
                                        <Users size={22} />
                                        <span>Watch Party</span>
                                    </button>
                                    <button
                                        className={`mdp-btn mdp-btn-icon ${favorited ? 'active' : ''}`}
                                        onClick={() => toggleFavorite(movie.id)}
                                    >
                                        <Heart size={22} fill={favorited ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className="mdp-btn mdp-btn-icon" onClick={() => setShowTrailerModal(true)}>
                                        <Play size={22} />
                                    </button>
                                </div>

                                {/* Social Proof */}
                                {friendsWhoWatched.length > 0 && (
                                    <div className="mdp-social-info">
                                        <div className="mdp-avatars">
                                            {friendsWhoWatched.map((friend, i) => (
                                                <img
                                                    key={friend.id}
                                                    src={friend.avatar}
                                                    alt={friend.name}
                                                    style={{ zIndex: 10 - i }}
                                                />
                                            ))}
                                        </div>
                                        <span>
                                            Watched by {friendsWhoWatched[0].name} and {friendsWhoWatched.length - 1} others
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Similar Movies Rail */}
                {similarMovies.length > 0 && (
                    <section className="mdp-content-section">
                        <div className="mdp-rail-header">
                            <h2>Similar Movies</h2>
                        </div>
                        <div className="mdp-horizontal-rail">
                            {similarMovies.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="mdp-rail-card"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => navigate(`/movie/${item.id}`)}
                                >
                                    <div className="mdp-card-bg-blur">
                                        <img src={item.posterUrl} alt={item.title} />
                                    </div>
                                    <div className="mdp-card-content">
                                        <div className="mdp-card-badge">
                                            <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                                            {item.rating}
                                        </div>
                                        <div className="mdp-card-bottom">
                                            <h4 className="mdp-card-title">{item.title}</h4>
                                            <div className="mdp-card-year">{item.year}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>


            {/* Modals */}
            {showInviteModal && (
                <WatchPartyInviteModal
                    movie={movie}
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                />
            )}

            {showTrailerModal && (
                <TrailerModal
                    movie={movie}
                    onClose={() => setShowTrailerModal(false)}
                />
            )}

            <style>{`
                /* --- Glass Wrapper for Content Container --- */
                .mdp-glass-wrapper {
                    padding: 0 !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    border-radius: 16px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                }

                .mdp-glass-wrapper::-webkit-scrollbar {
                    width: 8px;
                }

                .mdp-glass-wrapper::-webkit-scrollbar-track {
                    background: transparent;
                }

                .mdp-glass-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }

                .mdp-glass-wrapper::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                /* --- Unified Container with Single Background --- */
                .mdp-unified-container {
                    position: relative;
                    width: 100%;
                    min-height: 100%;
                    background: linear-gradient(
                        to bottom,
                        rgba(11, 11, 11, 0.3) 0%,
                        rgba(11, 11, 11, 0.7) 40%,
                        rgba(11, 11, 11, 0.95) 70%,
                        #0b0b0b 100%
                    );
                    border-radius: 16px;
                    overflow: hidden;
                }

                /* --- Cinematic High-Fidelity Layout --- */
                .mdp-hero {
                    position: relative;
                    height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: flex-end;
                }

                .mdp-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center center;
                    animation: deep-zoom 40s infinite alternate cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    will-change: transform;
                }

                @keyframes deep-zoom {
                    0% { transform: scale(1); }
                    100% { transform: scale(1.25); }
                }

                .mdp-hero-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to right,
                        rgba(0,0,0,0.9) 0%,
                        rgba(0,0,0,0.6) 40%,
                        rgba(0,0,0,0.2) 70%,
                        transparent 100%
                    ),
                    linear-gradient(
                        to top,
                        rgba(11,11,11,1) 0%,
                        rgba(11,11,11,0.95) 3%,
                        rgba(11,11,11,0.8) 10%,
                        rgba(11,11,11,0.4) 25%,
                        transparent 45%
                    );
                    z-index: 2;
                }

                .mdp-hero-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 0 5% 100px;
                }

                .mdp-content-stack {
                    max-width: 900px;
                    animation: float-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                    transform: translateY(40px);
                }

                @keyframes float-up {
                    to { opacity: 1; transform: translateY(0); }
                }

                /* --- Typography & Badges --- */
                .mdp-meta-badges {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    align-items: center;
                }

                .mdp-rating-pill {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }

                .mdp-hd-badge {
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.9);
                    letter-spacing: 0.5px;
                }
                
                .mdp-year-badge {
                    color: rgba(255,255,255,0.8);
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .mdp-title {
                    font-size: clamp(3.5rem, 7vw, 7rem);
                    font-weight: 800;
                    line-height: 0.9;
                    color: #fff;
                    margin-bottom: 24px;
                    text-transform: uppercase;
                    letter-spacing: -3px;
                    text-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    background: linear-gradient(to bottom, #fff 30%, #ccc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .mdp-meta-row {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 32px;
                    color: #e5e5e5;
                    font-size: 1.2rem;
                }

                .mdp-dot { color: rgba(255,255,255,0.3); font-size: 1rem; }
                .mdp-meta-text { font-weight: 500; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px; }

                .mdp-description {
                    font-size: 1.3rem;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.85);
                    text-shadow: 0 2px 5px rgba(0,0,0,0.8);
                    margin-bottom: 40px;
                    max-width: 700px;
                    font-weight: 400;
                }

                /* --- Call to Actions --- */
                .mdp-actions {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-bottom: 30px;
                }

                .mdp-btn {
                    height: 64px;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    font-size: 1.15rem;
                    font-weight: 700;
                    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .mdp-btn-play {
                    padding: 0 40px;
                    background: #fff;
                    color: #000;
                    box-shadow: 0 0 40px rgba(255,255,255,0.15);
                }

                .mdp-btn-play:hover {
                    background: #fff;
                    transform: scale(1.05);
                    box-shadow: 0 0 60px rgba(255,255,255,0.3);
                }

                .mdp-btn-glass {
                    padding: 0 32px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .mdp-btn-glass:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.3);
                }

                .mdp-btn-icon {
                    width: 64px;
                    padding: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .mdp-btn-icon:hover {
                    background: rgba(255,255,255,0.25);
                    transform: scale(1.1);
                }
                
                .mdp-btn-icon.active {
                    background: rgba(229, 9, 20, 0.2);
                    color: #e50914;
                    border-color: #e50914;
                    box-shadow: 0 0 30px rgba(229, 9, 20, 0.3);
                }
                
                .mdp-social-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: rgba(255,255,255,0.6);
                    font-size: 0.95rem;
                }
                
                .mdp-avatars {
                    display: flex;
                    margin-left: 10px;
                }
                
                .mdp-avatars img {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid #0b0b0b;
                    margin-left: -10px;
                }

                /* --- Content Section Wrapper --- */
                .mdp-content-section {
                    position: relative;
                    z-index: 10;
                    padding: 60px 0 80px;
                    background: transparent;
                }

                .mdp-content-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 200px;
                    background: linear-gradient(
                        to bottom,
                        rgba(255, 255, 255, 0.05) 0%,
                        transparent 100%
                    );
                    pointer-events: none;
                }

                /* --- Rail Section --- */
                .mdp-rail-section {
                    position: relative;
                    z-index: 20;
                    padding: 0 0 80px;
                    margin-top: -80px;
                    background: linear-gradient(to bottom, transparent, #0b0b0b 20%);
                }

                .mdp-rail-header {
                     padding: 0 5%;
                     margin-bottom: 30px;
                }
                
                .mdp-rail-header h2 {
                    font-size: 2.2rem;
                    color: #fff;
                    margin: 0;
                    font-weight: 700;
                    letter-spacing: -1px;
                }
                
                .mdp-horizontal-rail {
                     display: flex;
                     gap: 20px;
                     overflow-x: auto;
                     padding: 20px 5% 50px;
                     scrollbar-width: none;
                }
                .mdp-horizontal-rail::-webkit-scrollbar { display: none; }
                
                .mdp-rail-card {
                    flex: 0 0 200px;
                    height: 300px;
                    position: relative;
                    border-radius: 20px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.08) 0%,
                        rgba(255, 255, 255, 0.04) 100%
                    );
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                
                .mdp-rail-card:hover {
                    transform: scale(1.05) translateY(-10px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    border-color: rgba(255,255,255,0.2);
                    z-index: 10;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.12) 0%,
                        rgba(255, 255, 255, 0.06) 100%
                    );
                }
                
                .mdp-card-bg-blur {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    z-index: 1;
                }
                
                .mdp-card-bg-blur img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                
                .mdp-rail-card:hover .mdp-card-bg-blur img {
                    transform: scale(1.1);
                }
                
                .mdp-card-content {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    opacity: 0;
                    transition: opacity 0.3s;
                    z-index: 2;
                }
                
                .mdp-rail-card:hover .mdp-card-content {
                    opacity: 1;
                }
                
                .mdp-card-badge {
                    align-self: flex-end;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(4px);
                    padding: 4px 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.8rem;
                    color: #fff;
                    font-weight: 600;
                }
                
                .mdp-card-title {
                    color: #fff;
                    font-size: 1.1rem;
                    line-height: 1.2;
                    margin: 0;
                }
                
                .mdp-card-year {
                    color: rgba(255,255,255,0.7);
                    font-size: 0.9rem;
                    margin-top: 4px;
                }

                /* Mobile Adaptations */
                @media (max-width: 768px) {
                    .mdp-hero {
                        height: 80vh;
                    }

                    .mdp-hero-content {
                        justify-content: flex-end;
                        padding-bottom: 60px;
                    }

                    .mdp-title { font-size: 3rem; }
                    .mdp-description { display: none; }
                    
                    .mdp-actions .mdp-btn {
                        flex: 1;
                        padding: 0 16px;
                        height: 56px;
                        font-size: 1rem;
                    }
                    
                    .mdp-btn-icon { flex: 0 0 56px; width: 56px; }

                    .mdp-content-section {
                        padding: 40px 0 60px;
                    }
                }
            `}</style>
        </div>
    );
}

export default MovieDetailPage;
