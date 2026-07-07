import { getAllMovies } from '../data/movies';

export const getRecommendations = (watchHistory = [], favorites = []) => {
    const allMovies = getAllMovies();

    // 1. Get genres from watch history and favorites
    const likedGenres = new Set();

    // Extract from history (if progress > 30%)
    watchHistory.forEach(item => {
        if (item.movies && (item.progress / item.duration) > 0.3) {
            item.movies.genre.split(', ').forEach(g => likedGenres.add(g));
        }
    });

    // Extract from favorites
    favorites.forEach(item => {
        if (item.movies) {
            item.movies.genre.split(', ').forEach(g => likedGenres.add(g));
        }
    });

    // 2. Score movies based on genre match
    const scoredMovies = allMovies.map(movie => {
        let score = 0;
        const movieGenres = movie.genre.split(', ');

        // Genre match
        movieGenres.forEach(g => {
            if (likedGenres.has(g)) score += 2;
        });

        // Boost high rated
        if (parseFloat(movie.rating) > 8.0) score += 1;

        // Boost new releases
        if (movie.year >= 2024) score += 1;

        // Penalty for already watched (simulated, ideally filtered out)
        const watched = watchHistory.some(h => h.movie_id === movie.id);
        if (watched) score = -1;

        return { ...movie, score };
    });

    // 3. Sort by score
    return scoredMovies
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
};

export const getTrending = () => {
    const allMovies = getAllMovies();
    // Simulate trending algorithm (random mix of high rated + new)
    return allMovies
        .filter(m => parseFloat(m.rating) > 7.5)
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
};

export const getNewReleases = () => {
    const allMovies = getAllMovies();
    return allMovies
        .filter(m => m.year >= 2023)
        .sort((a, b) => b.year - a.year)
        .slice(0, 10);
};
