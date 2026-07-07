import { useState } from 'react';
import '../styles/trailer-modal.css';

function TrailerModal({ movie, onClose }) {
    if (!movie) return null;

    // Extract YouTube video ID from URL
    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYouTubeId(movie.trailerUrl);

    return (
        <div className="trailer-modal-overlay" onClick={onClose}>
            <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                <div className="trailer-header">
                    <h2>{movie.title} - Trailer</h2>
                </div>

                <div className="trailer-player">
                    {videoId ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title={`${movie.title} Trailer`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="no-trailer">
                            <i className="fas fa-film"></i>
                            <p>Trailer not available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TrailerModal;
