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
        posterUrl: '/assets/breaking-bad.jpg',
        backdropUrl: '/assets/breaking-bad-backdrop.jpg',
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
    'the-crown': {
        id: 'the-crown',
        title: 'The Crown',
        posterUrl: '/assets/the-crown.jpg',
        backdropUrl: '/assets/the-crown-backdrop.jpg',
        rating: '8.6',
        year: '2016',
        seasonCount: 6,
        episodeCount: 60,
        genre: ['Drama', 'History', 'Biography'],
        description: 'The story of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
        trailerUrl: 'https://www.youtube.com/watch?v=JWtnJjn6ng0',
        cast: [
            { id: 1, name: 'Claire Foy', role: 'Queen Elizabeth II', image: '/assets/cast/claire.jpg' },
            { id: 2, name: 'Matt Smith', role: 'Prince Philip', image: '/assets/cast/matt.jpg' }
        ],
        creator: 'Peter Morgan',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2016',
                episodeCount: 10,
                episodes: [
                    {
                        id: 'tc-s1-e1',
                        episodeNumber: 1,
                        title: 'Wolferton Splash',
                        duration: '56m',
                        description: 'Princess Elizabeth and Prince Philip marry. King George VI\'s health worsens, while Winston Churchill is elected Prime Minister for the second time.',
                        thumbnailUrl: '/assets/episodes/tc-s1-e1.jpg',
                        videoUrl: sampleVideos[2],
                        airDate: '2016-11-04'
                    }
                ]
            }
        ]
    },

    'game-of-thrones': {
        id: 'game-of-thrones',
        title: 'Game of Thrones',
        posterUrl: '/assets/game-of-thrones.jpg',
        backdropUrl: '/assets/game-of-thrones-backdrop.jpg',
        rating: '9.2',
        year: '2011',
        seasonCount: 8,
        episodeCount: 73,
        genre: ['Fantasy', 'Drama', 'Action'],
        description: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
        trailerUrl: 'https://www.youtube.com/watch?v=KPLWWIOCOOQ',
        cast: [
            { id: 1, name: 'Emilia Clarke', role: 'Daenerys Targaryen', image: '/assets/cast/emilia.jpg' },
            { id: 2, name: 'Kit Harington', role: 'Jon Snow', image: '/assets/cast/kit.jpg' }
        ],
        creator: 'David Benioff, D.B. Weiss',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2011',
                episodeCount: 10,
                episodes: [
                    {
                        id: 'got-s1-e1',
                        episodeNumber: 1,
                        title: 'Winter Is Coming',
                        duration: '62m',
                        description: 'Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon.',
                        thumbnailUrl: '/assets/episodes/got-s1-e1.jpg',
                        videoUrl: sampleVideos[3],
                        airDate: '2011-04-17'
                    },
                    {
                        id: 'got-s1-e2',
                        episodeNumber: 2,
                        title: 'The Kingsroad',
                        duration: '56m',
                        description: 'While Bran recovers from his fall, Ned takes only his daughters to King\'s Landing. Jon Snow goes with his uncle Benjen to the Wall.',
                        thumbnailUrl: '/assets/episodes/got-s1-e2.jpg',
                        videoUrl: sampleVideos[0],
                        airDate: '2011-04-24'
                    }
                ]
            }
        ]
    },
    'the-witcher': {
        id: 'the-witcher',
        title: 'The Witcher',
        posterUrl: '/assets/the-witcher.jpg',
        backdropUrl: '/assets/the-witcher-backdrop.jpg',
        rating: '8.0',
        year: '2019',
        seasonCount: 3,
        episodeCount: 24,
        genre: ['Fantasy', 'Action', 'Adventure'],
        description: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
        trailerUrl: 'https://www.youtube.com/watch?v=ndl1W4ltcmg',
        cast: [
            { id: 1, name: 'Henry Cavill', role: 'Geralt of Rivia', image: '/assets/cast/henry.jpg' },
            { id: 2, name: 'Anya Chalotra', role: 'Yennefer', image: '/assets/cast/anya.jpg' }
        ],
        creator: 'Lauren Schmidt Hissrich',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2019',
                episodeCount: 8,
                episodes: [
                    {
                        id: 'tw-s1-e1',
                        episodeNumber: 1,
                        title: 'The End\'s Beginning',
                        duration: '61m',
                        description: 'Geralt of Rivia, a mutated monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
                        thumbnailUrl: '/assets/episodes/tw-s1-e1.jpg',
                        videoUrl: sampleVideos[1],
                        airDate: '2019-12-20'
                    }
                ]
            }
        ]
    },
    'dark': {
        id: 'dark',
        title: 'Dark',
        posterUrl: '/assets/dark.jpg',
        backdropUrl: '/assets/dark-backdrop.jpg',
        rating: '8.7',
        year: '2017',
        seasonCount: 3,
        episodeCount: 26,
        genre: ['Sci-Fi', 'Thriller', 'Mystery'],
        description: 'A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families.',
        trailerUrl: 'https://www.youtube.com/watch?v=rrwycJ08PSA',
        cast: [
            { id: 1, name: 'Louis Hofmann', role: 'Jonas Kahnwald', image: '/assets/cast/louis.jpg' },
            { id: 2, name: 'Lisa Vicari', role: 'Martha Nielsen', image: '/assets/cast/lisa.jpg' }
        ],
        creator: 'Baran bo Odar, Jantje Friese',
        seasons: [
            {
                seasonNumber: 1,
                title: 'Season 1',
                year: '2017',
                episodeCount: 10,
                episodes: [
                    {
                        id: 'dk-s1-e1',
                        episodeNumber: 1,
                        title: 'Secrets',
                        duration: '51m',
                        description: 'In 2019, a local boy\'s disappearance stokes fear in the residents of Winden, a small German town with a strange and tragic history.',
                        thumbnailUrl: '/assets/episodes/dk-s1-e1.jpg',
                        videoUrl: sampleVideos[2],
                        airDate: '2017-12-01'
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
