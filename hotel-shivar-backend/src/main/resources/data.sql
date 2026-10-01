-- Seed data for local development (H2 profile only, guarded by sql.init.mode).
-- Safe to delete rows freely; ids will regenerate.

INSERT INTO rooms (room_number, type, price_per_night, description, capacity, image_url, available)
SELECT '101', 'SINGLE', 2500.00, 'Cozy single room with city view', 1,
       'https://images.unsplash.com/photo-1611892440504-42a792e24d32', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '101');

INSERT INTO rooms (room_number, type, price_per_night, description, capacity, image_url, available)
SELECT '201', 'DOUBLE', 4000.00, 'Spacious double room with balcony', 2,
       'https://images.unsplash.com/photo-1590490360182-c33d57733427', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '201');

INSERT INTO rooms (room_number, type, price_per_night, description, capacity, image_url, available)
SELECT '301', 'DELUXE', 6500.00, 'Deluxe room with king bed and lounge area', 2,
       'https://images.unsplash.com/photo-1611892440504-42a792e24d32', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '301');

INSERT INTO rooms (room_number, type, price_per_night, description, capacity, image_url, available)
SELECT '401', 'SUITE', 12000.00, 'Presidential suite with private terrace', 4,
       'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '401');

INSERT INTO offers (title, description, discount_percent, valid_from, valid_to, image_url, active)
SELECT 'Early Bird Discount', 'Book 30 days in advance and save', 15, CURRENT_DATE, DATEADD('MONTH', 3, CURRENT_DATE),
       'https://images.unsplash.com/photo-1566073771259-6a8506099945', true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE title = 'Early Bird Discount');

INSERT INTO offers (title, description, discount_percent, valid_from, valid_to, image_url, active)
SELECT 'Weekend Getaway', 'Special rate for weekend stays', 10, CURRENT_DATE, DATEADD('MONTH', 6, CURRENT_DATE),
       'https://images.unsplash.com/photo-1611892440504-42a792e24d32', true
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE title = 'Weekend Getaway');

INSERT INTO gallery_images (title, image_url, category)
SELECT 'Hotel Exterior', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'EXTERIOR'
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE title = 'Hotel Exterior');

INSERT INTO gallery_images (title, image_url, category)
SELECT 'Deluxe Room', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32', 'ROOMS'
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE title = 'Deluxe Room');

INSERT INTO gallery_images (title, image_url, category)
SELECT 'Restaurant', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 'RESTAURANT'
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE title = 'Restaurant');
