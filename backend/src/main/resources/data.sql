-- Seed data for local/demo use. Safe to remove for production.

INSERT INTO properties (name, description, price_per_night, max_guests, private_balcony, workspace_available, hero_image_url)
SELECT 'The Sunrise Room', 'A warm, sunlit room with an oversized private balcony facing the eastern ridge. Perfect for slow mornings and mountain coffee.', 8500.00, 2, true, true, '/images/rooms/sunrise-room.jpg'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'The Sunrise Room');

INSERT INTO properties (name, description, price_per_night, max_guests, private_balcony, workspace_available, hero_image_url)
SELECT 'The Pinewood Suite', 'Spacious suite with wood interiors, a reading nook, and views over the pine valley below.', 11500.00, 3, true, true, '/images/rooms/pinewood-suite.jpg'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'The Pinewood Suite');

INSERT INTO properties (name, description, price_per_night, max_guests, private_balcony, workspace_available, hero_image_url)
SELECT 'The Mist Cottage', 'A standalone cottage tucked against the tree line, quiet and private, with a fireplace for cool evenings.', 14000.00, 4, true, false, '/images/rooms/mist-cottage.jpg'
WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name = 'The Mist Cottage');

INSERT INTO experiences (title, description, image_url)
SELECT 'Sunrise Coffee', 'Start the day with a warm cup on your balcony as the mist lifts off the valley.', '/images/experiences/sunrise-coffee.jpg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Sunrise Coffee');

INSERT INTO experiences (title, description, image_url)
SELECT 'Bonfire Evenings', 'Gather around the fire with fellow guests, stories, and a sky full of stars.', '/images/experiences/bonfire.jpg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Bonfire Evenings');

INSERT INTO experiences (title, description, image_url)
SELECT 'Nature Walks', 'Guided or self-paced trails through pine forest and along mountain streams.', '/images/experiences/nature-walk.jpg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Nature Walks');

INSERT INTO cafe_items (name, description, image_url, category)
SELECT 'Mountain Pour-Over', 'Locally roasted single-origin beans, brewed slow.', '/images/cafe/pour-over.jpg', 'coffee'
WHERE NOT EXISTS (SELECT 1 FROM cafe_items WHERE name = 'Mountain Pour-Over');

INSERT INTO cafe_items (name, description, image_url, category)
SELECT 'Garden Breakfast Bowl', 'Seasonal, local, and made to be eaten slowly with a view.', '/images/cafe/breakfast-bowl.jpg', 'breakfast'
WHERE NOT EXISTS (SELECT 1 FROM cafe_items WHERE name = 'Garden Breakfast Bowl');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/balcony-sunrise.jpg', 'Balcony at sunrise', 'mountains', 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/balcony-sunrise.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/reading-corner.jpg', 'A quiet reading corner', 'rooms', 2
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/reading-corner.jpg');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'the-art-of-slow-mornings', 'The Art of Slow Mornings', 'Why we designed every room around the balcony, not the bed.',
       'We believe the best part of any stay is the fifteen minutes after you wake up...',
       '/images/journal/slow-mornings.jpg', now()
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'the-art-of-slow-mornings');
