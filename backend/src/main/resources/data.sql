-- Seed data for local/demo use. Safe to remove for production.

-- Room inventory (name, pricing, unit counts) is no longer seeded here - it's driven by
-- app.hotel.rooms in application.yml and applied by HotelSeeder on every startup, so a new
-- deployment only needs that YAML block edited, not this file.

-- Real photos replacing the illustrated placeholders, as they're supplied
UPDATE experiences SET image_url = '/images/experiences/sunrise-coffee.jpg' WHERE image_url = '/images/experiences/sunrise-coffee.svg';
UPDATE experiences SET image_url = '/images/experiences/bonfire.jpg' WHERE image_url = '/images/experiences/bonfire.svg';
UPDATE experiences SET image_url = '/images/experiences/nature-walk.jpg' WHERE image_url = '/images/experiences/nature-walk.svg';
UPDATE cafe_items SET image_url = '/images/cafe/pour-over.jpg' WHERE image_url = '/images/cafe/pour-over.svg';
UPDATE cafe_items SET image_url = '/images/cafe/breakfast-bowl.jpg' WHERE image_url = '/images/cafe/breakfast-bowl.svg';

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

-- Dropped from the gallery - no replacement photo for this slot
DELETE FROM gallery_images WHERE image_url IN ('/images/gallery/reading-corner.svg', '/images/gallery/reading-corner.jpg');

-- Real photos replacing the illustrated placeholders, as they're supplied
UPDATE gallery_images SET image_url = '/images/gallery/balcony-sunrise.jpg' WHERE image_url = '/images/gallery/balcony-sunrise.svg';
UPDATE gallery_images SET image_url = '/images/gallery/kids-play-zone.jpg' WHERE image_url = '/images/gallery/kids-play-zone.png';
UPDATE gallery_images SET image_url = '/images/gallery/coffee-morning.jpg' WHERE image_url = '/images/gallery/cafe-corner.svg';
UPDATE gallery_images SET image_url = '/images/gallery/mountain-trail.jpg', caption = 'Mountain trail' WHERE image_url = '/images/gallery/forest-trail.svg';
UPDATE gallery_images SET image_url = '/images/gallery/bonfire-night.jpg' WHERE image_url = '/images/gallery/evening-bonfire.svg';
UPDATE gallery_images SET image_url = '/images/gallery/mountain-view.jpg' WHERE image_url = '/images/gallery/mountain-view.svg';

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/balcony-sunrise.jpg', 'Balcony at sunrise', 'mountains', 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/balcony-sunrise.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/coffee-morning.jpg', 'Slow café mornings', 'cafe', 3
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/coffee-morning.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/mountain-trail.jpg', 'Mountain trail', 'nature', 4
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/mountain-trail.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/bonfire-night.jpg', 'Bonfire evenings', 'evenings', 5
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/bonfire-night.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/mountain-view.jpg', 'Mountain view', 'mountains', 6
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/mountain-view.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/kids-play-zone.jpg', 'Kids Play Zone, guided by experienced nannies', 'kids', 7
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/kids-play-zone.jpg');

INSERT INTO gallery_images (image_url, caption, category, sort_order)
SELECT '/images/gallery/coworking-space.jpg', 'Common co-working space', 'workspace', 8
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = '/images/gallery/coworking-space.jpg');

-- Replace the placeholder single-sentence post (and its never-populated .jpg cover) with
-- the real article - this only ever touches the one seeded row, there's no admin journal
-- editor yet for a guest to have overwritten it with something of their own.
UPDATE journal_posts SET
  excerpt = 'Why we designed every room around the balcony, not the bed.',
  content = E'We believe the best part of any stay is the fifteen minutes after you wake up. Not the sightseeing, not the itinerary — just the quiet stretch between opening your eyes and stepping outside, coffee in hand, to see what the mountains decided to do with the morning light.\n\nThat''s the whole idea behind every room here. Long before we talked about thread counts or minibar snacks, we talked about where the bed should sit relative to the balcony door — because the answer to "what does a great mountain stay feel like" was never going to be found lying down.\n\nSo the balconies came first. Wide enough for two chairs and a small table, always facing the valley, always catching the sun before the rest of the room does. The bed is comfortable, of course. But it is not the point. The point is the ten minutes you''ll spend leaning on that railing, mist still sitting in the trees below, before the day asks anything of you.\n\nGuests tell us this is what they remember months later — not a single meal or activity, but that one unhurried morning. We''re fine with that. It''s exactly what we built for.',
  cover_image_url = '/images/journal/slow-mornings.svg',
  published_at = now() - interval '35 days'
WHERE slug = 'the-art-of-slow-mornings'
  AND content = 'We believe the best part of any stay is the fifteen minutes after you wake up...';

-- Real photos replacing the illustrated placeholders, as they're supplied
UPDATE journal_posts SET cover_image_url = '/images/journal/slow-mornings.jpg' WHERE cover_image_url = '/images/journal/slow-mornings.svg';
UPDATE journal_posts SET cover_image_url = '/images/journal/room-with-a-desk.jpg' WHERE cover_image_url = '/images/journal/room-with-a-desk.svg';
UPDATE journal_posts SET cover_image_url = '/images/journal/kids-play-zone.jpg' WHERE cover_image_url = '/images/journal/kids-play-zone.svg';
UPDATE journal_posts SET cover_image_url = '/images/journal/full-board.jpg' WHERE cover_image_url = '/images/journal/full-board.svg';
UPDATE journal_posts SET cover_image_url = '/images/journal/bonfire-nights.jpg' WHERE cover_image_url = '/images/journal/bonfire-nights.svg';

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'the-art-of-slow-mornings', 'The Art of Slow Mornings', 'Why we designed every room around the balcony, not the bed.',
       E'We believe the best part of any stay is the fifteen minutes after you wake up. Not the sightseeing, not the itinerary — just the quiet stretch between opening your eyes and stepping outside, coffee in hand, to see what the mountains decided to do with the morning light.\n\nThat''s the whole idea behind every room here. Long before we talked about thread counts or minibar snacks, we talked about where the bed should sit relative to the balcony door — because the answer to "what does a great mountain stay feel like" was never going to be found lying down.\n\nSo the balconies came first. Wide enough for two chairs and a small table, always facing the valley, always catching the sun before the rest of the room does. The bed is comfortable, of course. But it is not the point. The point is the ten minutes you''ll spend leaning on that railing, mist still sitting in the trees below, before the day asks anything of you.\n\nGuests tell us this is what they remember months later — not a single meal or activity, but that one unhurried morning. We''re fine with that. It''s exactly what we built for.',
       '/images/journal/slow-mornings.jpg', now() - interval '35 days'
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'the-art-of-slow-mornings');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'why-every-room-has-a-desk', 'Why Every Room Has a Desk', 'Remote work and mountain air aren''t opposites — here''s how we designed for both.',
       E'A few years ago, "getting away from it all" meant actually getting away from it all — spotty signal, no desk, an apology from the front desk if you asked for WiFi strong enough for a video call. We went the other way on purpose.\n\nEvery room here has fast WiFi and an actual desk, not a side table pressed into service. It sounds like a small thing until you''ve tried to take a 9 a.m. call balanced on a hotel armchair with your laptop on your knees. We''d rather you sit properly, get the call done well, and then close the laptop and mean it.\n\nBecause that''s the trade we''re offering: come for the week, not just the weekend. Answer your emails in the morning light instead of a windowless office. Take the 1 p.m. break for a walk instead of a vending machine. And when you shut the laptop at 6, the mountains are still right there, unbothered by your inbox, waiting for you to actually look at them.\n\nWe''re not trying to compete with a home office. We''re trying to make the version of remote work you always imagined — good light, good coffee, a view worth looking up for — the one you actually get.',
       '/images/journal/room-with-a-desk.jpg', now() - interval '21 days'
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'why-every-room-has-a-desk');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'keeping-little-ones-busy', 'Keeping Little Ones Busy, So You Can Rest', 'The story behind our supervised Kids Play Zone, and why we built it.',
       E'Family holidays have a math problem. The parents need rest. The kids need to run around and be loud and climb on things. Most rooms with a view are quiet rooms, and most places built for kids to be loud aren''t anywhere you''d want to actually stay. Everyone ends up compromising on something.\n\nWe built the Kids Play Zone because we got tired of watching that compromise happen. It''s a supervised space, scaled to how many kids are actually staying with you, where children can be exactly as loud and busy as children are supposed to be — while the adults get an actual hour on that balcony we spent so much time designing.\n\nIt''s not a daycare drop-off. It''s closer to what happens at a family gathering when someone''s cousin takes all the kids outside so the grown-ups can finish a conversation. We just made sure that "someone''s cousin" is always available, every day of your stay, without you having to ask a favor of anyone.\n\nParents book the same trip they always wanted — slow mornings, a proper dinner, an evening that doesn''t end at 7 p.m. The kids get their own version of a good holiday. Nobody has to compromise on the mountains.',
       '/images/journal/kids-play-zone.jpg', now() - interval '12 days'
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'keeping-little-ones-busy');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'full-board-the-mountain-way', 'Full Board, the Mountain Way', 'Breakfast is already yours. Full Board means the whole day is taken care of.',
       E'Breakfast has always been included here — that was never up for debate. But somewhere around our tenth conversation with guests who''d spent their one full free day scouting the village for a decent lunch instead of on the trail they actually came for, we realized breakfast alone wasn''t enough.\n\nSo we added Full Board: breakfast, lunch, and dinner, priced simply per person per day, covering everyone in your trip. Seasonal, local, and made the way we''d cook for our own family — nothing you need to pre-order, nothing you need to plan around. You come back from the trail, from the nature walk, from an afternoon doing absolutely nothing, and the next meal is already taken care of.\n\nIt''s a small logistical thing that changes the shape of a whole trip. No detour into town to find a restaurant with a table free. No math on whether it''s worth the walk down and back up for lunch. Just more of the day spent doing the thing you came here to do, and less of it spent managing where the next meal is coming from.\n\nWe think a mountain stay should feel like being hosted, not like running a small logistics operation with scenery. Full Board is our attempt at that.',
       '/images/journal/full-board.jpg', now() - interval '6 days'
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'full-board-the-mountain-way');

INSERT INTO journal_posts (slug, title, excerpt, content, cover_image_url, published_at)
SELECT 'what-a-bonfire-remembers', 'What a Bonfire Remembers', 'On strangers, stories, and the evenings that make a stay memorable.',
       E'Nobody plans to stay at the bonfire for three hours. It always starts as ten minutes — one more log, one more cup of something warm — and somewhere in there, the couple who arrived that afternoon and the family checking out tomorrow end up trading stories like they''ve known each other for years.\n\nWe didn''t design the bonfire evenings to be a scheduled "activity" in the way a resort might slot in an evening program. It''s simpler than that: a fire, some benches, no agenda, and a sky full of stars that does most of the work on its own. What happens around it is up to whoever''s sitting there that night.\n\nSome evenings it''s quiet — a couple watching the embers, not saying much, not needing to. Other nights it turns into a dozen strangers comparing notes on which trail to take tomorrow, whose kids are asleep, whose flight got delayed getting here. We''ve heard guests exchange numbers at that fire and meet up again the following year, on purpose, because of a conversation that started with someone asking to borrow a lighter.\n\nA room can only do so much for a trip. It''s usually the evenings like this — unplanned, unbilled, easy to miss if you''re looking at a brochure — that people actually remember a year later.',
       '/images/journal/bonfire-nights.jpg', now() - interval '2 days'
WHERE NOT EXISTS (SELECT 1 FROM journal_posts WHERE slug = 'what-a-bonfire-remembers');
