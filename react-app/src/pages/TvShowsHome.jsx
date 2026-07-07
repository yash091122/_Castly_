import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTvProgress } from '../context/TvProgressContext';
import { useContent } from '../context/ContentContext';
import ContentCard from '../components/ContentCard';
import QuickViewModal from '../components/QuickViewModal';
import WatchPartyInviteModal from '../components/WatchPartyInviteModal';
import { Tv, TrendingUp, Star, Clock, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
    getAllTvShows as getStaticTvShows,
    getTrendingShows as getStaticTrending,
    getTopRatedShows as getStaticTopRated,
    getPopularShows as getStaticPopular
} from '../data/tvShows';
import '../styles/tv-shows.css';
import '../styles/content-pages.css';
import '../styles/movies.css'; // Import movies.css for shared styles like .scroll-button

// Tv Row Component (based on MovieRow)
function TvRow({ title, shows, onQuickView }) {
    const rowRef = useRef(null);
    const [showLeftBtn, setShowLeftBtn] = useState(false);
    const [showRightBtn, setShowRightBtn] = useState(true);

    const checkScroll = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setShowLeftBtn(scrollLeft > 0);
            setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (rowRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 300);
        }
    };

    useEffect(() => {
        checkScroll();
        const row = rowRef.current;
        if (row) {
            row.addEventListener('scroll', checkScroll);
            return () => row.removeEventListener('scroll', checkScroll);
        }
    }, [shows]);

    if (!shows.length) return null;

    return (
        <section className="section">
            <h2 className="section-title">{title}</h2>
            <div className="movie-row-container">
                {showLeftBtn && (
                    <button className="scroll-button prev" onClick={() => scroll('left')}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                <div className="content-row" ref={rowRef}>
                    {shows.map(show => (
                        <ContentCard
                            key={show.id}
                            movie={{ ...show, type: 'tv' }}
                            onQuickView={onQuickView}
                        />
                    ))}
                </div>
                {showRightBtn && (
                    <button className="scroll-button next" onClick={() => scroll('right')}>
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </section>
    );
}

function TvShowsHome() {
    const navigate = useNavigate();
    const { continueWatching: userContinueWatching } = useTvProgress();
    const { tvShows: dbTvShows } = useContent();

    const allShows = useMemo(() => {
        return dbTvShows.length > 0 ? dbTvShows : getStaticTvShows();
    }, [dbTvShows]);

    const [quickViewShow, setQuickViewShow] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedShow, setSelectedShow] = useState(null);
    const [continueWatching, setContinueWatching] = useState([]);

    const trendingShows = useMemo(() => {
        return dbTvShows.length > 0 ? dbTvShows.slice(0, 8) : getStaticTrending();
    }, [dbTvShows]);

    const topRatedShows = useMemo(() => {
        return dbTvShows.length > 0
            ? [...dbTvShows].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)).slice(0, 8)
            : getStaticTopRated();
    }, [dbTvShows]);

    const popularShows = useMemo(() => {
        return dbTvShows.length > 0 ? dbTvShows.slice(0, 8) : getStaticPopular();
    }, [dbTvShows]);

    useEffect(() => {
        if (userContinueWatching && userContinueWatching.length > 0) {
            setContinueWatching(userContinueWatching);
        } else {
            const mockContinue = trendingShows.slice(0, 4).map((show, i) => ({
                ...show,
                progress: Math.random() * 80 + 10,
                currentSeason: 1,
                currentEpisode: i + 1
            }));
            setContinueWatching(mockContinue);
        }
    }, [userContinueWatching, trendingShows]);

    function getShowsByGenre(genre) {
        return allShows.filter(show => show.genre?.includes(genre)).slice(0, 8);
    }

    const sciFiShows = getShowsByGenre('Sci-Fi');
    const dramaShows = getShowsByGenre('Drama');
    const crimeShows = getShowsByGenre('Crime');
    const actionShows = getShowsByGenre('Action');
    const fantasyShows = getShowsByGenre('Fantasy');

    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <h1>TV Shows</h1>
                    <p>Discover amazing series</p>
                </div>

                {/* Content Rows */}
                {continueWatching.length > 0 && (
                    <TvRow
                        title="Continue Watching"
                        shows={continueWatching}
                        onQuickView={setQuickViewShow}
                    />
                )}

                <TvRow
                    title=" Trending Now"
                    shows={trendingShows}
                    onQuickView={setQuickViewShow}
                />

                <TvRow
                    title=" Top Rated"
                    shows={topRatedShows}
                    onQuickView={setQuickViewShow}
                />

                {sciFiShows.length > 0 && (
                    <TvRow
                        title=" Sci-Fi"
                        shows={sciFiShows}
                        onQuickView={setQuickViewShow}
                    />
                )}

                {dramaShows.length > 0 && (
                    <TvRow
                        title=" Drama"
                        shows={dramaShows}
                        onQuickView={setQuickViewShow}
                    />
                )}

                {crimeShows.length > 0 && (
                    <TvRow
                        title=" Crime"
                        shows={crimeShows}
                        onQuickView={setQuickViewShow}
                    />
                )}

                {actionShows.length > 0 && (
                    <TvRow
                        title=" Action"
                        shows={actionShows}
                        onQuickView={setQuickViewShow}
                    />
                )}

                {fantasyShows.length > 0 && (
                    <TvRow
                        title=" Fantasy"
                        shows={fantasyShows}
                        onQuickView={setQuickViewShow}
                    />
                )}
            </div>

            {/* Quick View Modal */}
            <QuickViewModal
                movie={quickViewShow}
                onClose={() => setQuickViewShow(null)}
            />

            {/* Watch Party Invite Modal */}
            {showInviteModal && selectedShow && (
                <WatchPartyInviteModal
                    movie={{ ...selectedShow, type: 'tv' }}
                    isOpen={showInviteModal}
                    onClose={() => { setShowInviteModal(false); setSelectedShow(null); }}
                />
            )}
        </div>
    );
}

export default TvShowsHome;
