
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Play, Heart, Users, Star, Calendar, Clock, List, ChevronRight, Check
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

import { useContent } from '../context/ContentContext';
import { useTvProgress } from '../context/TvProgressContext';
import WatchPartyInviteModal from '../components/WatchPartyInviteModal';
import TrailerModal from '../components/TrailerModal';
import { getTvShowById as getStaticTvShowById, getAllTvShows as getStaticTvShows, getBecauseYouWatched } from '../data/tvShows';
import { SeriesDetailSkeleton } from '../components/skeletons';

function SeriesDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isFavorite, toggleFavorite } = useFavorites();

    const { getTvShow, tvShows } = useContent();
    const { getEpisodeProgress } = useTvProgress();

    const [series, setSeries] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTrailerModal, setShowTrailerModal] = useState(false);
    const [similarSeries, setSimilarSeries] = useState([]);


    useEffect(() => {
        const loadSeries = async () => {
            // Try to get from ContentContext first
            let seriesData = await getTvShow(id);

            // Fallback to static data if not found in database
            if (!seriesData) {
                seriesData = getStaticTvShowById(id);
            }

            if (seriesData) {
                // Add type for WatchPartyInviteModal
                const seriesWithType = { ...seriesData, type: 'tv' };
                setSeries(seriesWithType);

                // Get similar series
                // If using Context, we might need a helper, or just use static for now as failover
                // The static getBecauseYouWatched uses static data. 
                const similar = getBecauseYouWatched(id);
                setSimilarSeries(similar);


            }
        };
        loadSeries();
    }, [id, getTvShow]);

    const handlePlay = (seasonNum = 1, episodeNum = 1) => {
        navigate(`/tv-player/${series.id}/${seasonNum}/${episodeNum}`);
    };

    const handleWatchParty = () => {
        setShowInviteModal(true);
    };

    if (!series) {
        return <SeriesDetailSkeleton />;
    }

    const favorited = isFavorite(series.id);
    const currentSeasonData = series.seasons?.find(s => s.seasonNumber === selectedSeason);


    return (
        <div className="content-container sdp-glass-wrapper">
            {/* Unified Background Container */}
            <div className="sdp-unified-container">
                {/* Cinematic Hero Section */}
                <section className="sdp-hero">
                    <div
                        className="sdp-backdrop"
                        style={{ backgroundImage: `url(${series.backdropUrl || series.posterUrl})` }}
                    />
                    <div className="sdp-hero-gradient" />

                    <div className="sdp-hero-content">
                        <div className="sdp-content-stack">
                            {/* Title & Meta */}
                            <div className="sdp-header-group">
                                <div className="sdp-meta-badges">
                                    <span className="sdp-rating-pill">
                                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                                        {series.rating}
                                    </span>
                                    <span className="sdp-hd-badge">4K HDR</span>
                                    <span className="sdp-year-badge">{series.year}</span>
                                </div>

                                <h1 className="sdp-title">{series.title}</h1>

                                <div className="sdp-meta-row">
                                    <span className="sdp-meta-text">
                                        {series.seasonCount} Seasons
                                    </span>
                                    <span className="sdp-dot">•</span>
                                    <span className="sdp-meta-text">
                                        {Array.isArray(series.genre) ? series.genre.join(', ') : series.genre}
                                    </span>
                                    {series.creator && (
                                        <>
                                            <span className="sdp-dot">•</span>
                                            <span className="sdp-meta-text">Created by {series.creator}</span>
                                        </>
                                    )}
                                </div>

                                <p className="sdp-description">{series.description}</p>



                                {/* Action Buttons */}
                                <div className="sdp-actions">
                                    <button className="sdp-btn sdp-btn-play" onClick={() => handlePlay()}>
                                        <Play size={24} fill="currentColor" />
                                        <span>Play S1 E1</span>
                                    </button>
                                    <button className="sdp-btn sdp-btn-glass" onClick={handleWatchParty}>
                                        <Users size={22} />
                                        <span>Watch Party</span>
                                    </button>
                                    <button
                                        className={`sdp-btn sdp-btn-icon ${favorited ? 'active' : ''}`}
                                        onClick={() => toggleFavorite(series.id)}
                                    >
                                        <Heart size={22} fill={favorited ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className="sdp-btn sdp-btn-icon" onClick={() => setShowTrailerModal(true)}>
                                        <Play size={22} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Episodes Rail Section */}
                <section className="sdp-episodes-container">
                    <div className="sdp-rail-header">
                        <h2>Episodes</h2>

                        {/* Floating Season Selector */}
                        <div className="sdp-season-pills">
                            {(series.seasons || []).map(season => (
                                <button
                                    key={season.seasonNumber}
                                    className={`sdp-pill ${selectedSeason === season.seasonNumber ? 'active' : ''}`}
                                    onClick={() => setSelectedSeason(season.seasonNumber)}
                                >
                                    Season {season.seasonNumber}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sdp-horizontal-rail">
                        {currentSeasonData?.episodes?.map((episode, index) => {
                            const progress = getEpisodeProgress(series.id, selectedSeason, episode.episodeNumber);
                            const isCompleted = progress >= 90;

                            return (
                                <div
                                    key={episode.id}
                                    className="sdp-rail-card"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => handlePlay(selectedSeason, episode.episodeNumber)}
                                >
                                    <div className="sdp-card-bg-blur">
                                        <img src={episode.thumbnailUrl || series.backdropUrl} alt="" />
                                    </div>

                                    <div className="sdp-card-content">
                                        <div className="sdp-card-top" style={{ justifyContent: 'flex-end' }}>
                                            <div className="sdp-card-badge">
                                                <Clock size={14} />
                                                <span>{episode.duration}</span>
                                            </div>
                                        </div>

                                        <div className="sdp-card-mid">
                                            <h4 className="sdp-card-title">{episode.title}</h4>
                                            <div className="sdp-card-subtitle">Episode {episode.episodeNumber}</div>



                                            {progress > 0 && (
                                                <div className="sdp-rail-progress-bar">
                                                    <div
                                                        className="fill"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button className="sdp-card-btn">
                                            <Play size={20} fill="currentColor" />
                                            Watch Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Modals */}
            {
                showInviteModal && (
                    <WatchPartyInviteModal
                        movie={series}
                        isOpen={showInviteModal}
                        onClose={() => setShowInviteModal(false)}
                    />
                )
            }

            {
                showTrailerModal && (
                    <TrailerModal
                        movie={series}
                        onClose={() => setShowTrailerModal(false)}
                    />
                )
            }

            <style>{`
                /* --- Glass Wrapper for Content Container --- */
                .sdp-glass-wrapper {
                    padding: 0 !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    border-radius: 16px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                }

                .sdp-glass-wrapper::-webkit-scrollbar {
                    width: 8px;
                }

                .sdp-glass-wrapper::-webkit-scrollbar-track {
                    background: transparent;
                }

                .sdp-glass-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }

                .sdp-glass-wrapper::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                /* --- Unified Container with Single Background --- */
                .sdp-unified-container {
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
                .sdp-hero {
                    position: relative;
                    height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: flex-end;
                }

                .sdp-backdrop {
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

                .sdp-hero-gradient {
                    position: absolute;
                    inset: 0;
                    background: 
                        /* Dramatic vignette from sides */
                        radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%),
                        /* Left side strong gradient for content readability */
                        linear-gradient(
                            to right,
                            rgba(0,0,0,0.95) 0%,
                            rgba(0,0,0,0.85) 20%,
                            rgba(0,0,0,0.6) 40%,
                            rgba(0,0,0,0.3) 60%,
                            rgba(0,0,0,0.1) 80%,
                            transparent 100%
                        ),
                        /* Bottom gradient for smooth transition to episodes */
                        linear-gradient(
                            to top,
                            rgba(11,11,11,1) 0%,
                            rgba(11,11,11,0.95) 3%,
                            rgba(11,11,11,0.8) 10%,
                            rgba(11,11,11,0.4) 25%,
                            transparent 45%
                        ),
                        /* Top subtle darkening */
                        linear-gradient(
                            to bottom,
                            rgba(0,0,0,0.6) 0%,
                            transparent 20%
                        );
                    z-index: 2;
                }

                .sdp-hero-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 0 5% 100px;
                }

                .sdp-content-stack {
                    max-width: 900px;
                    animation: float-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                    transform: translateY(40px);
                }

                @keyframes float-up {
                    to { opacity: 1; transform: translateY(0); }
                }

                /* --- Typography & Badges --- */
                .sdp-meta-badges {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                    align-items: center;
                }

                .sdp-rating-pill {
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

                .sdp-hd-badge {
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.9);
                    letter-spacing: 0.5px;
                }
                
                .sdp-year-badge {
                    color: rgba(255,255,255,0.8);
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .sdp-title {
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

                .sdp-meta-row {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 32px;
                    color: #e5e5e5;
                    font-size: 1.2rem;
                }

                .sdp-dot { color: rgba(255,255,255,0.3); font-size: 1rem; }
                .sdp-meta-text { font-weight: 500; letter-spacing: 0.3px; }

                .sdp-description {
                    font-size: 1.3rem;
                    line-height: 1.6;
                    color: rgba(255,255,255,0.85);
                    text-shadow: 0 2px 5px rgba(0,0,0,0.8);
                    margin-bottom: 40px;
                    max-width: 700px;
                    font-weight: 400;
                }
                


                /* --- Call to Actions --- */
                .sdp-actions {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .sdp-btn {
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

                .sdp-btn-play {
                    padding: 0 40px;
                    background: #fff;
                    color: #000;
                    box-shadow: 0 0 40px rgba(255,255,255,0.15);
                }

                .sdp-btn-play:hover {
                    background: #fff;
                    transform: scale(1.05);
                    box-shadow: 0 0 60px rgba(255,255,255,0.3);
                }

                .sdp-btn-glass {
                    padding: 0 32px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .sdp-btn-glass:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.3);
                }

                .sdp-btn-icon {
                    width: 64px;
                    padding: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .sdp-btn-icon:hover {
                    background: rgba(255,255,255,0.25);
                    transform: scale(1.1);
                }
                
                .sdp-btn-icon.active {
                    background: rgba(229, 9, 20, 0.2);
                    color: #e50914;
                    border-color: #e50914;
                    box-shadow: 0 0 30px rgba(229, 9, 20, 0.3);
                }

                /* --- Episodes Rail Section --- */
                .sdp-episodes-container {
                    position: relative;
                    padding: 60px 0 80px;
                    z-index: 10;
                    background: transparent;
                }

                .sdp-rail-header {
                    padding: 0 5%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                    gap: 20px;
                    position: relative;
                    z-index: 10;
                }

                .sdp-rail-header h2 {
                    font-size: 2.2rem;
                    color: #fff;
                    margin: 0;
                    font-weight: 700;
                    letter-spacing: -1px;
                }

                .sdp-season-pills {
                    display: flex;
                    gap: 12px;
                    background: rgba(255,255,255,0.05);
                    padding: 6px;
                    border-radius: 100px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .sdp-pill {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 10px 24px;
                    border-radius: 100px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .sdp-pill:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                }

                .sdp-pill.active {
                    background: #fff;
                    color: #000;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }

                /* Horizontal Rail */
                .sdp-horizontal-rail {
                    display: flex;
                    gap: 30px;
                    overflow-x: auto;
                    padding: 0 5% 50px; 
                    scroll-behavior: smooth;
                    scrollbar-width: none; 
                    align-items: center;
                    position: relative;
                    z-index: 10;
                }
                .sdp-horizontal-rail::-webkit-scrollbar { display: none; }

                .sdp-rail-card {
                    flex: 0 0 320px;
                    height: 420px;
                    cursor: pointer;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.08) 0%,
                        rgba(255, 255, 255, 0.04) 100%
                    );
                    border-radius: 40px;
                    position: relative;
                    transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: card-in 0.8s backwards;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 1;
                }

                .sdp-rail-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.12) 0%,
                        rgba(255, 255, 255, 0.06) 100%
                    );
                    border-color: rgba(255, 255, 255, 0.2);
                    z-index: 100;
                }

                @keyframes card-in {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* --- Blurred Background (The "Gradient" Look) --- */
                .sdp-card-bg-blur {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    filter: blur(60px) brightness(0.6);
                    opacity: 0.6;
                    transition: opacity 0.4s ease;
                }
                
                .sdp-rail-card:hover .sdp-card-bg-blur { opacity: 0.8; }

                .sdp-card-bg-blur img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* --- Content Overlay --- */
                .sdp-card-content {
                    position: relative;
                    z-index: 20;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 24px;
                }

                /* --- Top Row: Avatar & Badge --- */
                .sdp-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .sdp-card-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid rgba(255,255,255,0.2);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                }

                .sdp-card-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .sdp-card-badge {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    padding: 8px 16px;
                    border-radius: 30px;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }

                /* --- Middle: Text --- */
                .sdp-card-mid {
                    margin-top: auto;
                    margin-bottom: 20px;
                }

                .sdp-card-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 6px 0;
                    line-height: 1.1;
                }

                .sdp-card-subtitle {
                    color: rgba(255,255,255,0.7);
                    font-size: 1rem;
                    font-weight: 500;
                }

                .sdp-card-stats {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-top: 16px;
                }
                
                .sdp-stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #fff;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .sdp-stat-icon { color: #fbbf24; } /* Star color */
                .sdp-stat-icon.blue { color: #3b82f6; } /* Blue icon */

                .sdp-stat-label {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.75rem;
                    margin-top: 2px;
                    display: block;
                }

                /* --- Bottom: Action Button --- */
                .sdp-card-btn {
                    width: 100%;
                    height: 56px;
                    border-radius: 28px;
                    background: rgba(255,255,255,0.9);
                    border: none;
                    color: #000;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    position: relative;
                    z-index: 30;
                }

                .sdp-card-btn:hover {
                    transform: scale(1.03);
                    background: #fff;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
                }

                .sdp-rail-progress-bar {
                     height: 4px;
                     background: rgba(255,255,255,0.2);
                     border-radius: 2px;
                     margin-top: 15px;
                     overflow: hidden;
                }
                
                .sdp-rail-progress-bar .fill {
                    height: 100%;
                    background: #22c55e;
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
                }

                /* Mobile Adaptations */
                @media (max-width: 768px) {
                    .sdp-hero {
                        height: 80vh;
                    }

                    .sdp-hero-content {
                        justify-content: flex-end;
                        padding-bottom: 60px;
                    }

                    .sdp-title { font-size: 3rem; }
                    .sdp-description { display: none; }
                    
                    .sdp-actions .sdp-btn {
                        flex: 1;
                        padding: 0 16px;
                        height: 56px;
                        font-size: 1rem;
                    }
                    
                    .sdp-btn-icon { flex: 0 0 56px; width: 56px; }

                    .sdp-rail-card { flex: 0 0 280px; height: 380px; }
                    
                    .sdp-season-pills {
                       padding: 4px;
                       width: 100%;
                       overflow-x: auto;
                    }

                    .sdp-episodes-container {
                        padding: 40px 0 60px;
                    }
                }
            `}</style>
        </div>
    );

}

export default SeriesDetailPage;
