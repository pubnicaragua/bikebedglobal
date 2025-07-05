import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MapPin, Flag, Clock, Edit, Trash2 } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface Route {
  id: string;
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
  images?: { image_url: string; is_primary: boolean }[];
}

export const RouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRouteDetails = async () => {
    try {
      setLoading(true);
      
      // Obtener detalles de la ruta
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (routeError) throw routeError;

      // Obtener imágenes de la ruta
      const { data: imagesData, error: imagesError } = await supabase
        .from('route_images')
        .select('image_url, is_primary')
        .eq('route_id', id);

      if (imagesError) console.error('Error fetching images:', imagesError);

      setRoute({
        ...routeData,
        images: imagesData || []
      });

    } catch (error) {
      console.error('Error fetching route details:', error);
      Alert.alert('Error', 'No se pudo cargar la ruta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRouteDetails();
  }, [id]);

  const getDifficultyColor = () => {
    if (!route) return '#6B7280';
    switch (route.difficulty) {
      case 'easy': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'expert': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const openMaps = (location: string) => {
    if (location) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(location)}`);
    }
  };

  if (loading || !route) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const primaryImage = route.images?.find(img => img.is_primary) || route.images?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Botones de acción (opcional, solo si el usuario es el creador) */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton}>
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: primaryImage?.image_url || 'https://via.placeholder.com/500x300?text=Route' }}
            style={styles.mainImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.imageBadge}>
            <Text style={styles.routeNameText}>{route.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Estado y verificación */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              route.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={styles.statusText}>
                {route.is_active ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
            
            {route.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verificada</Text>
              </View>
            )}
            
            {route.is_loop && (
              <View style={styles.loopBadge}>
                <Flag size={14} color="#8B5CF6" />
                <Text style={styles.loopText}>Circular</Text>
              </View>
            )}
          </View>

          {/* Información básica */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distancia</Text>
              <Text style={styles.infoValue}>{route.distance} km</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dificultad</Text>
              <Text style={[styles.infoValue, { color: getDifficultyColor() }]}>
                {route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo estimado</Text>
              <Text style={styles.infoValue}>
                {formatTime(route.estimated_time)}
              </Text>
            </View>
            
            {route.elevation_gain && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Elevación</Text>
                <Text style={styles.infoValue}>{route.elevation_gain} m</Text>
              </View>
            )}
          </View>

          {/* Ubicaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recorrido</Text>
            <TouchableOpacity 
              style={styles.locationItem} 
              onPress={() => openMaps(route.start_location)}
            >
              <MapPin size={16} color="#8B5CF6" />
              <Text style={styles.locationText}>
                <Text style={styles.locationLabel}>Inicio: </Text>
                {route.start_location}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.locationItem} 
              onPress={() => openMaps(route.end_location)}
            >
              <MapPin size={16} color="#EF4444" />
              <Text style={styles.locationText}>
                <Text style={styles.locationLabel}>Fin: </Text>
                {route.end_location}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {route.description || 'Esta ruta no tiene descripción disponible.'}
            </Text>
          </View>

          {/* Galería de imágenes */}
          {route.images && route.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería ({route.images.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContainer}
              >
                {route.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image.image_url }}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  routeNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  loopText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    minWidth: '30%',
    flex: 1,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    color: '#E5E7EB',
    fontSize: 16,
  },
  locationLabel: {
    fontWeight: '600',
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
  },
  galleryContainer: {
    paddingBottom: 10,
  },
  galleryImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
});

export default RouteDetailScreen;