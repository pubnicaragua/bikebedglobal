import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Star, MapPin, Wifi, Car, Utensils, Tv, Users, Bed, Bath } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface AccommodationImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface AccommodationAmenity {
  id: string;
  amenity_name: string;
  amenity_type: string;
}

interface AccommodationReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: Profile;
}

interface Accommodation {
  id: string;
  host_id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  price_per_night: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  has_wifi: boolean;
  has_kitchen: boolean;
  has_parking: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  accommodation_images: AccommodationImage[];
  accommodation_amenities: AccommodationAmenity[];
  accommodation_reviews: AccommodationReview[];
  host: Profile;
}

export default function AccommodationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchAccommodation();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Consulta 1: Obtener datos básicos del alojamiento
      const { data: accommodationData, error: accommodationError } = await supabase
        .from('accommodations')
        .select(`
          *,
          accommodation_images(*),
          accommodation_amenities(*),
          accommodation_reviews(*)
        `)
        .eq('id', id)
        .single();

      if (accommodationError) throw accommodationError;
      if (!accommodationData) throw new Error('Alojamiento no encontrado');

      // Consulta 2: Obtener perfil del host
      let hostProfile = null;
      try {
        const { data: hostData, error: hostError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', accommodationData.host_id)
          .single();

        if (!hostError) hostProfile = hostData;
      } catch (hostErr) {
        console.warn('Error cargando perfil del host:', hostErr);
      }

      // Consulta 3: Obtener perfiles de los reviewers (solo si hay reviews)
      let reviewProfilesMap = {};
      if (accommodationData.accommodation_reviews?.length > 0) {
        const reviewUserIds = accommodationData.accommodation_reviews.map((r: { user_id: any; }) => r.user_id);
        
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', reviewUserIds);

          if (profiles) {
            reviewProfilesMap = profiles.reduce((map, profile) => {
              map[profile.id] = profile;
              return map;
            }, {});
          }
        } catch (profilesErr) {
          console.warn('Error cargando perfiles de reviewers:', profilesErr);
        }
      }

      // Construir el objeto final
      const completeAccommodation: Accommodation = {
        ...accommodationData,
        host: hostProfile || {
          id: accommodationData.host_id,
          first_name: 'Anfitrión',
          last_name: '',
          avatar_url: ''
        },
        accommodation_reviews: accommodationData.accommodation_reviews?.map(review => ({
          ...review,
          profiles: reviewProfilesMap[review.user_id] || {
            id: review.user_id,
            first_name: 'Anónimo',
            last_name: '',
            avatar_url: ''
          }
        })) || []
      };

      setAccommodation(completeAccommodation);
    } catch (err) {
      console.error('Error fetching accommodation:', err);
      setError('No se pudo cargar los detalles del alojamiento');
      if (router.canGoBack()) {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('favorite_accommodations')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', id)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar favoritos');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorite_accommodations')
          .delete()
          .eq('user_id', user.id)
          .eq('accommodation_id', id);
      } else {
        await supabase
          .from('favorite_accommodations')
          .insert({
            user_id: user.id,
            accommodation_id: id,
          });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    }
  };

  const handleReserve = () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para reservar');
      return;
    }
    router.push(`/booking/create?accommodationId=${id}`);
  };

  const handleContactHost = () => {
    if (!user || !accommodation) {
      Alert.alert('Error', 'Debes iniciar sesión para contactar al anfitrión');
      return;
    }
    router.push(`/chat?hostId=${accommodation.host_id}`);
  };

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'technology': return <Wifi size={20} color="#4ADE80" />;
      case 'parking': return <Car size={20} color="#4ADE80" />;
      case 'kitchen': return <Utensils size={20} color="#4ADE80" />;
      case 'entertainment': return <Tv size={20} color="#4ADE80" />;
      default: return <Star size={20} color="#4ADE80" />;
    }
  };

  const calculateAverageRating = () => {
    if (!accommodation?.accommodation_reviews?.length) return 0;
    const sum = accommodation.accommodation_reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / accommodation.accommodation_reviews.length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>Cargando alojamiento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !accommodation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Alojamiento no encontrado'}</Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const averageRating = calculateAverageRating();
  const images = accommodation.accommodation_images.length > 0 
    ? accommodation.accommodation_images 
    : [{ id: 'default', image_url: 'https://via.placeholder.com/400x300?text=No+Image', is_primary: true }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Carrusel de imágenes */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          <View style={styles.headerControls}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
              <Heart
                size={24}
                color={isFavorite ? "#EF4444" : "#FFFFFF"}
                fill={isFavorite ? "#EF4444" : "transparent"}
              />
            </TouchableOpacity>
          </View>

          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Sección de título y rating */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{accommodation.name}</Text>
            {averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <Star size={16} color="#4ADE80" fill="#4ADE80" />
                <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>
                  ({accommodation.accommodation_reviews.length} reseñas)
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.location}>
            <MapPin size={16} color="#9CA3AF" /> {accommodation.location}
          </Text>

          {/* Información básica */}
          <View style={styles.propertyInfo}>
            <View style={styles.infoItem}>
              <Users size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.capacity} huéspedes</Text>
            </View>
            <View style={styles.infoItem}>
              <Bed size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.bedrooms} hab.</Text>
            </View>
            <View style={styles.infoItem}>
              <Bath size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.bathrooms} baños</Text>
            </View>
          </View>

          {/* Sección del anfitrión */}
          <TouchableOpacity 
            style={styles.hostSection} 
            onPress={handleContactHost}
            activeOpacity={0.8}
          >
            <View style={styles.hostInfo}>
              <Image
                source={{
                  uri: accommodation.host.avatar_url || 'https://via.placeholder.com/150?text=Host',
                }}
                style={styles.hostAvatar}
              />
              <View>
                <Text style={styles.hostName}>
                  Anfitrión: {accommodation.host.first_name} {accommodation.host.last_name}
                </Text>
                <Text style={styles.contactHostText}>Contactar al anfitrión</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Descripción */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{accommodation.description}</Text>
          </View>

          {/* Servicios */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <View style={styles.amenitiesList}>
              {accommodation.accommodation_amenities.slice(0, 4).map((amenity) => (
                <View key={amenity.id} style={styles.amenityItem}>
                  {getAmenityIcon(amenity.amenity_type)}
                  <Text style={styles.amenityText}>{amenity.amenity_name}</Text>
                </View>
              ))}
            </View>
            {accommodation.accommodation_amenities.length > 4 && (
              <Text style={styles.moreAmenitiesText}>+{accommodation.accommodation_amenities.length - 4} más</Text>
            )}
          </View>

          {/* Reseñas */}
          {accommodation.accommodation_reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Reseñas</Text>
              {accommodation.accommodation_reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{
                        uri: review.profiles?.avatar_url || 'https://via.placeholder.com/150?text=User',
                      }}
                      style={styles.reviewerAvatar}
                    />
                    <View>
                      <Text style={styles.reviewerName}>
                        {review.profiles?.first_name || 'Anónimo'}
                      </Text>
                      <View style={styles.reviewRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            color={i < review.rating ? "#4ADE80" : "#9CA3AF"}
                            fill={i < review.rating ? "#4ADE80" : "transparent"}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewText}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Ubicación */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <Text style={styles.locationText}>{accommodation.address}</Text>
            <View style={styles.mapPlaceholder}>
              <MapPin size={40} color="#4ADE80" />
              <Text style={styles.mapPlaceholderText}>Ver en mapa</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Barra inferior de reserva */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.price}>${accommodation.price_per_night}</Text>
          <Text style={styles.priceUnit}>/noche</Text>
        </View>
        <Button
          title="Reservar"
          onPress={handleReserve}
          style={styles.reserveButton}
        />
      </View>
    </SafeAreaView>
  );
}

// Estilos (se mantienen igual que en tu versión original)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#1F2937',
  },
  image: {
    width: width,
    height: 300,
  },
  headerControls: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    color: '#9CA3AF',
    fontSize: 16,
    marginLeft: 4,
  },
  location: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyInfo: {
    flexDirection: 'row',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 6,
  },
  hostSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#374151',
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactHostText: {
    color: '#4ADE80',
    fontSize: 14,
    marginTop: 4,
  },
  descriptionSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  amenitiesSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 16,
  },
  amenityText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  moreAmenitiesText: {
    color: '#4ADE80',
    fontSize: 14,
    marginTop: 8,
  },
  reviewsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#374151',
  },
  reviewerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewDate: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  locationSection: {
    marginBottom: 100,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 16,
  },
  mapPlaceholder: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceUnit: {
    color: '#9CA3AF',
    fontSize: 16,
    marginLeft: 4,
  },
  reserveButton: {
    paddingHorizontal: 32,
  },
});