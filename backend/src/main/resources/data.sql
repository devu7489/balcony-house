-- Seed data for local/demo use. Safe to remove for production.

-- Room inventory (name, pricing, unit counts) is no longer seeded here - it's driven by
-- app.hotel.rooms in application.yml and applied by HotelSeeder on every startup, so a new
-- deployment only needs that YAML block edited, not this file.

-- Migrate placeholder paths from .jpg (never populated) to the generated .svg placeholders
UPDATE experiences SET image_url = '/images/experiences/sunrise-coffee.svg' WHERE image_url = '/images/experiences/sunrise-coffee.jpg';
UPDATE experiences SET image_url = '/images/experiences/bonfire.svg' WHERE image_url = '/images/experiences/bonfire.jpg';
UPDATE experiences SET image_url = '/images/experiences/nature-walk.svg' WHERE image_url = '/images/experiences/nature-walk.jpg';
UPDATE cafe_items SET image_url = '/images/cafe/pour-over.svg' WHERE image_url = '/images/cafe/pour-over.jpg';
UPDATE cafe_items SET image_url = '/images/cafe/breakfast-bowl.svg' WHERE image_url = '/images/cafe/breakfast-bowl.jpg';

INSERT INTO experiences (title, description, image_url)
SELECT 'Sunrise Coffee', 'Start the day with a warm cup on your balcony as the mist lifts off the valley.', '/images/experiences/sunrise-coffee.svg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Sunrise Coffee');

INSERT INTO experiences (title, description, image_url)
SELECT 'Bonfire Evenings', 'Gather around the fire with fellow guests, stories, and a sky full of stars.', '/images/experiences/bonfire.svg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Bonfire Evenings');

INSERT INTO experiences (title, description, image_url)
SELECT 'Nature Walks', 'Guided or self-paced trails through pine forest and along mountain streams.', '/images/experiences/nature-walk.svg'
WHERE NOT EXISTS (SELECT 1 FROM experiences WHERE title = 'Nature Walks');

INSERT INTO cafe_items (name, description, image_url, category)
SELECT 'Mountain Pour-Over', 'Locally roasted single-origin beans, brewed slow.', '/images/cafe/pour-over.svg', 'coffee'
WHERE NOT EXISTS (SELECT 1 FROM cafe_items WHERE name = 'Mountain Pour-Over');

INSERT INTO cafe_items (name, description, image_url, category)
SELECT 'Garden Breakfast Bowl', 'Seasonal, local, and made to be eaten slowly with a view.', '/images/cafe/breakfast-bowl.svg', 'breakfast'
WHERE NOT EXISTS (SELECT 1 FROM cafe_items WHERE name = 'Garden Breakfast Bowl');

-- Migrate placeholder paths from .jpg (never populated) to the generated .svg placeholders
UPDATE gallery_images SET image_url = '/images/gallery/balcony-sunrise.svg' WHERE image_url = '/images/gallery/balcony-sunrise.jpg';
UPDATE gallery_images SET image_url = '/images/gallery/reading-corner.svg' WHERE image_url = '/images/gallery/reading-corner.jpg';

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/balcony-sunrise.svg', 'Balcony at sunrise', 'mountains', 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/balcony-sunrise.svg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/reading-corner.svg', 'A quiet reading corner', 'rooms', 2
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/reading-corner.svg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/cafe-corner.svg', 'Slow café mornings', 'cafe', 3
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/cafe-corner.svg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/forest-trail.svg', 'Pine forest trail', 'nature', 4
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/forest-trail.svg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/evening-bonfire.svg', 'Bonfire evenings', 'evenings', 5
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/evening-bonfire.svg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/mountain-view.svg', 'Mountain view', 'mountains', 6
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/mountain-view.svg');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'the-art-of-slow-mornings', 'The Art of Slow Mornings', 'Why we designed every room around the balcony, not the bed.',
       'We believe the best part of any stay is the fifteen minutes after you wake up...',
       '/images/journal/slow-mornings.jpg', now()
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'the-art-of-slow-mornings');
