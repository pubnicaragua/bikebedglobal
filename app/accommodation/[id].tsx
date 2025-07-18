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
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Switch,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Tv,
  Users,
  Bed,
  Bath,
  Send,
  Plus,
  X,
  MessageSquare,
  Check,
} from 'lucide-react-native';
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

interface ReviewResponse {
  id: string;
  review_id: string;
  responder_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

interface AccommodationReview {
  id: string;
  booking_id: string;
  user_id: string;
  accommodation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  responses?: ReviewResponse[];
  showResponses?: boolean;
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
  has_bike_storage: boolean;
  has_bike_rental: boolean;
  has_bike_tools: boolean;
  has_laundry: boolean;
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
  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [hasBooked, setHasBooked] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>(
    {}
  );
  const [responseLoading, setResponseLoading] = useState<
    Record<string, boolean>
  >({});
  const { user } = useAuth();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newAccommodation, setNewAccommodation] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    price_per_night: '',
    capacity: '',
    bedrooms: '',
    bathrooms: '',
    has_wifi: false,
    has_kitchen: false,
    has_parking: false,
    has_bike_storage: false,
    has_bike_rental: false,
    has_bike_tools: false,
    has_laundry: false,
  });
  const [customAmenities, setCustomAmenities] = useState<
    { name: string; type: string }[]
  >([]);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityType, setNewAmenityType] = useState('');
  const [isAmenityModalVisible, setIsAmenityModalVisible] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccommodation();
      if (user) {
        checkIfFavorite();
        checkIfBooked();
      }
    }
  }, [id, user]);

  const fetchAccommodation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: accommodationData, error: accommodationError } =
        await supabase
          .from('accommodations')
          .select(
            '*, accommodation_images(*), accommodation_amenities(*), accommodation_reviews(*)'
          )
          .eq('id', id)
          .single();

      if (accommodationError) throw accommodationError;
      if (!accommodationData) throw new Error('Alojamiento no encontrado');

      const { data: hostData, error: hostError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', accommodationData.host_id)
        .single();

      if (hostError) console.warn('Error fetching host:', hostError);

      const { data: reviewsWithResponses, error: reviewsError } = await supabase
        .from('accommodation_reviews')
        .select(
          '*, review_responses(*, profiles:responder_id(id, first_name, last_name, avatar_url))'
        )
        .eq('accommodation_id', id);

      if (reviewsError) throw reviewsError;

      const reviewUserIds = reviewsWithResponses?.map((r) => r.user_id) || [];
      let reviewerProfiles: Profile[] = [];

      if (reviewUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', reviewUserIds);

        if (!profilesError) reviewerProfiles = profilesData || [];
      }

      const normalizedImages =
        accommodationData.accommodation_images?.length > 0
          ? accommodationData.accommodation_images
          : [
              {
                id: 'default',
                image_url: 'https://via.placeholder.com/400x300?text=No+Image',
                is_primary: true,
              },
            ];

      const reviewsWithProfilesAndResponses =
        reviewsWithResponses?.map((review) => ({
          ...review,
          profile: reviewerProfiles.find((p) => p.id === review.user_id) || {
            id: review.user_id,
            first_name: 'Anónimo',
            last_name: '',
            avatar_url: '',
          },
          responses:
            review.review_responses?.map(
              (response: { profiles: any; responder_id: any }) => ({
                ...response,
                profile: response.profiles || {
                  id: response.responder_id,
                  first_name: 'Anónimo',
                  last_name: '',
                  avatar_url: '',
                },
              })
            ) || [],
          showResponses: false,
        })) || [];

      setAccommodation({
        ...accommodationData,
        accommodation_images: normalizedImages,
        accommodation_reviews: reviewsWithProfilesAndResponses,
        host: hostData || {
          id: accommodationData.host_id,
          first_name: 'Anfitrión',
          last_name: '',
          avatar_url: '',
        },
      });
    } catch (err) {
      console.error('Error fetching accommodation:', err);
      setError('No se pudo cargar los detalles del alojamiento');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('favorite_accommodations')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const checkIfBooked = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', id)
        .eq('status', 'completed')
        .limit(1);

      if (error) throw error;
      setHasBooked(data && data.length > 0);
    } catch (error) {
      console.error('Error checking booking:', error);
      setHasBooked(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar favoritos');
      router.push('/');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_accommodations')
          .delete()
          .eq('user_id', user.id)
          .eq('accommodation_id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_accommodations')
          .insert({
            user_id: user.id,
            accommodation_id: id,
          });

        if (error) throw error;
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
      router.push('/');
      return;
    }
    router.push(`/booking/create?accommodationId=${id}`);
  };

  const handleContactHost = () => {
    if (!user || !accommodation) {
      Alert.alert('Error', 'Debes iniciar sesión para contactar al anfitrión');
      router.push('/');
      return;
    }
    router.push(`/chat?hostId=${accommodation.host_id}`);
  };

  const handleReport = () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para reportar contenido');
      router.push('/');
      return;
    }
    Alert.alert(
      'Reportar contenido',
      '¿Estás seguro de que quieres reportar este alojamiento como inapropiado?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('reports').insert({
                user_id: user.id,
                accommodation_id: id,
                report_type: 'inappropriate',
                status: 'pending',
              });

              if (error) throw error;
              Alert.alert(
                'Reporte enviado',
                'Gracias por tu reporte. Revisaremos este contenido.'
              );
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Error', 'No se pudo enviar el reporte');
            }
          },
        },
      ]
    );
  };

  const toggleReviewResponses = (reviewId: string) => {
    setAccommodation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        accommodation_reviews: prev.accommodation_reviews.map((review) => {
          if (review.id === reviewId) {
            return { ...review, showResponses: !review.showResponses };
          }
          return review;
        }),
      };
    });
  };

  const handleCreateReview = async () => {
    if (!user || !id || reviewRating === 0) {
      Alert.alert(
        'Error',
        'Por favor, selecciona una calificación para tu reseña.'
      );
      return;
    }

    try {
      setReviewLoading(true);

      const { data: existingReview, error: reviewError } = await supabase
        .from('accommodation_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', id)
        .maybeSingle();

      if (reviewError) throw reviewError;
      if (existingReview) {
        Alert.alert(
          'Error',
          'Ya has publicado una reseña para este alojamiento.'
        );
        return;
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', id)
        .eq('status', 'completed')
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) {
        Alert.alert(
          'Error',
          'Debes haber completado una reserva para dejar una reseña.'
        );
        return;
      }

      const { error } = await supabase.from('accommodation_reviews').insert({
        booking_id: bookingData.id,
        user_id: user.id,
        accommodation_id: id,
        rating: reviewRating,
        comment: reviewText || null,
      });

      if (error) throw error;

      await fetchAccommodation();
      setReviewModalVisible(false);
      setReviewText('');
      setReviewRating(0);
      Alert.alert('Éxito', 'Tu reseña ha sido publicada.');
    } catch (error: any) {
      console.error('Error al crear reseña:', error.message);
      Alert.alert('Error', 'No se pudo publicar la reseña: ' + error.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!user || !responseTexts[reviewId]?.trim()) return;

    try {
      setResponseLoading((prev) => ({ ...prev, [reviewId]: true }));

      const { error } = await supabase.from('review_responses').insert({
        review_id: reviewId,
        responder_id: user.id,
        response_text: responseTexts[reviewId],
      });

      if (error) throw error;

      await fetchAccommodation();
      setResponseTexts((prev) => ({ ...prev, [reviewId]: '' }));
      Alert.alert('Éxito', 'Tu respuesta ha sido publicada');
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    } finally {
      setResponseLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleCreateAccommodation = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear un alojamiento');
      return;
    }

    if (
      !newAccommodation.name ||
      !newAccommodation.description ||
      !newAccommodation.location
    ) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoadingCreate(true);

      const { data: accommodationData, error: accommodationError } =
        await supabase
          .from('accommodations')
          .insert({
            host_id: user.id,
            name: newAccommodation.name,
            description: newAccommodation.description,
            location: newAccommodation.location,
            address: newAccommodation.address,
            price_per_night: Number(newAccommodation.price_per_night) || 0,
            capacity: Number(newAccommodation.capacity) || 1,
            bedrooms: Number(newAccommodation.bedrooms) || 1,
            bathrooms: Number(newAccommodation.bathrooms) || 1,
            has_wifi: newAccommodation.has_wifi,
            has_kitchen: newAccommodation.has_kitchen,
            has_parking: newAccommodation.has_parking,
            has_bike_storage: newAccommodation.has_bike_storage,
            has_bike_rental: newAccommodation.has_bike_rental,
            has_bike_tools: newAccommodation.has_bike_tools,
            has_laundry: newAccommodation.has_laundry,
            is_active: true,
          })
          .select()
          .single();

      if (accommodationError) throw accommodationError;

      if (customAmenities.length > 0) {
        const { error: amenitiesError } = await supabase
          .from('accommodation_amenities')
          .insert(
            customAmenities.map((amenity) => ({
              accommodation_id: accommodationData.id,
              amenity_name: amenity.name,
              amenity_type: amenity.type || 'other',
            }))
          );

        if (amenitiesError) throw amenitiesError;
      }

      Alert.alert('Éxito', 'Alojamiento creado correctamente');
      setIsCreateModalVisible(false);
      setNewAccommodation({
        name: '',
        description: '',
        location: '',
        address: '',
        price_per_night: '',
        capacity: '',
        bedrooms: '',
        bathrooms: '',
        has_wifi: false,
        has_kitchen: false,
        has_parking: false,
        has_bike_storage: false,
        has_bike_rental: false,
        has_bike_tools: false,
        has_laundry: false,
      });
      setCustomAmenities([]);
    } catch (error) {
      console.error('Error creating accommodation:', error);
      Alert.alert('Error', 'No se pudo crear el alojamiento');
    } finally {
      setLoadingCreate(false);
    }
  };

  const addCustomAmenity = () => {
    if (!newAmenityName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la amenidad');
      return;
    }

    setCustomAmenities((prev) => [
      ...prev,
      { name: newAmenityName.trim(), type: newAmenityType.trim() || 'other' },
    ]);
    setNewAmenityName('');
    setNewAmenityType('');
    setIsAmenityModalVisible(false);
  };

  const removeCustomAmenity = (index: number) => {
    setCustomAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateAverageRating = () => {
    if (!accommodation?.accommodation_reviews?.length) return 0;
    const sum = accommodation.accommodation_reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
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
          <Text style={styles.errorText}>
            {error || 'Alojamiento no encontrado'}
          </Text>
          <Button title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const averageRating = calculateAverageRating();
  const availableAmenities = [
    // Amenidades booleanas (servicios básicos)
    {
      condition: accommodation.has_wifi,
      icon: <Wifi size={20} color="#4ADE80" />,
      name: 'WiFi',
      type: 'basic',
    },
    {
      condition: accommodation.has_kitchen,
      icon: <Utensils size={20} color="#4ADE80" />,
      name: 'Cocina',
      type: 'basic',
    },
    {
      condition: accommodation.has_parking,
      icon: <Car size={20} color="#4ADE80" />,
      name: 'Estacionamiento',
      type: 'basic',
    },
    {
      condition: accommodation.has_bike_storage,
      icon: <Text style={{ fontSize: 20 }}>🚴</Text>,
      name: 'Guardado de bicis',
      type: 'basic',
    },
    {
      condition: accommodation.has_bike_rental,
      icon: <Text style={{ fontSize: 20 }}>🚲</Text>,
      name: 'Alquiler de bicis',
      type: 'basic',
    },
    {
      condition: accommodation.has_bike_tools,
      icon: <Text style={{ fontSize: 20 }}>🛠️</Text>,
      name: 'Herramientas',
      type: 'basic',
    },
    {
      condition: accommodation.has_laundry,
      icon: <Text style={{ fontSize: 20 }}>🧺</Text>,
      name: 'Lavandería',
      type: 'basic',
    },
    // Amenidades opcionales (personalizadas)
    ...(accommodation.accommodation_amenities?.map((amenity) => ({
      condition: true,
      icon: <Star size={20} color="#4ADE80" />,
      name: amenity.amenity_name,
      type: amenity.amenity_type || 'optional',
    })) || []),
  ].filter((amenity) => amenity.condition);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {accommodation.accommodation_images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={toggleFavorite}
            >
              <Heart
                size={24}
                color={isFavorite ? '#EF4444' : '#FFFFFF'}
                fill={isFavorite ? '#EF4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {accommodation.accommodation_images.length > 1 && (
            <View style={styles.imageIndicators}>
              {accommodation.accommodation_images.map((_, index) => (
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

        <View style={styles.content}>
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

          <View style={styles.propertyInfo}>
            <View style={styles.infoItem}>
              <Users size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>
                {accommodation.capacity} huéspedes
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Bed size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>{accommodation.bedrooms} hab.</Text>
            </View>
            <View style={styles.infoItem}>
              <Bath size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>
                {accommodation.bathrooms} baños
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.hostSection}
            onPress={handleContactHost}
            activeOpacity={0.8}
          >
            <View style={styles.hostInfo}>
              <Image
                source={{
                  uri:
                    accommodation.host.avatar_url ||
                    'https://via.placeholder.com/150?text=Host',
                }}
                style={styles.hostAvatar}
              />
              <View>
                <Text style={styles.hostName}>
                  Anfitrión: {accommodation.host.first_name}{' '}
                  {accommodation.host.last_name}
                </Text>
                <Text style={styles.contactHostText}>
                  Contactar al anfitrión
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{accommodation.description}</Text>
          </View>

          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            {availableAmenities.length > 0 ? (
              <View style={styles.amenitiesList}>
                {availableAmenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    {amenity.icon}
                    <View style={styles.amenityTextContainer}>
                      <Text style={styles.amenityText}>{amenity.name}</Text>
                      {amenity.type !== 'basic' && (
                        <Text style={styles.amenityTypeText}>
                          (
                          {amenity.type === 'optional'
                            ? 'adicional'
                            : amenity.type}
                          )
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noAmenitiesText}>
                No hay servicios registrados
              </Text>
            )}
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reseñas</Text>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setReviewModalVisible(true)}
              >
                <Plus size={20} color="#4ADE80" />
                <Text style={styles.addReviewButtonText}>Añadir reseña</Text>
              </TouchableOpacity>
            </View>

            {accommodation.accommodation_reviews.length > 0 ? (
              <>
                {accommodation.accommodation_reviews.map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeaderContent}>
                      <Image
                        source={{
                          uri:
                            review.profile?.avatar_url ||
                            'https://via.placeholder.com/150?text=User',
                        }}
                        style={styles.reviewerAvatar}
                      />
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewerName}>
                          {review.profile?.first_name || 'Anónimo'}
                        </Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              color={i < review.rating ? '#4ADE80' : '#9CA3AF'}
                              fill={
                                i < review.rating ? '#4ADE80' : 'transparent'
                              }
                            />
                          ))}
                        </View>
                        {review.comment && (
                          <Text style={styles.reviewText}>
                            {review.comment}
                          </Text>
                        )}
                      </View>

                      {review.responses && review.responses.length > 0 && (
                        <TouchableOpacity
                          onPress={() => toggleReviewResponses(review.id)}
                          style={styles.toggleResponsesButton}
                        >
                          <MessageSquare size={20} color="#4ADE80" />
                          <Text style={styles.toggleResponsesText}>
                            {review.responses.length}{' '}
                            {review.responses.length === 1
                              ? 'respuesta'
                              : 'respuestas'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {review.showResponses &&
                      review.responses &&
                      review.responses.length > 0 && (
                        <View style={styles.responsesContainer}>
                          {review.responses.map((response) => (
                            <View key={response.id} style={styles.responseItem}>
                              <View style={styles.responseHeader}>
                                <Image
                                  source={{
                                    uri:
                                      response.profile?.avatar_url ||
                                      'https://via.placeholder.com/150?text=User',
                                  }}
                                  style={styles.responseAvatar}
                                />
                                <View>
                                  <Text style={styles.responseName}>
                                    {response.profile?.first_name || 'Anónimo'}
                                  </Text>
                                  <Text style={styles.responseDate}>
                                    {new Date(
                                      response.created_at
                                    ).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.responseText}>
                                {response.response_text}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                    {(user?.id === accommodation.host_id ||
                      user?.id === review.user_id) && (
                      <View style={styles.responseForm}>
                        <TextInput
                          style={styles.responseInput}
                          placeholder="Escribe una respuesta..."
                          placeholderTextColor="#9CA3AF"
                          value={responseTexts[review.id] || ''}
                          onChangeText={(text) =>
                            setResponseTexts((prev) => ({
                              ...prev,
                              [review.id]: text,
                            }))
                          }
                          multiline
                        />
                        <TouchableOpacity
                          style={styles.sendResponseButton}
                          onPress={() => handleSubmitResponse(review.id)}
                          disabled={
                            responseLoading[review.id] ||
                            !responseTexts[review.id]?.trim()
                          }
                        >
                          {responseLoading[review.id] ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Send size={20} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.noReviewsText}>
                Este alojamiento aún no tiene reseñas. ¡Sé el primero en dejar
                una!
              </Text>
            )}
          </View>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escribe tu reseña</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRating}>
              <Text style={styles.ratingLabel}>Calificación:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Star
                      size={32}
                      color={star <= reviewRating ? '#4ADE80' : '#9CA3AF'}
                      fill={star <= reviewRating ? '#4ADE80' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Escribe tu reseña (opcional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <Button
              title={reviewLoading ? 'Enviando...' : 'Enviar reseña'}
              onPress={handleCreateReview}
              disabled={reviewLoading || reviewRating === 0}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>

      {/* Modal para crear alojamiento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Alojamiento</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCreateModalVisible(false)}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.createForm}>
              <Text style={styles.inputLabel}>Nombre*</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del alojamiento"
                value={newAccommodation.name}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, name: text })
                }
              />

              <Text style={styles.inputLabel}>Descripción*</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Describe tu alojamiento"
                multiline
                value={newAccommodation.description}
                onChangeText={(text) =>
                  setNewAccommodation({
                    ...newAccommodation,
                    description: text,
                  })
                }
              />

              <Text style={styles.inputLabel}>Ubicación*</Text>
              <TextInput
                style={styles.input}
                placeholder="Ciudad, región"
                value={newAccommodation.location}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, location: text })
                }
              />

              <Text style={styles.inputLabel}>Dirección completa</Text>
              <TextInput
                style={styles.input}
                placeholder="Calle, número, etc."
                value={newAccommodation.address}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, address: text })
                }
              />

              <Text style={styles.inputLabel}>Precio por noche</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 50"
                keyboardType="numeric"
                value={newAccommodation.price_per_night}
                onChangeText={(text) =>
                  setNewAccommodation({
                    ...newAccommodation,
                    price_per_night: text,
                  })
                }
              />

              <Text style={styles.inputLabel}>Capacidad</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de huéspedes"
                keyboardType="numeric"
                value={newAccommodation.capacity}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, capacity: text })
                }
              />

              <Text style={styles.inputLabel}>Habitaciones</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de habitaciones"
                keyboardType="numeric"
                value={newAccommodation.bedrooms}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, bedrooms: text })
                }
              />

              <Text style={styles.inputLabel}>Baños</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de baños"
                keyboardType="numeric"
                value={newAccommodation.bathrooms}
                onChangeText={(text) =>
                  setNewAccommodation({ ...newAccommodation, bathrooms: text })
                }
              />

              <Text style={styles.sectionTitle}>Amenidades Principales</Text>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Wifi size={20} color="#4ADE80" />
                  <Text style={styles.amenitySwitchLabel}>Wi-Fi</Text>
                </View>
                <Switch
                  value={newAccommodation.has_wifi}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_wifi: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Utensils size={20} color="#4ADE80" />
                  <Text style={styles.amenitySwitchLabel}>Cocina</Text>
                </View>
                <Switch
                  value={newAccommodation.has_kitchen}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_kitchen: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Car size={20} color="#4ADE80" />
                  <Text style={styles.amenitySwitchLabel}>Estacionamiento</Text>
                </View>
                <Switch
                  value={newAccommodation.has_parking}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_parking: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Text style={{ fontSize: 20 }}>🚴</Text>
                  <Text style={styles.amenitySwitchLabel}>
                    Guardado de bicis
                  </Text>
                </View>
                <Switch
                  value={newAccommodation.has_bike_storage}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_bike_storage: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Text style={{ fontSize: 20 }}>🚲</Text>
                  <Text style={styles.amenitySwitchLabel}>
                    Alquiler de bicis
                  </Text>
                </View>
                <Switch
                  value={newAccommodation.has_bike_rental}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_bike_rental: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Text style={{ fontSize: 20 }}>🛠️</Text>
                  <Text style={styles.amenitySwitchLabel}>
                    Herramientas para bicis
                  </Text>
                </View>
                <Switch
                  value={newAccommodation.has_bike_tools}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_bike_tools: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.amenitySwitch}>
                <View style={styles.amenitySwitchText}>
                  <Text style={{ fontSize: 20 }}>🧺</Text>
                  <Text style={styles.amenitySwitchLabel}>Lavandería</Text>
                </View>
                <Switch
                  value={newAccommodation.has_laundry}
                  onValueChange={(value) =>
                    setNewAccommodation({
                      ...newAccommodation,
                      has_laundry: value,
                    })
                  }
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor="#f4f3f4"
                />
              </View>

              <View style={styles.customAmenitiesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Amenidades Personalizadas
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsAmenityModalVisible(true)}
                  >
                    <Plus size={20} color="#4ADE80" />
                  </TouchableOpacity>
                </View>

                {customAmenities.length > 0 ? (
                  <FlatList
                    data={customAmenities}
                    renderItem={({ item, index }) => (
                      <View style={styles.customAmenityItem}>
                        <Text style={styles.customAmenityText}>
                          {item.name} {item.type && `(${item.type})`}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeCustomAmenity(index)}
                        >
                          <X size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.noAmenitiesText}>
                    No hay amenidades personalizadas
                  </Text>
                )}
              </View>

              <Button
                title={loadingCreate ? 'Creando...' : 'Crear Alojamiento'}
                onPress={handleCreateAccommodation}
                disabled={loadingCreate}
                style={styles.submitButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para agregar amenidad personalizada */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAmenityModalVisible}
        onRequestClose={() => setIsAmenityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Amenidad</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsAmenityModalVisible(false)}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre de la amenidad*</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sauna, Jacuzzi, etc."
              value={newAmenityName}
              onChangeText={setNewAmenityName}
            />

            <Text style={styles.inputLabel}>Tipo (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: relax, deporte, etc."
              value={newAmenityType}
              onChangeText={setNewAmenityType}
            />

            <Button
              title="Agregar Amenidad"
              onPress={addCustomAmenity}
              disabled={!newAmenityName.trim()}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.price}>${accommodation.price_per_night}</Text>
          <Text style={styles.priceUnit}>/noche</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Text style={styles.reportButtonText}>Reportar</Text>
          </TouchableOpacity>
          <Button
            title="Reservar"
            onPress={handleReserve}
            style={styles.reserveButton}
          />
        </View>
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
    paddingBottom: 100,
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
    marginTop: 4,
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
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
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
  noAmenitiesText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reviewsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 24,
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addReviewButtonText: {
    color: '#4ADE80',
    marginLeft: 8,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#374151',
  },
  reviewContent: {
    flex: 1,
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
  reviewText: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  noReviewsText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  toggleResponsesButton: {
    alignItems: 'center',
    marginLeft: 8,
  },
  toggleResponsesText: {
    color: '#4ADE80',
    fontSize: 12,
    marginTop: 2,
  },
  responsesContainer: {
    marginTop: 12,
    marginLeft: 52,
    borderLeftWidth: 1,
    borderLeftColor: '#374151',
    paddingLeft: 12,
  },
  responseItem: {
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  responseAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  responseName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  responseDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  responseText: {
    color: '#E5E7EB',
  },
  responseForm: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  responseInput: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendResponseButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    padding: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalRating: {
    marginBottom: 20,
  },
  ratingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalInput: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  submitButton: {
    width: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reserveButton: {
    paddingHorizontal: 24,
    flex: 0,
  },
  createForm: {
    maxHeight: '80%',
  },
  amenitySwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  amenitySwitchText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenitySwitchLabel: {
    color: '#FFFFFF',
    marginLeft: 12,
  },
  customAmenitiesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  customAmenityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  customAmenityText: {
    color: '#FFFFFF',
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  amenityIte: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '50%',
  marginBottom: 16,
},
amenityTextContainer: {
  marginLeft: 12,
},
amenityTet: {
  color: '#FFFFFF',
  fontSize: 16,
},
amenityTypeText: {
  color: '#9CA3AF',
  fontSize: 12,
  fontStyle: 'italic',
},
});
