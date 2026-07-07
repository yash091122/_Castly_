// TV Shows data with full seasons and episodes structure
// Sample video URLs for demo
const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

export const tvShowsData = {
    'stranger-things': {
    id: 'stranger-things',
    title: 'Stranger Things',
    posterUrl: '/assets/stranger-things.jpg',
    backdropUrl: '/assets/stranger-things-backdrop.jpg',
    rating: '8.7',
    year: '2016',
    seasonCount: 5,
    episodeCount: 42,
    genre: ['Sci-Fi', 'Horror', 'Drama'],
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
    trailerUrl: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    cast: [
        { id: 1, name: 'Millie Bobby Brown', role: 'Eleven', image: '/assets/cast/millie.jpg' },
        { id: 2, name: 'Finn Wolfhard', role: 'Mike Wheeler', image: '/assets/cast/finn.jpg' },
        { id: 3, name: 'Winona Ryder', role: 'Joyce Byers', image: '/assets/cast/winona.jpg' },
        { id: 4, name: 'David Harbour', role: 'Jim Hopper', image: '/assets/cast/david.jpg' }
    ],
    creator: 'The Duffer Brothers',
    seasons: [
        {
            seasonNumber: 1,
            title: 'Season 1',
            year: '2016',
            episodeCount: 8,
            episodes: [
                { id: 'st-s1-e1', episodeNumber: 1, title: 'Chapter One: The Vanishing of Will Byers', duration: '49m', description: '', thumbnailUrl: '/assets/episodes/st-s1-e1.jpg', videoUrl: sampleVideos[0], airDate: '2016-07-15' },
                { id: 'st-s1-e2', episodeNumber: 2, title: 'Chapter Two: The Weirdo on Maple Street', duration: '55m', description: '', thumbnailUrl: '/assets/episodes/st-s1-e2.jpg', videoUrl: sampleVideos[1], airDate: '2016-07-15' },
                { id: 'st-s1-e3', episodeNumber: 3, title: 'Chapter Three: Holly, Jolly', duration: '51m', description: '', thumbnailUrl: '/assets/episodes/st-s1-e3.jpg', videoUrl: sampleVideos[2], airDate: '2016-07-15' },
                { id: 'st-s1-e4', episodeNumber: 4, title: 'Chapter Four: The Body', duration: '50m', description: '', thumbnailUrl: '/assets/episodes/st-s1-e4.jpg', videoUrl: sampleVideos[3], airDate: '2016-07-15' },
                { id: 'st-s1-e5', episodeNumber: 5, title: 'Chapter Five: The Flea and the Acrobat', duration: '50m', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2016-07-15' },
                { id: 'st-s1-e6', episodeNumber: 6, title: 'Chapter Six: The Monster', duration: '55m', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2016-07-15' },
                { id: 'st-s1-e7', episodeNumber: 7, title: 'Chapter Seven: The Bathtub', duration: '50m', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2016-07-15' },
                { id: 'st-s1-e8', episodeNumber: 8, title: 'Chapter Eight: The Upside Down', duration: '55m', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2016-07-15' }
            ]
        },
        {
            seasonNumber: 2,
            title: 'Season 2',
            year: '2017',
            episodeCount: 9,
            episodes: [
                { id: 'st-s2-e1', episodeNumber: 1, title: 'Chapter One: MADMAX', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e2', episodeNumber: 2, title: 'Chapter Two: Trick or Treat, Freak', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e3', episodeNumber: 3, title: 'Chapter Three: The Pollywog', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e4', episodeNumber: 4, title: 'Chapter Four: Will the Wise', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e5', episodeNumber: 5, title: 'Chapter Five: Dig Dug', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e6', episodeNumber: 6, title: 'Chapter Six: The Spy', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e7', episodeNumber: 7, title: 'Chapter Seven: The Lost Sister', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e8', episodeNumber: 8, title: 'Chapter Eight: The Mind Flayer', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' },
                { id: 'st-s2-e9', episodeNumber: 9, title: 'Chapter Nine: The Gate', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2017-10-27' }
            ]
        },
        {
            seasonNumber: 3,
            title: 'Season 3',
            year: '2019',
            episodeCount: 8,
            episodes: [
                { id: 'st-s3-e1', episodeNumber: 1, title: 'Chapter One: Suzie, Do You Copy?', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e2', episodeNumber: 2, title: 'Chapter Two: The Mall Rats', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e3', episodeNumber: 3, title: 'Chapter Three: The Case of the Missing Lifeguard', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e4', episodeNumber: 4, title: 'Chapter Four: The Sauna Test', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e5', episodeNumber: 5, title: 'Chapter Five: The Flayed', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e6', episodeNumber: 6, title: 'Chapter Six: E Pluribus Unum', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e7', episodeNumber: 7, title: 'Chapter Seven: The Bite', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' },
                { id: 'st-s3-e8', episodeNumber: 8, title: 'Chapter Eight: The Battle of Starcourt', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2019-07-04' }
            ]
        },
        {
            seasonNumber: 4,
            title: 'Season 4',
            year: '2022',
            episodeCount: 9,
            episodes: [
                { id: 'st-s4-e1', episodeNumber: 1, title: 'Chapter One: The Hellfire Club', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e2', episodeNumber: 2, title: 'Chapter Two: Vecna\'s Curse', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e3', episodeNumber: 3, title: 'Chapter Three: The Monster and the Superhero', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e4', episodeNumber: 4, title: 'Chapter Four: Dear Billy', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e5', episodeNumber: 5, title: 'Chapter Five: The Nina Project', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e6', episodeNumber: 6, title: 'Chapter Six: The Dive', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e7', episodeNumber: 7, title: 'Chapter Seven: The Massacre at Hawkins Lab', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-05-27' },
                { id: 'st-s4-e8', episodeNumber: 8, title: 'Chapter Eight: Papa', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-07-01' },
                { id: 'st-s4-e9', episodeNumber: 9, title: 'Chapter Nine: The Piggyback', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2022-07-01' }
            ]
        },
        {
            seasonNumber: 5,
            title: 'Season 5',
            year: '2025',
            episodeCount: 8,
            episodes: [
                { id: 'st-s5-e1', episodeNumber: 1, title: 'Chapter One: The Crawl', duration: '60m', description: 'The final season begins...', thumbnailUrl: '', videoUrl: 'https://s3.tebi.io/moviesott/EP01 Stanger Things 2025 S05 %5BJOIN TELEGRAM %40HUBCON%5D ORG Hindi 720p BluRay HD.mkv', airDate: '2025-11-26' },
                { id: 'st-s5-e2', episodeNumber: 2, title: 'Chapter Two: The Vanishing of Holly Wheeler', duration: '', description: '', thumbnailUrl: '', videoUrl: 'https://s3.tebi.io/moviesott/day--8.mp4', airDate: '2025-11-26' },
                { id: 'st-s5-e3', episodeNumber: 3, title: 'Chapter Three: The Turnbow Trap', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-11-26' },
                { id: 'st-s5-e4', episodeNumber: 4, title: 'Chapter Four: Sorcerer', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-11-26' },
                { id: 'st-s5-e5', episodeNumber: 5, title: 'Chapter Five: Shock Jock', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-12-25' },
                { id: 'st-s5-e6', episodeNumber: 6, title: 'Chapter Six: Escape from Camazotz', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-12-25' },
                { id: 'st-s5-e7', episodeNumber: 7, title: 'Chapter Seven: The Bridge', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-12-25' },
                { id: 'st-s5-e8', episodeNumber: 8, title: 'Chapter Eight: The Rightside Up', duration: '', description: '', thumbnailUrl: '', videoUrl: '', airDate: '2025-12-31' }
            ]
        }
    ]
},
    'breaking-bad': {
        id: 'breaking-bad',
        title: 'Breaking Bad',
        posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDmFvLf6sFLAwApSKkllc-p6ZZ6SVRruqpcQoeJ6Xiyw&s=10',
        backdropUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDmFvLf6sFLAwApSKkllc-p6ZZ6SVRruqpcQoeJ6Xiyw&s=10',
        rating: '9.5',
        year: '2008',
        seasonCount: 5,
        episodeCount: 62,
        genre: ['Crime', 'Drama', 'Thriller'],
        description: 'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family\'s financial future as he battles terminal lung cancer.',
        trailerUrl: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
        cast: [
            { id: 1, name: 'Bryan Cranston', role: 'Walter White', image: '/assets/cast/bryan.jpg' },
            { id: 2, name: 'Aaron Paul', role: 'Jesse Pinkman', image: '/assets/cast/aaron.jpg' },
            { id: 3, name: 'Anna Gunn', role: 'Skyler White', image: '/assets/cast/anna.jpg' }
        ],
        creator: 'Vince Gilligan',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2008',
                episodeCount: 7,
                episodes: [
                    {
                        id: 'bb-s1-e1',
                        episodeNumber: 1,
                        title: 'Pilot',
                        duration: '58m',
                        description: 'Diagnosed with terminal lung cancer, chemistry teacher Walter White teams up with his former student Jesse Pinkman to cook and sell crystal meth.',
                        thumbnailUrl: '/assets/episodes/bb-s1-e1.jpg',
                        videoUrl: sampleVideos[0],
                        airDate: '2008-01-20'
                    },
                    {
                        id: 'bb-s1-e2',
                        episodeNumber: 2,
                        title: 'Cat\'s in the Bag...',
                        duration: '48m',
                        description: 'Walt and Jesse attempt to tie up loose ends. The desperate situation gets more complicated with the introduction of Krazy-8.',
                        thumbnailUrl: '/assets/episodes/bb-s1-e2.jpg',
                        videoUrl: sampleVideos[1],
                        airDate: '2008-01-27'
                    }
                ]
            }
        ]
    },
    'mirzapur': {
        id: 'mirzapur',
        title: 'Mirzapur',
        posterUrl: 'https://m.media-amazon.com/images/I/91Wr90x8YmL._AC_UF894,1000_QL80_.jpg',
        backdropUrl: 'https://m.media-amazon.com/images/I/91Wr90x8YmL._AC_UF894,1000_QL80_.jpg',
        rating: '8.5',
        year: '2018',
        seasonCount: 3,
        episodeCount: 29,
        genre: ['Crime', 'Drama', 'Action'],
        description: 'A shocking incident at a wedding procession ignites a series of events entangling the lives of two families in the lawless city of Mirzapur.',
        trailerUrl: 'https://www.youtube.com/watch?v=ZNeGF-PvRqw',
        cast: [
            { id: 1, name: 'Pankaj Tripathi', role: 'Kaleen Bhaiya', image: '/assets/cast/pankaj.jpg' },
            { id: 2, name: 'Ali Fazal', role: 'Guddu Pandit', image: '/assets/cast/ali.jpg' }
        ],
        creator: 'Karan Anshuman, Puneet Krishna',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2018',
                episodeCount: 9,
                episodes: [
                    {
                        id: 'mz-s1-e1',
                        episodeNumber: 1,
                        title: 'Jhandu',
                        duration: '50m',
                        description: 'A shocking incident at a wedding procession ignites a series of events.',
                        thumbnailUrl: 'https://m.media-amazon.com/images/I/715QeQWqgPL.jpg',
                        videoUrl: sampleVideos[0],
                        airDate: '2018-11-16'
                    }
                ]
            }
        ]
    },
    'scam-1992': {
        id: 'scam-1992',
        title: 'Scam 1992',
        posterUrl: 'https://www.insideboxoffice.com/wp-content/uploads/2024/12/Scam-1992-Copy.jpg',
        backdropUrl: 'https://www.insideboxoffice.com/wp-content/uploads/2024/12/Scam-1992-Copy.jpg',
        rating: '9.3',
        year: '2020',
        seasonCount: 1,
        episodeCount: 10,
        genre: ['Biography', 'Crime', 'Drama'],
        description: 'Set in 1980\'s and 90\'s Bombay, it follows the life of Harshad Mehta, a stockbroker who took the stock market to dizzying heights and his catastrophic downfall.',
        trailerUrl: 'https://www.youtube.com/watch?v=ISORiefWEh8',
        cast: [
            { id: 1, name: 'Pratik Gandhi', role: 'Harshad Mehta', image: '/assets/cast/pratik.jpg' },
            { id: 2, name: 'Shreya Dhanwanthary', role: 'Sucheta Dalal', image: '/assets/cast/shreya.jpg' }
        ],
        creator: 'Hansal Mehta',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2020',
                episodeCount: 10,
                episodes: [
                    {
                        id: 'scam-s1-e1',
                        episodeNumber: 1,
                        title: 'Risk Hai Toh Ishq Hai',
                        duration: '45m',
                        description: 'Harshad Mehta starts his journey in the stock market.',
                        thumbnailUrl: 'https://m.media-amazon.com/images/I/71oD1sE37LL.jpg',
                        videoUrl: sampleVideos[1],
                        airDate: '2020-10-09'
                    }
                ]
            }
        ]
    },
    'panchayat': {
        id: 'panchayat',
        title: 'Panchayat',
        posterUrl: 'https://mir-s3-cdn-cf.behance.net/projects/404/4ae83f198831413.Y3JvcCw0ODA3LDM3NjAsNDE2LDA.jpg',
        backdropUrl: 'https://mir-s3-cdn-cf.behance.net/projects/404/4ae83f198831413.Y3JvcCw0ODA3LDM3NjAsNDE2LDA.jpg',
        rating: '8.9',
        year: '2020',
        seasonCount: 3,
        episodeCount: 24,
        genre: ['Comedy', 'Drama'],
        description: 'A comedy-drama, which captures the journey of an engineering graduate Abhishek, who for lack of a better job option joins as secretary of a panchayat office in a remote village of Uttar Pradesh.',
        trailerUrl: 'https://www.youtube.com/watch?v=mojZ5qwUMMs',
        cast: [
            { id: 1, name: 'Jitendra Kumar', role: 'Abhishek Tripathi', image: '/assets/cast/jitendra.jpg' },
            { id: 2, name: 'Raghubir Yadav', role: 'Brij Bhushan Dubey', image: '/assets/cast/raghubir.jpg' }
        ],
        creator: 'Deepak Kumar Mishra',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2020',
                episodeCount: 8,
                episodes: [
                    {
                        id: 'pn-s1-e1',
                        episodeNumber: 1,
                        title: 'Gram Panchayat Phulera',
                        duration: '35m',
                        description: 'Abhishek Tripathi arrives in Phulera.',
                        thumbnailUrl: 'https://m.media-amazon.com/images/I/71pE1+U0PFL.jpg',
                        videoUrl: sampleVideos[2],
                        airDate: '2020-04-03'
                    }
                ]
            }
        ]
    }
};

// Helper functions
export const getTvShowById = (id) => tvShowsData[id];
export const getAllTvShows = () => Object.values(tvShowsData);

export const getEpisodeById = (showId, seasonNum, episodeNum) => {
    const show = tvShowsData[showId];
    if (!show) return null;
    const season = show.seasons.find(s => s.seasonNumber === parseInt(seasonNum));
    if (!season) return null;
    return season.episodes.find(e => e.episodeNumber === parseInt(episodeNum));
};

export const getNextEpisode = (showId, seasonNum, episodeNum) => {
    const show = tvShowsData[showId];
    if (!show) return null;

    const currentSeason = show.seasons.find(s => s.seasonNumber === parseInt(seasonNum));
    if (!currentSeason) return null;

    const currentEpIndex = currentSeason.episodes.findIndex(e => e.episodeNumber === parseInt(episodeNum));

    // Check if there's a next episode in current season
    if (currentEpIndex < currentSeason.episodes.length - 1) {
        return {
            ...currentSeason.episodes[currentEpIndex + 1],
            seasonNumber: currentSeason.seasonNumber
        };
    }

    // Check if there's a next season
    const nextSeason = show.seasons.find(s => s.seasonNumber === parseInt(seasonNum) + 1);
    if (nextSeason && nextSeason.episodes.length > 0) {
        return {
            ...nextSeason.episodes[0],
            seasonNumber: nextSeason.seasonNumber
        };
    }

    return null;
};

export const getTrendingShows = () => {
    return getAllTvShows().sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 10);
};

export const getNewEpisodes = () => {
    const shows = getAllTvShows();
    const episodes = [];
    shows.forEach(show => {
        show.seasons.forEach(season => {
            season.episodes.forEach(ep => {
                episodes.push({
                    ...ep,
                    showId: show.id,
                    showTitle: show.title,
                    showPoster: show.posterUrl,
                    seasonNumber: season.seasonNumber
                });
            });
        });
    });
    return episodes.sort((a, b) => new Date(b.airDate) - new Date(a.airDate)).slice(0, 10);
};

export const getTopRatedShows = () => {
    return getAllTvShows().sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
};

export const getPopularShows = () => {
    return getAllTvShows().sort(() => Math.random() - 0.5);
};

// Get personalized "Because You Watched" recommendations based on a show's genres
export const getBecauseYouWatched = (showId) => {
    const show = tvShowsData[showId];
    if (!show || !show.genre) return [];

    return getAllTvShows()
        .filter(s => s.id !== showId && s.genre?.some(g => show.genre.includes(g)))
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 6);
};
