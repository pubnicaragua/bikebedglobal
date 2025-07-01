import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://eseezsiwiuogxovjfvrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZWV6c2l3aXVvZ3hvdmpmdnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTI5ODQsImV4cCI6MjA2MzUyODk4NH0.qG6DhavxqnE0YqgqcFTlr95YpcBj4i7hSGar6AZ03Rg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'user' | 'host' | 'admin';
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'user' | 'host' | 'admin';
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'user' | 'host' | 'admin';
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accommodations: {
        Row: {
          id: string;
          host_id: string;
          name: string;
          description: string;
          location: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          price_per_night: number;
          capacity: number;
          bedrooms: number;
          bathrooms: number;
          has_bike_storage: boolean;
          has_bike_rental: boolean;
          has_bike_tools: boolean;
          has_laundry: boolean;
          has_wifi: boolean;
          has_kitchen: boolean;
          has_parking: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      accommodation_images: {
        Row: {
          id: string;
          accommodation_id: string;
          image_url: string;
          is_primary: boolean;
          created_at: string;
        };
      };
      accommodation_amenities: {
        Row: {
          id: string;
          accommodation_id: string;
          amenity_name: string;
          amenity_type: string | null;
          created_at: string;
        };
      };
      accommodation_reviews: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          accommodation_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          accommodation_id: string;
          check_in_date: string;
          check_out_date: string;
          guests: number;
          total_price: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          payment_status: 'pending' | 'paid' | 'refunded';
          special_requests: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      routes: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string;
          distance: number;
          elevation_gain: number | null;
          difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
          estimated_time: number | null;
          start_location: string;
          end_location: string;
          is_loop: boolean;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      route_images: {
        Row: {
          id: string;
          route_id: string;
          image_url: string;
          is_primary: boolean;
          created_at: string;
        };
      };
      route_reviews: {
        Row: {
          id: string;
          user_id: string;
          route_id: string;
          rating: number;
          comment: string | null;
          difficulty_rating: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      favorite_accommodations: {
        Row: {
          id: string;
          user_id: string;
          accommodation_id: string;
          created_at: string;
        };
      };
      favorite_routes: {
        Row: {
          id: string;
          user_id: string;
          route_id: string;
          created_at: string;
        };
      };
      bike_rentals: {
        Row: {
          id: string;
          host_id: string;
          accommodation_id: string | null;
          bike_type: string;
          bike_size: string | null;
          price_per_day: number;
          is_available: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          last_message_at: string;
          created_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          notification_type: string;
          is_read: boolean;
          related_id: string | null;
          created_at: string;
        };
      };
    };
  };
};