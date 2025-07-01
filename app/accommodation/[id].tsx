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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Star, MapPin, Wifi, Car, Utensils, Tv, Users, Bed, Bath } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

interface Accommodation {
  id: string;
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
  accommodation_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
  accommodation_amenities: Array<{
    amenity_name: string;
    amenity_type: string;
  }>;
  accommodation_reviews: Array<{
    rating: number;
    comment: string;
    created_at: string;
    profiles: {
      first_name: string;
      avatar_url: string;
    };
  }>;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export default function AccommodationDetailScreen() {
  const { id } = useLocalSearchParams();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (id) {
      fetchAccommodation();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  const fetchAccommodation = async () => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select(`
          *,
          accommodation_images(*),
          accommodation_amenities(*),
          accommodation_reviews(*, profiles(first_name, avatar_url)),
          profiles(first_name, last_name, avatar_url)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching accommodation:', error);
        throw error;
      }
      
      setAccommodation(data);
    } catch (error) {
      console.error('Error fetching accommodation:', error);
      Alert.alert('Error', 'No se pudo cargar los detalles del alojamiento');
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
      // Not a favorite
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Error', 'Por favor inicia sesión para guardar favoritos');
      return;
    }

    if (!id) return;

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
            accommodation_id: id as string,
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
      Alert.alert('Error', 'Por favor inicia sesión para hacer una reserva');
      return;
    }
    // Navigate to booking flow
    router.push(`/booking/create?accommodationId=${id}`);
  };

  const handleContactHost = () => {
    if (!user || !accommodation) {
      Alert.alert('Error', 'Por favor inicia sesión para contactar al anfitrión');
      return;
    }
    // Navigate to chat
    router.push(`/chat?hostId=${accommodation.profiles.id}`);
  };

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'technology':
        return <Wifi size={20} color="#4ADE80" />;
      case 'parking':
        return <Car size={20} color="#4ADE80" />;
      case 'kitchen':
        return <Utensils size={20} color="#4ADE80" />;
      case 'entertainment':
        return <Tv size={20} color="#4ADE80" />;
      default:
        return <Star size={20} color="#4ADE80" />;
    }
  };

  const calculateAverageRating = () => {
    if (!accommodation?.accommodation_reviews.length) return 0;
    const sum = accommodation.accommodation_reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / accommodation.accommodation_reviews.length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!accommodation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Alojamiento no encontrado</Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const averageRating = calculateAverageRating();
  const images = accommodation.accommodation_images.length > 0 
    ? accommodation.accommodation_images 
    : [{ image_url: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg', is_primary: true }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Image Carousel */}
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
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.image_url }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          
          {/* Header Controls */}
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

          {/* Image Indicators */}
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

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{accommodation.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#4ADE80" fill="#4ADE80" />
              <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({accommodation.accommodation_reviews.length})
              </Text>
            </View>
          </View>

          <Text style={styles.location}>{accommodation.location}</Text>

          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <View style={styles.infoItem}>
              <Users size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.capacity} {t('accommodation.guests')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Bed size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.bedrooms} {t('accommodation.bedrooms')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Bath size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.bathrooms} {t('accommodation.bathrooms')}</Text>
            </View>
          </View>

          {/* Host Info */}
          <View style={styles.hostSection}>
            <View style={styles.hostInfo}>
              <Image
                source={{
                  uri: accommodation.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
                }}
                style={styles.hostAvatar}
              />
              <View>
                <Text style={styles.hostName}>
                  {t('accommodation.host')}: {accommodation.profiles.first_name} {accommodation.profiles.last_name}
                </Text>
                <Text style={styles.hostExperience}>2 {t('accommodation.yearsHosting')}</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Star size={20} color="#4ADE80" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('accommodation.topAccommodations')}</Text>
                <Text style={styles.featureDescription}>{t('accommodation.topDescription')}</Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <MapPin size={20} color="#4ADE80" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('accommodation.features.autonomousArrival')}</Text>
                <Text style={styles.featureDescription}>{t('accommodation.features.autonomousDescription')}</Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Heart size={20} color="#4ADE80" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('accommodation.features.peaceAndQuiet')}</Text>
                <Text style={styles.featureDescription}>{t('accommodation.features.peaceDescription')}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{accommodation.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>{t('accommodation.amenities')}</Text>
            <View style={styles.amenitiesList}>
              {accommodation.accommodation_amenities.slice(0, 4).map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  {getAmenityIcon(amenity.amenity_type)}
                  <Text style={styles.amenityText}>{amenity.amenity_name}</Text>
                </View>
              ))}
            </View>
            {accommodation.accommodation_amenities.length > 4 && (
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>
                  Mostrar los {accommodation.accommodation_amenities.length} servicios
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reviews */}
          {accommodation.accommodation_reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>{t('accommodation.reviews')}</Text>
              <Text style={styles.reviewsSummary}>
                Lo que opinan los huéspedes
              </Text>
              
              <View style={styles.reviewsList}>
                {accommodation.accommodation_reviews.slice(0, 2).map((review, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Image
                        source={{
                          uri: review.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
                        }}
                        style={styles.reviewerAvatar}
                      />
                      <View>
                        <Text style={styles.reviewerName}>{review.profiles.first_name}</Text>
                        <Text style={styles.reviewDate}>1 año en Bike & Bed Global</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.showMoreReviewsButton}>
                <Text style={styles.showMoreText}>
                  Descubre cómo funcionan las reseñas
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Host Contact */}
          <View style={styles.hostContactSection}>
            <Text style={styles.sectionTitle}>Conoce al anfitrión</Text>
            <View style={styles.hostContactCard}>
              <View style={styles.hostContactInfo}>
                <Image
                  source={{
                    uri: accommodation.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
                  }}
                  style={styles.hostContactAvatar}
                />
                <View style={styles.hostContactDetails}>
                  <Text style={styles.hostContactName}>
                    {accommodation.profiles.first_name}
                  </Text>
                  <Text style={styles.hostContactTitle}>Anfitrión</Text>
                  <View style={styles.hostStats}>
                    <Text style={styles.hostStat}>7 Reseñas</Text>
                    <View style={styles.hostRating}>
                      <Text style={styles.hostRatingText}>4.0</Text>
                      <Star size={12} color="#4ADE80" fill="#4ADE80" />
                    </View>
                    <Text style={styles.hostStat}>Calificación</Text>
                  </View>
                  <Text style={styles.hostExperienceText}>2 Años anfitrionando</Text>
                </View>
              </View>
              
              <View style={styles.hostContactActions}>
                <Text style={styles.hostContactDescription}>
                  Información sobre el anfitrión
                </Text>
                <Text style={styles.hostContactSubtext}>
                  Índice de respuesta: 100 %
                </Text>
                <Text style={styles.hostContactSubtext}>
                  Responde en menos de una hora
                </Text>
                
                <TouchableOpacity style={styles.contactHostButton} onPress={handleContactHost}>
                  <Text style={styles.contactHostButtonText}>
                    {t('accommodation.contactHost')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>{t('accommodation.location')}</Text>
            <Text style={styles.locationText}>{accommodation.address}</Text>
            <View style={styles.mapPlaceholder}>
              <MapPin size={40} color="#4ADE80" />
              <Text style={styles.mapPlaceholderText}>{t('accommodation.howToGet')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.price}>${accommodation.price_per_night}</Text>
          <Text style={styles.priceUnit}>/{t('accommodation.perNight')}</Text>
          <Text style={styles.priceDate}>• 29 de julio</Text>
        </View>
        <Button
          title={t('accommodation.reserve')}
          onPress={handleReserve}
          style={styles.reserveButton}
        />
      </View>
    </SafeAreaView>
  );
}

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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
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
  },
  propertyInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hostExperience: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  featuresSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
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
  showMoreButton: {
    marginTop: 8,
  },
  showMoreText: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  reviewsSummary: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 20,
  },
  reviewsList: {
    marginBottom: 16,
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
  },
  reviewerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  showMoreReviewsButton: {
    marginTop: 8,
  },
  hostContactSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  hostContactCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  hostContactInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  hostContactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  hostContactDetails: {
    flex: 1,
  },
  hostContactName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hostContactTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  hostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hostStat: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 16,
  },
  hostRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  hostRatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  hostExperienceText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  hostContactActions: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 20,
  },
  hostContactDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hostContactSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  contactHostButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  contactHostButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
  priceDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  reserveButton: {
    paddingHorizontal: 32,
  },
});