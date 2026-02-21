import '../styles/cast-crew.css';

function CastCrew({ cast = [], crew = [] }) {
    // Mock data if not provided
    const defaultCast = cast.length > 0 ? cast : [
        { id: 1, name: 'Leonardo DiCaprio', character: 'Dom Cobb', image: 'https://via.placeholder.com/150' },
        { id: 2, name: 'Joseph Gordon-Levitt', character: 'Arthur', image: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Ellen Page', character: 'Ariadne', image: 'https://via.placeholder.com/150' },
        { id: 4, name: 'Tom Hardy', character: 'Eames', image: 'https://via.placeholder.com/150' },
        { id: 5, name: 'Marion Cotillard', character: 'Mal', image: 'https://via.placeholder.com/150' },
    ];

    const defaultCrew = crew.length > 0 ? crew : [
        { id: 1, name: 'Christopher Nolan', job: 'Director', image: 'https://via.placeholder.com/150' },
        { id: 2, name: 'Emma Thomas', job: 'Producer', image: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Wally Pfister', job: 'Cinematography', image: 'https://via.placeholder.com/150' },
    ];

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="cast-crew-section">
            {/* Cast Section */}
            <div className="cast-section">
                <h3 className="section-title">
                    <i className="fas fa-users"></i> Cast
                </h3>
                <div className="cast-grid">
                    {defaultCast.map((person) => (
                        <div key={person.id} className="cast-card glass-card">
                            <div className="cast-image">
                                {person.image && !person.image.includes('placeholder') ? (
                                    <img src={person.image} alt={person.name} />
                                ) : (
                                    <div className="cast-placeholder">
                                        {getInitials(person.name)}
                                    </div>
                                )}
                            </div>
                            <div className="cast-info">
                                <h4>{person.name}</h4>
                                <p>{person.character}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Crew Section */}
            <div className="crew-section">
                <h3 className="section-title">
                    <i className="fas fa-film"></i> Crew
                </h3>
                <div className="crew-grid">
                    {defaultCrew.map((person) => (
                        <div key={person.id} className="crew-card glass-card">
                            <div className="crew-image">
                                {person.image && !person.image.includes('placeholder') ? (
                                    <img src={person.image} alt={person.name} />
                                ) : (
                                    <div className="crew-placeholder">
                                        {getInitials(person.name)}
                                    </div>
                                )}
                            </div>
                            <div className="crew-info">
                                <h4>{person.name}</h4>
                                <p>{person.job}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CastCrew;
