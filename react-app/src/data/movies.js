// Movie data extracted from the original main.js
// Sample video URLs from Google's public sample videos for demo purposes
const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

export const movies = {
    'ek-deewane-ki-deewaniyat': {
        id: 'ek-deewane-ki-deewaniyat',
        title: 'Ek Deewane Ki Deewaniyat',
        genre: 'Romance/Drama',
        rating: 'PG',
        year: '2013',
        duration: '2h 20m',
        description: 'A passionate young man falls deeply in love and goes to extreme lengths to win the heart of the woman he desires, leading to an emotional journey of obsession, sacrifice, and redemption.',
        posterUrl: 'https://wallpapercave.com/wp/wp15917490.jpg',
        backdropUrl: 'https://wallpapercave.com/wp/wp15917490.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=YOUR_TRAILER_LINK',
        videoUrl: 'https://s3.tebi.io/moviesott/Ek.Deewane.Ki.Deewaniyat.2025.720p.Hindi.DS4K.WEB-DL.5.1.x264.mkv'
    },
    'mujhse-dosti-karoge': {
        id: 'mujhse-dosti-karoge',
        title: 'Mujhse Dosti Karoge',
        genre: 'Romance/Drama',
        rating: 'PG',
        year: '2002',
        duration: '2h 29m',
        description: 'Childhood friends reconnect years later through letters, leading to love, confusion, and emotional choices.',
        posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4KPy7NZS2LUK-yKJ1yoprlTPKs0XGx0rE-Q&s',
        backdropUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4KPy7NZS2LUK-yKJ1yoprlTPKs0XGx0rE-Q&s',
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
        posterUrl: 'https://www.scenetheworld.com/wp-content/uploads/2017/03/Devdas-800x500.jpg',
        backdropUrl: 'https://www.scenetheworld.com/wp-content/uploads/2017/03/Devdas-800x500.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=Yc6dFJ6uX3s',
        videoUrl: 'https://s3.tebi.io/moviesott/Devdas%20%282002%29%20Bollywood%20Hindi%20Movie%20HD%20720p%20ESub.mkv'
    },
    '3-idiots': {
        id: '3-idiots',
        title: '3 Idiots',
        genre: 'Comedy/Drama',
        rating: 'PG-13',
        year: '2009',
        duration: '2h 50m',
        description: 'Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.',
        posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTho8rAiVeMC8iT6qxNDI9b-Eg3-7BaNjR0S6xXF_0F0g&s=10',
        backdropUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTho8rAiVeMC8iT6qxNDI9b-Eg3-7BaNjR0S6xXF_0F0g&s=10',
        trailerUrl: 'https://www.youtube.com/watch?v=K0eDlFX9GMc',
        videoUrl: sampleVideos[0]
    },
    'dangal': {
        id: 'dangal',
        title: 'Dangal',
        genre: 'Biography/Sports',
        rating: 'Not Rated',
        year: '2016',
        duration: '2h 41m',
        description: 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.',
        posterUrl: 'https://assets-in.bmscdn.com/discovery-catalog/events/et00033292-yqlxhqwthg-landscape.jpg',
        backdropUrl: 'https://assets-in.bmscdn.com/discovery-catalog/events/et00033292-yqlxhqwthg-landscape.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=x_7YlGv9u1g',
        videoUrl: sampleVideos[1]
    },
    'k3g': {
        id: 'k3g',
        title: 'Kabhi Khushi Kabhie Gham',
        genre: 'Family/Drama',
        rating: 'Not Rated',
        year: '2001',
        duration: '3h 30m',
        description: 'Yashvardhan Raichand lives a very wealthy lifestyle along with his wife, Nandini, and two sons, Rahul and Rohan. Things change when Rahul falls in love with a poor girl.',
        posterUrl: 'https://indianetzone.wordpress.com/wp-content/uploads/2019/01/kabhi-khushi-kabhie-gham_1000x563.jpg?w=760',
        backdropUrl: 'https://indianetzone.wordpress.com/wp-content/uploads/2019/01/kabhi-khushi-kabhie-gham_1000x563.jpg?w=760',
        trailerUrl: 'https://www.youtube.com/watch?v=7uY1JbWZKkM',
        videoUrl: sampleVideos[2]
    },
    'sholay': {
        id: 'sholay',
        title: 'Sholay',
        genre: 'Action/Adventure',
        rating: 'Not Rated',
        year: '1975',
        duration: '3h 24m',
        description: 'After his family is murdered by a notorious and ruthless bandit, a former police officer enlists the services of two outlaws to capture the bandit.',
        posterUrl: 'https://m.media-amazon.com/images/I/61PyG9n9U9L.jpg',
        backdropUrl: 'https://m.media-amazon.com/images/I/61PyG9n9U9L.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=qE3OQ_T9Poo',
        videoUrl: sampleVideos[0]
    },
    'lagaan': {
        id: 'lagaan',
        title: 'Lagaan',
        genre: 'Drama/Sports',
        rating: 'PG',
        year: '2001',
        duration: '3h 44m',
        description: 'The people of a small village in Victorian India stake their future on a game of cricket against their ruthless British rulers.',
        posterUrl: 'https://learningandcreativity.com/silhouette/wp-content/uploads/sites/3/2020/06/lagaan-poster.jpg',
        backdropUrl: 'https://learningandcreativity.com/silhouette/wp-content/uploads/sites/3/2020/06/lagaan-poster.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=oSIGQ0YkFcg',
        videoUrl: sampleVideos[1]
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