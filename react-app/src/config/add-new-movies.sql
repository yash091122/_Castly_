-- Add Mujhse Dosti Karoge and Devdas to movies table
-- Note: Using gen_random_uuid() for UUID generation

INSERT INTO movies (
    id,
    title,
    genre,
    rating,
    year,
    duration,
    description,
    poster_url,
    banner_url,
    trailer_url,
    video_url,
    status,
    created_at
) VALUES 
(
    gen_random_uuid(),
    'Mujhse Dosti Karoge',
    'Romance/Drama',
    7.5,
    2002,
    '2h 29m',
    'Childhood friends reconnect years later through letters, leading to love, confusion, and emotional choices.',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4KPy7NZS2LUK-yKJ1yoprlTPKs0XGx0rE-Q&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4KPy7NZS2LUK-yKJ1yoprlTPKs0XGx0rE-Q&s',
    'https://www.youtube.com/watch?v=9XlFQv3sY2A',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'published',
    NOW()
),
(
    gen_random_uuid(),
    'Devdas',
    'Romance/Drama',
    8.0,
    2002,
    '3h 5m',
    'A tragic love story of Devdas and Paro, whose romance is destroyed by family pride, leading Devdas toward self-destruction.',
    'https://www.scenetheworld.com/wp-content/uploads/2017/03/Devdas-800x500.jpg',
    'https://www.scenetheworld.com/wp-content/uploads/2017/03/Devdas-800x500.jpg',
    'https://www.youtube.com/watch?v=Yc6dFJ6uX3s',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'published',
    NOW()
);

-- Verify the movies were added
SELECT id, title, genre, year, status FROM movies WHERE title IN ('Mujhse Dosti Karoge', 'Devdas') ORDER BY title;
