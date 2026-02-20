import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Star, Film, Tv } from 'lucide-react';
import ContentCard from './ContentCard';
import '../styles/movies.css';
import '../styles/content-pages.css';

// Map icon strings to components if needed, or pass full header
const MovieRow = ({ title, movies, onQuickView, icon: Icon }) => {
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
    }, [movies]);

    if (!movies || movies.length === 0) return null;

    return (
        <div className="content-section">
            <div className="content-section-header">
                <h2 className="content-section-title">
                    {Icon && <Icon size={24} />}
                    {title}
                </h2>
            </div>

            <div className="movie-row-container">
                {showLeftBtn && (
                    <button className="scroll-button prev" onClick={() => scroll('left')}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                <div className="content-row" ref={rowRef}>
                    {movies.map(movie => (
                        <ContentCard
                            key={movie.id}
                            movie={movie}
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
        </div>
    );
};

export default MovieRow;
