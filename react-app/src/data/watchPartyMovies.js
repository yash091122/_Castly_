// Watch Party Movies with Real Video URLs
// Using free sample videos for demonstration

export const watchPartyMovies = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
    genre: 'Animation',
    duration: '10 min',
    year: '2008',
    rating: 'G',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    backdrop: 'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://peach.blender.org/wp-content/uploads/poster_rodents_small.jpg'
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    description: 'Two strange characters explore a capricious and seemingly infinite machine. The elder, Proog, acts as a tour-guide and protector.',
    genre: 'Animation',
    duration: '11 min',
    year: '2006',
    rating: 'G',
    poster: 'https://orange.blender.org/wp-content/themes/orange/images/media/posters/01_poster_bunny_small.jpg',
    backdrop: 'https://orange.blender.org/wp-content/themes/orange/images/media/screenshots/01_screenshot_bunny.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://orange.blender.org/wp-content/themes/orange/images/media/screenshots/01_screenshot_bunny.jpg'
  },
  {
    id: 'sintel',
    title: 'Sintel',
    description: 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales. But when he is kidnapped by an adult dragon, Sintel decides to embark on a dangerous quest to find her lost friend.',
    genre: 'Fantasy',
    duration: '15 min',
    year: '2010',
    rating: 'PG',
    poster: 'https://durian.blender.org/wp-content/uploads/2010/06/sintel-poster.jpg',
    backdrop: 'https://durian.blender.org/wp-content/uploads/2010/06/01_sintel_dragon.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://durian.blender.org/wp-content/uploads/2010/06/01_sintel_dragon.jpg'
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    description: 'In an apocalyptic future, a group of soldiers and scientists takes refuge in Amsterdam to try to stop an army of robots that threatens the planet.',
    genre: 'Sci-Fi',
    duration: '12 min',
    year: '2012',
    rating: 'PG-13',
    poster: 'https://mango.blender.org/wp-content/uploads/2012/09/poster_rodents_small.jpg',
    backdrop: 'https://mango.blender.org/wp-content/uploads/2012/09/01_thom_celia_bridge.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://mango.blender.org/wp-content/uploads/2012/09/01_thom_celia_bridge.jpg'
  },
  {
    id: 'for-bigger-blazes',
    title: 'For Bigger Blazes',
    description: 'Experience the thrill of adventure in stunning 4K quality.',
    genre: 'Adventure',
    duration: '15 sec',
    year: '2024',
    rating: 'G',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    backdrop: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
  },
  {
    id: 'for-bigger-escape',
    title: 'For Bigger Escape',
    description: 'Escape into a world of wonder and excitement.',
    genre: 'Adventure',
    duration: '15 sec',
    year: '2024',
    rating: 'G',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    backdrop: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg'
  }
];

export const getMovieById = (id) => {
  return watchPartyMovies.find(movie => movie.id === id);
};

export const getAllMovies = () => {
  return watchPartyMovies;
};
