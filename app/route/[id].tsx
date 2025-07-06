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
  Share,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Star, MapPin, Clock, Mountain, Route, Share2, Flag, X } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

interface RouteData {
  id: string;
  name: string;
  description: string;
  distance: number;
  elevation_gain: number;
  difficulty: string;
  estimated_time: number;
  start_location: string;
  end_location: string;
  is_loop: boolean;
  route_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
  route_reviews: Array<{
    rating: number;
    comment: string;
    difficulty_rating: number;
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

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams();
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const { t } = useI18n();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportCategory, setReportCategory] = useState('');

  useEffect(() => {
    fetchRoute();
    if (user) {
      checkIfFavorite();
    }
  }, [id, user]);

  const fetchRoute = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_images(*),
          route_reviews(*, profiles(first_name, avatar_url)),
          profiles(first_name, last_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRoute(data);
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('favorite_routes')
        .select('id')
        .eq('user_id', user.id)
        .eq('route_id', id)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorite_routes')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', id);
      } else {
        await supabase
          .from('favorite_routes')
          .insert({
            user_id: user.id,
            route_id: id as string,
          });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const shareRoute = async () => {
    if (!route) return;
    
    try {
      const shareOptions = {
        message: `Mira esta ruta que encontré: ${route.name}\n\nDistancia: ${route.distance}km\nDificultad: ${getDifficultyText(route.difficulty)}\n\nDescripción: ${route.description.substring(0, 100)}...`,
        url: `https://tusitio.com/rutas/${route.id}`,
        title: `Ruta: ${route.name}`,
      };

      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la ruta');
    }
  };

  const shareOnWhatsApp = async () => {
    if (!route) return;
    
    const url = `whatsapp://send?text=Mira esta ruta que encontré: ${route.name} - ${route.distance}km, Dificultad: ${getDifficultyText(route.difficulty)}. Más info: https://tusitio.com/rutas/${route.id}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'WhatsApp no está instalado');
    }
  };

  const shareOnTelegram = async () => {
    if (!route) return;
    
    const url = `tg://msg?text=Mira esta ruta que encontré: ${route.name} - ${route.distance}km, Dificultad: ${getDifficultyText(route.difficulty)}. Más info: https://tusitio.com/rutas/${route.id}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Telegram no está instalado');
    }
  };

  const openReportModal = () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para reportar un problema');
      return;
    }
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportCategory || !reportText) {
      Alert.alert('Error', 'Por favor selecciona una categoría y describe el problema');
      return;
    }

    try {
      const { error } = await supabase
        .from('route_reports')
        .insert({
          route_id: id,
          user_id: user?.id,
          category: reportCategory,
          description: reportText,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('Reporte enviado', 'Gracias por reportar el problema. Lo revisaremos pronto.');
      setReportModalVisible(false);
      setReportText('');
      setReportCategory('');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4ADE80';
      case 'moderate':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      case 'expert':
        return '#8B5CF6';
      default:
        return '#9CA3AF';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'moderate':
        return 'Moderado';
      case 'hard':
        return 'Difícil';
      case 'expert':
        return 'Experto';
      default:
        return difficulty;
    }
  };

  const calculateAverageRating = () => {
    if (!route?.route_reviews.length) return 0;
    const sum = route.route_reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / route.route_reviews.length;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!route) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Route not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const averageRating = calculateAverageRating();
  const images = route.route_images.length > 0 
    ? route.route_images 
    : [{ image_url: 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg', is_primary: true }];

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
            <View style={styles.rightHeaderButtons}>
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={shareRoute}
              >
                <Share2 size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.reportButton} 
                onPress={openReportModal}
              >
                <Flag size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                <Heart
                  size={24}
                  color={isFavorite ? "#EF4444" : "#FFFFFF"}
                  fill={isFavorite ? "#EF4444" : "transparent"}
                />
              </TouchableOpacity>
            </View>
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
            <Text style={styles.title}>{route.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#4ADE80" fill="#4ADE80" />
              <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({route.route_reviews.length})
              </Text>
            </View>
          </View>

          <View style={styles.routeTypeContainer}>
            <Text style={styles.routeType}>{t('route.touristRoute')}</Text>
          </View>

          {/* Route Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Route size={20} color="#4ADE80" />
              <Text style={styles.statLabel}>{t('route.distance')}</Text>
              <Text style={styles.statValue}>{route.distance} km</Text>
            </View>
            
            <View style={styles.statItem}>
              <Mountain size={20} color="#4ADE80" />
              <Text style={styles.statLabel}>{t('route.elevation')}</Text>
              <Text style={styles.statValue}>{route.elevation_gain || 0} m</Text>
            </View>
            
            <View style={styles.statItem}>
              <Clock size={20} color="#4ADE80" />
              <Text style={styles.statLabel}>{t('route.estimatedTime')}</Text>
              <Text style={styles.statValue}>{formatTime(route.estimated_time || 0)}</Text>
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.difficultySection}>
            <Text style={styles.sectionTitle}>{t('route.difficulty')}</Text>
            <View style={styles.difficultyContainer}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(route.difficulty) }]}>
                <Text style={styles.difficultyText}>{getDifficultyText(route.difficulty)}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>{route.description}</Text>
          </View>

          {/* Route Points */}
          <View style={styles.routePointsSection}>
            <Text style={styles.sectionTitle}>Puntos de la ruta</Text>
            
            <View style={styles.routePoint}>
              <View style={styles.routePointIcon}>
                <MapPin size={16} color="#4ADE80" />
              </View>
              <View style={styles.routePointContent}>
                <Text style={styles.routePointLabel}>{t('route.startLocation')}</Text>
                <Text style={styles.routePointValue}>{route.start_location}</Text>
              </View>
            </View>

            <View style={styles.routePoint}>
              <View style={styles.routePointIcon}>
                <MapPin size={16} color="#EF4444" />
              </View>
              <View style={styles.routePointContent}>
                <Text style={styles.routePointLabel}>{t('route.endLocation')}</Text>
                <Text style={styles.routePointValue}>{route.end_location}</Text>
              </View>
            </View>
          </View>

          {/* Map Placeholder */}
          <View style={styles.mapSection}>
            <View style={styles.mapPlaceholder}>
              <MapPin size={40} color="#4ADE80" />
              <Text style={styles.mapPlaceholderText}>Mapa de la ruta</Text>
            </View>
          </View>

          {/* Points of Interest */}
          <View style={styles.poiSection}>
            <Text style={styles.sectionTitle}>{t('route.pointsOfInterest')}</Text>
            <View style={styles.poiList}>
              <View style={styles.poiItem}>
                <View style={styles.poiIcon}>
                  <Mountain size={16} color="#4ADE80" />
                </View>
                <Text style={styles.poiText}>Mirador panorámico</Text>
              </View>
              <View style={styles.poiItem}>
                <View style={styles.poiIcon}>
                  <MapPin size={16} color="#4ADE80" />
                </View>
                <Text style={styles.poiText}>Área de descanso</Text>
              </View>
            </View>
          </View>

          {/* Reviews */}
          {route.route_reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>{t('route.reviews')}</Text>
              
              <View style={styles.reviewsList}>
                {route.route_reviews.slice(0, 2).map((review, index) => (
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
                        <View style={styles.reviewRating}>
                          <Star size={12} color="#4ADE80" fill="#4ADE80" />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Creator Info */}
          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Creador de la ruta</Text>
            <View style={styles.creatorInfo}>
              <Image
                source={{
                  uri: route.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
                }}
                style={styles.creatorAvatar}
              />
              <View>
                <Text style={styles.creatorName}>
                  {route.profiles.first_name} {route.profiles.last_name}
                </Text>
                <Text style={styles.creatorTitle}>Guía local</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={isFavorite ? t('route.saved') : t('route.save')}
          onPress={toggleFavorite}
          variant={isFavorite ? "secondary" : "primary"}
          style={styles.saveButton}
        />
      </View>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => {
          setReportModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar problema</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setReportModalVisible(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Selecciona el tipo de problema:</Text>
            
            <View style={styles.categoryButtons}>
              <TouchableOpacity 
                style={[
                  styles.categoryButton,
                  reportCategory === 'danger' && styles.categoryButtonSelected
                ]}
                onPress={() => setReportCategory('danger')}
              >
                <Text style={styles.categoryButtonText}>Peligro en la ruta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.categoryButton,
                  reportCategory === 'incorrect_info' && styles.categoryButtonSelected
                ]}
                onPress={() => setReportCategory('incorrect_info')}
              >
                <Text style={styles.categoryButtonText}>Información incorrecta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.categoryButton,
                  reportCategory === 'other' && styles.categoryButtonSelected
                ]}
                onPress={() => setReportCategory('other')}
              >
                <Text style={styles.categoryButtonText}>Otro problema</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Describe el problema:</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="Proporciona detalles sobre el problema que encontraste..."
              value={reportText}
              onChangeText={setReportText}
            />
            
            <Button
              title="Enviar reporte"
              onPress={submitReport}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
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
  rightHeaderButtons: {
    flexDirection: 'row',
  },
  shareButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  reportButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
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
  routeTypeContainer: {
    marginBottom: 20,
  },
  routeType: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  difficultyContainer: {
    flexDirection: 'row',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  routePointsSection: {
    marginBottom: 24,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routePointContent: {
    flex: 1,
  },
  routePointLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  routePointValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  mapSection: {
    marginBottom: 24,
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
  poiSection: {
    marginBottom: 24,
  },
  poiList: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  poiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  poiText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsList: {
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  creatorSection: {
    marginBottom: 100,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorTitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  bottomBar: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  socialShareButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  socialShareText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    width: '100%',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  categoryButtons: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#4ADE80',
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  reportInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
  },
});