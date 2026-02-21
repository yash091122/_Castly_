import { useState } from 'react';

function QuickViewModal({ movie, onClose }) {
    if (!movie) return null;

    return (
        <div className={`quick-view-modal ${movie ? 'active' : ''}`} onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>
                <div
                    className="modal-backdrop"
                    style={{ backgroundImage: `url('${movie.backdropUrl || movie.posterUrl}')` }}
                ></div>
                <div className="modal-info">
                    <h2>{movie.title}</h2>
                    <div className="modal-meta">
                        <span>{movie.rating}</span>
                        <span>{movie.duration}</span>
                        <span>{movie.year}</span>
                    </div>
                    <p>{movie.description}</p>
                    <div className="modal-actions">
                        <button
                            className="btn-play"
                            onClick={() => window.location.href = `/player/${movie.id}`}
                        >
                            <i className="fas fa-play"></i> Play
                        </button>
                        <button
                            className="btn-trailer"
                            onClick={() => window.open(movie.trailerUrl, '_blank')}
                        >
                            <i className="fas fa-film"></i> Trailer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickViewModal;
