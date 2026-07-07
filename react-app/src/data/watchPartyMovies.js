// Watch Party Movies with Real Video URLs
// Using free sample videos for demonstration

export const watchPartyMovies = [
  {
    id: '3-idiots',
    title: '3 Idiots',
    description: 'Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.',
    genre: 'Comedy/Drama',
    duration: '2h 50m',
    year: '2009',
    rating: 'PG-13',
    poster: 'https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg',
    backdrop: '/assets/3-idiots-backdrop.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg'
  },
  {
    id: 'dangal',
    title: 'Dangal',
    description: 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.',
    genre: 'Biography/Sports',
    duration: '2h 41m',
    year: '2016',
    rating: 'Not Rated',
    poster: 'https://upload.wikimedia.org/wikipedia/en/9/99/Dangal_Poster.jpg',
    backdrop: '/assets/dangal-backdrop.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/9/99/Dangal_Poster.jpg'
  },
  {
    id: 'k3g',
    title: 'Kabhi Khushi Kabhie Gham',
    description: 'Yashvardhan Raichand lives a very wealthy lifestyle along with his wife, Nandini, and two sons, Rahul and Rohan. Things change when Rahul falls in love with a poor girl.',
    genre: 'Family/Drama',
    duration: '3h 30m',
    year: '2001',
    rating: 'Not Rated',
    poster: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Kabhi_Khushi_Kabhie_Gham_poster.jpg',
    backdrop: '/assets/k3g-backdrop.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Kabhi_Khushi_Kabhie_Gham_poster.jpg'
  }
];

export const getMovieById = (id) => {
  return watchPartyMovies.find(movie => movie.id === id);
};

export const getAllMovies = () => {
  return watchPartyMovies;
};
