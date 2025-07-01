/*
  # Create sample data for Bike & Bed Global app

  1. Sample Data
    - Create sample profiles with different roles
    - Add sample accommodations with images and amenities
    - Insert sample routes with points and reviews
    - Create sample bookings and favorites
    - Add sample conversations and messages

  2. Security
    - Ensure all data follows RLS policies
    - Create realistic test data for development
*/

-- Insert sample admin user
INSERT INTO public.profiles (id, email, first_name, last_name, role, language) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@bikeandbed.com', 'Admin', 'User', 'admin', 'es'),
  ('22222222-2222-2222-2222-222222222222', 'host@bikeandbed.com', 'María', 'González', 'host', 'es'),
  ('33333333-3333-3333-3333-333333333333', 'user@bikeandbed.com', 'Carlos', 'Rodríguez', 'user', 'es'),
  ('44444444-4444-4444-4444-444444444444', 'melissa@bikeandbed.com', 'Melissa', 'Anderson', 'host', 'en');

-- Insert sample accommodations
INSERT INTO public.accommodations (id, host_id, name, description, location, address, latitude, longitude, price_per_night, capacity, bedrooms, bathrooms, has_bike_storage, has_bike_rental, has_bike_tools, has_laundry, has_wifi, has_kitchen, has_parking, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Apartamento en Machu Picchu', 'Lujoso loft climatizado y confortable con mini gimnasio privado, vistas de atardeceres y volcanes increíbles', 'Cusco, Perú', 'Aguas Calientes, Machu Picchu', -13.1631, -72.545, 100.00, 4, 2, 1, true, true, true, true, true, true, true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Casa Rural en los Andes', 'Hermosa casa tradicional con vistas panorámicas de las montañas', 'Cusco, Perú', 'Valle Sagrado, Cusco', -13.1631, -72.55, 85.00, 6, 3, 2, true, false, true, true, true, true, true, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Cabaña Ecológica', 'Cabaña sostenible en medio de la naturaleza con energía solar', 'Cusco, Perú', 'Ollantaytambo, Cusco', -13.2593, -72.2633, 75.00, 2, 1, 1, true, true, true, false, true, false, false, true);

-- Insert accommodation images
INSERT INTO public.accommodation_images (accommodation_id, image_url, is_primary) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg', true);

-- Insert accommodation amenities
INSERT INTO public.accommodation_amenities (accommodation_id, amenity_name, amenity_type) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cocina', 'kitchen'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wifi', 'technology'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zona de trabajo', 'workspace'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TV', 'entertainment'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cocina', 'kitchen'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Wifi', 'technology'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Estacionamiento', 'parking'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Wifi', 'technology'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Energía solar', 'eco');

-- Insert sample routes
INSERT INTO public.routes (id, creator_id, name, description, distance, elevation_gain, difficulty, estimated_time, start_location, end_location, is_loop, is_verified, is_active) VALUES
  ('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '22222222-2222-2222-2222-222222222222', 'Tour Machu Picchu', 'Ruta panorámica hacia la ciudadela inca con vistas espectaculares', 12.5, 800, 'moderate', 4, 'Aguas Calientes', 'Machu Picchu', false, true, true),
  ('ssssssss-ssss-ssss-ssss-ssssssssssss', '44444444-4444-4444-4444-444444444444', 'Camino del Inca', 'Ruta histórica utilizada por los incas para llegar a Machu Picchu', 45.0, 1200, 'hard', 16, 'Ollantaytambo', 'Machu Picchu', false, true, true);

-- Insert route images
INSERT INTO public.route_images (route_id, image_url, is_primary) VALUES
  ('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg', true),
  ('ssssssss-ssss-ssss-ssss-ssssssssssss', 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg', true);

-- Insert sample bike rentals
INSERT INTO public.bike_rentals (id, host_id, accommodation_id, bike_type, bike_size, price_per_day, is_available, description) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mountain', 'm', 25.00, true, 'Bicicleta de montaña Trek en excelente estado'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'hybrid', 'l', 20.00, true, 'Bicicleta híbrida perfecta para ciudad y campo');

-- Insert sample bookings
INSERT INTO public.bookings (id, user_id, accommodation_id, check_in_date, check_out_date, guests, total_price, status, payment_status, special_requests) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-06-27', '2024-06-31', 2, 400.00, 'confirmed', 'paid', 'Llegada tarde'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-07-15', '2024-07-20', 4, 425.00, 'pending', 'pending', null);

-- Insert accommodation reviews
INSERT INTO public.accommodation_reviews (booking_id, user_id, accommodation_id, rating, comment) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Tuve una muy buena experiencia, el lugar es súper cómodo y la zona tiene todo cerca, en general es un airbnb que vale la pena pagar.');

-- Insert route reviews
INSERT INTO public.route_reviews (user_id, route_id, rating, comment, difficulty_rating) VALUES
  ('33333333-3333-3333-3333-333333333333', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 4, 'Excelente ruta con vistas increíbles. Recomendado para ciclistas intermedios.', 3),
  ('33333333-3333-3333-3333-333333333333', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 5, 'Una experiencia única e inolvidable. Definitivamente desafiante pero vale la pena.', 4);

-- Insert favorite accommodations
INSERT INTO public.favorite_accommodations (user_id, accommodation_id, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-06-01'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-05-20'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-04-25');

-- Insert favorite routes
INSERT INTO public.favorite_routes (user_id, route_id, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', '2024-05-18'),
  ('33333333-3333-3333-3333-333333333333', 'ssssssss-ssss-ssss-ssss-ssssssssssss', '2024-04-12');

-- Insert sample conversations
INSERT INTO public.conversations (id, user1_id, user2_id, last_message_at) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '2024-06-15 10:30:00');

-- Insert sample messages
INSERT INTO public.messages (sender_id, recipient_id, content, is_read, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Hola, me interesa reservar tu alojamiento para el próximo mes.', true, '2024-06-15 10:30:00'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Hello! I would be happy to host you. Let me know the dates.', false, '2024-06-15 10:35:00');

-- Insert sample notifications
INSERT INTO public.notifications (user_id, title, message, notification_type, is_read, related_id) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Reserva confirmada', 'Tu reserva en Apartamento en Machu Picchu ha sido confirmada', 'booking', true, '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', 'Nueva reserva', 'Tienes una nueva solicitud de reserva pendiente', 'booking', false, '22222222-2222-2222-2222-222222222222');

-- Insert sample translations for dynamic content
INSERT INTO public.translations (table_name, record_id, field_name, language, translated_text) VALUES
  ('accommodations', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'name', 'en', 'Apartment in Machu Picchu'),
  ('accommodations', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'description', 'en', 'Luxurious air-conditioned and comfortable loft with private mini gym, incredible sunset and volcano views'),
  ('accommodations', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'name', 'en', 'Rural House in the Andes'),
  ('accommodations', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'description', 'en', 'Beautiful traditional house with panoramic mountain views'),
  ('routes', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'name', 'en', 'Machu Picchu Tour'),
  ('routes', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'description', 'en', 'Panoramic route to the Inca citadel with spectacular views'),
  ('routes', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'name', 'en', 'Inca Trail'),
  ('routes', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'description', 'en', 'Historic route used by the Incas to reach Machu Picchu');