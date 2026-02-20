// Movie data extracted from the original main.js
// Sample video URLs from Google's public sample videos for demo purposes
const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

export const movies = {
    'mujhse-dosti-karoge': {
    id: 'mujhse-dosti-karoge',
    title: 'Mujhse Dosti Karoge',
    genre: 'Romance/Drama',
    rating: 'PG',
    year: '2002',
    duration: '2h 29m',
    description: 'Childhood friends reconnect years later through letters, leading to love, confusion, and emotional choices.',
    posterUrl: '/assets/mujhse-dosti-karoge.jpg',
    backdropUrl: '/assets/mujhse-dosti-karoge-backdrop.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=9XlFQv3sY2A',
    videoUrl: sampleVideos[1]
},

'devdas': {
    id: 'devdas',
    title: 'Devdas',
    genre: 'Romance/Drama',
    rating: 'PG-13',
    year: '2002',
    duration: '3h 5m',
    description: 'A tragic love story of Devdas and Paro, whose romance is destroyed by family pride, leading Devdas toward self-destruction.',
    posterUrl: '/assets/devdas.jpg',
    backdropUrl: '/assets/devdas-backdrop.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Yc6dFJ6uX3s',
    videoUrl: sampleVideos[2]
}
    'tous-en-scene': {
        id: 'tous-en-scene',
        title: 'Tous En Scene',
        genre: 'Cartoon',
        rating: 'PG',
        year: '2024',
        duration: '1h 50m',
        description: 'A koala named Buster Moon hosts a singing competition to save his theater.',
        posterUrl: '/assets/tous-en-scene.jpg',
        backdropUrl: '/assets/tous-en-scene-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=Y7uGHY-t80I',
        videoUrl: sampleVideos[0]
    },
    'last-kingdom': {
        id: 'last-kingdom',
        title: 'The Last Kingdom',
        genre: 'Action',
        rating: 'TV-MA',
        year: '2024',
        duration: '1h 45m',
        description: 'As Alfred the Great defends his kingdom from Norse invaders, Uhtred--born a Saxon but raised by Vikings--seeks to claim his ancestral birthright.',
        posterUrl: '/assets/last-kingdom.jpg',
        backdropUrl: '/assets/last-kingdom-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=WxPApTGWwas',
        videoUrl: 'https://res.cloudinary.com/dnhwq1wwr/video/upload/v1769161101/day--8_l1kapf.mp4'
    },
    'love-death-robots': {
        id: 'love-death-robots',
        title: 'Love Death + Robots',
        genre: 'Thriller',
        rating: 'TV-MA',
        year: '2024',
        duration: '15m per ep',
        description: 'Terrifying creatures, wicked surprises and dark comedy converge in this NSFW anthology of animated stories.',
        posterUrl: '/assets/love-death-robots.jpg',
        backdropUrl: '/assets/love-death-robots-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=wUFwunMKa4E',
        videoUrl: sampleVideos[2]
    },
    'naruto': {
        id: 'naruto',
        title: 'Naruto',
        genre: 'Anime',
        rating: 'TV-14',
        year: '2024',
        duration: '24m per ep',
        description: 'Follow Naruto Uzumaki, a young ninja with a sealed demon within him...',
        posterUrl: '/assets/naruto.jpg',
        backdropUrl: '/assets/naruto-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=QczGoCmX-pI',
        videoUrl: sampleVideos[3]
    },
    'django': {
        id: 'django',
        title: 'Django Unchained',
        genre: 'Action',
        rating: 'R',
        year: '2024',
        duration: '2h 45m',
        description: 'With the help of a German bounty hunter, a freed slave sets out to rescue his wife...',
        posterUrl: '/assets/django.jpg',
        backdropUrl: '/assets/django-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=_iH0UBYDI4g',
        videoUrl: sampleVideos[0]
    },
    'shrek': {
        id: 'shrek',
        title: 'Shrek',
        genre: 'Fantasy',
        rating: 'PG',
        year: '2024',
        duration: '1h 30m',
        description: 'A mean lord exiles fairytale creatures to the swamp of a grumpy ogre...',
        posterUrl: '/assets/shrek.jpg',
        backdropUrl: '/assets/shrek-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=CwXOrWvPBPk',
        videoUrl: sampleVideos[1]
    },
    'breaking-bad': {
        id: 'breaking-bad',
        title: 'Breaking Bad',
        genre: 'Drama',
        rating: 'TV-MA',
        year: '2024',
        duration: '45m per ep',
        description: "A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family's financial future as he battles terminal lung cancer.",
        posterUrl: '/assets/breaking-bad.jpg',
        backdropUrl: '/assets/breaking-bad-backdrop.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
        videoUrl: sampleVideos[3]
    }
};

export const tvShows = {
    'stranger-things': {
        id: 'stranger-things',
        title: 'Stranger Things',
        posterUrl: '/assets/stranger-things.jpg',
        backdropUrl: '/assets/stranger-things-backdrop.jpg',
        rating: 'TV-14',
        year: '2016',
        duration: '4 Seasons',
        genre: 'Sci-Fi',
        description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
        cast: [
            { id: 1, name: 'Millie Bobby Brown', role: 'Eleven', image: 'https://image.tmdb.org/t/p/w200/j3s1nPry99uDkkHj2G1Y09r2P7U.jpg' },
            { id: 2, name: 'Finn Wolfhard', role: 'Mike Wheeler', image: 'https://image.tmdb.org/t/p/w200/j3s1nPry99uDkkHj2G1Y09r2P7U.jpg' },
            { id: 3, name: 'Winona Ryder', role: 'Joyce Byers', image: 'https://image.tmdb.org/t/p/w200/j3s1nPry99uDkkHj2G1Y09r2P7U.jpg' }
        ],
        crew: [
            { id: 1, name: 'The Duffer Brothers', role: 'Creator' }
        ],
        seasons: [
            {
                seasonNumber: 1,
                episodes: [
                    { id: 'st-s1-e1', title: 'Chapter One: The Vanishing of Will Byers', duration: '47m', overview: 'On his way home from a friend\'s house, young Will sees something terrifying. Nearby, a sinister secret lurks in the depths of a government lab.', stillUrl: '/assets/st-s1-e1.jpg' },
                    { id: 'st-s1-e2', title: 'Chapter Two: The Weirdo on Maple Street', duration: '55m', overview: 'Lucas, Mike and Dustin try to talk to the girl they found in the woods. Hopper questions an anxious Joyce about an unsettling phone call.', stillUrl: '/assets/st-s1-e2.jpg' },
                    { id: 'st-s1-e3', title: 'Chapter Three: Holly, Jolly', duration: '51m', overview: 'An increasingly concerned Nancy looks for Barb and finds out what Jonathan\'s been up to. Joyce is convinced Will is trying to talk to her.', stillUrl: '/assets/st-s1-e3.jpg' }
                ]
            },
            {
                seasonNumber: 2,
                episodes: [
                    { id: 'st-s2-e1', title: 'Chapter One: MADMAX', duration: '48m', overview: 'As the town preps for Halloween, a high-scoring rival shakes up the arcade\'s leaderboard, and a skeptical Hopper inspects a field of rotting pumpkins.', stillUrl: '/assets/st-s2-e1.jpg' },
                    { id: 'st-s2-e2', title: 'Chapter Two: Trick or Treat, Freak', duration: '56m', overview: 'After Will sees something terrible on trick-or-treat night, Mike wonders if Eleven is still out there. Nancy wrestles with the truth about Barb.', stillUrl: '/assets/st-s2-e2.jpg' }
                ]
            }
        ]
    },
    'breaking-bad': {
        id: 'breaking-bad',
        title: 'Breaking Bad',
        posterUrl: '/assets/breaking-bad.jpg',
        backdropUrl: '/assets/breaking-bad-backdrop.jpg',
        rating: 'TV-MA',
        year: '2008',
        duration: '5 Seasons',
        genre: 'Crime Drama',
        description: 'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family\'s financial future as he battles terminal lung cancer.',
        cast: [
            { id: 1, name: 'Bryan Cranston', role: 'Walter White', image: 'https://image.tmdb.org/t/p/w200/7T8c3kI3j5j3kI3j5j3k.jpg' },
            { id: 2, name: 'Aaron Paul', role: 'Jesse Pinkman', image: 'https://image.tmdb.org/t/p/w200/7T8c3kI3j5j3kI3j5j3k.jpg' }
        ],
        crew: [
            { id: 1, name: 'Vince Gilligan', role: 'Creator' }
        ],
        seasons: [
            {
                seasonNumber: 1,
                episodes: [
                    { id: 'bb-s1-e1', title: 'Pilot', duration: '58m', overview: 'Diagnosed with terminal lung cancer, chemistry teacher Walter White teams up with his former student Jesse Pinkman to cook and sell crystal meth.', stillUrl: '/assets/bb-s1-e1.jpg' },
                    { id: 'bb-s1-e2', title: 'Cat\'s in the Bag...', duration: '48m', overview: 'Walt and Jesse attempt to tie up loose ends. The desperate situation gets more complicated with the introduction of Krazy-8.', stillUrl: '/assets/bb-s1-e2.jpg' }
                ]
            }
        ]
    },
    'the-crown': {
        id: 'the-crown',
        title: 'The Crown',
        posterUrl: '/assets/the-crown.jpg',
        backdropUrl: '/assets/the-crown-backdrop.jpg',
        rating: 'TV-MA',
        year: '2016',
        duration: '6 Seasons',
        genre: 'Historical Drama',
        description: "The story of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
        cast: [
            { id: 1, name: 'Claire Foy', role: 'Queen Elizabeth II', image: 'https://image.tmdb.org/t/p/w200/7T8c3kI3j5j3kI3j5j3k.jpg' },
            { id: 2, name: 'Matt Smith', role: 'Prince Philip', image: 'https://image.tmdb.org/t/p/w200/7T8c3kI3j5j3kI3j5j3k.jpg' }
        ],
        crew: [
            { id: 1, name: 'Peter Morgan', role: 'Creator' }
        ],
        seasons: [
            {
                seasonNumber: 1,
                episodes: [
                    { id: 'tc-s1-e1', title: 'Wolferton Splash', duration: '56m', overview: 'Princess Elizabeth and Prince Philip marry. King George VI\'s health worsens, while Winston Churchill is elected Prime Minister for the second time.', stillUrl: '/assets/tc-s1-e1.jpg' },
                    { id: 'tc-s1-e2', title: 'Hyde Park Corner', duration: '61m', overview: 'With King George too ill to travel, Elizabeth and Philip embark on a four-continent Commonwealth tour. Party leaders attempt to remove Churchill.', stillUrl: '/assets/tc-s1-e2.jpg' }
                ]
            }
        ]
    }
};

export const getMovieById = (id) => movies[id];
export const getAllMovies = () => Object.values(movies);
export const getTvShowById = (id) => tvShows[id];
export const getAllTvShows = () => Object.values(tvShows);
