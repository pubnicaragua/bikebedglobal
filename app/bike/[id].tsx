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
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, MapPin, Bike as BikeIcon } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface Bike {
  id: string;
  bike_type: string;
  price_per_day: number;
  is_available: boolean;
  bike_size: string;
  description: string;
  image_url: string;
  rating: number;
  location: string;
}

const BikeDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBikeDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bike_rentals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBike(data);
    } catch (error) {
      console.error('Error fetching bike details:', error);
      Alert.alert('Error', 'No se pudo cargar la bicicleta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBikeDetails();
  }, [id]);

  const handleRent = () => {
    router.push(`/`);
  };

  const openMaps = () => {
    if (bike?.location) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(bike.location)}`);
    }
  };

  if (loading || !bike) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: bike.image_url || 'https://via.placeholder.com/500x300?text=Bike' }}
            style={styles.mainImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.imageBadge}>
            <Text style={styles.bikeTypeText}>
              {bike.bike_type.charAt(0).toUpperCase() + bike.bike_type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{bike.bike_type} Bike</Text>
            <View style={styles.ratingContainer}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{bike.rating?.toFixed(1) || '4.5'}</Text>
            </View>
          </View>

          {/* Precio */}
          <Text style={styles.price}>${bike.price_per_day.toFixed(2)} / día</Text>

          {/* Disponibilidad */}
          <View style={[
            styles.availabilityBadge,
            bike.is_available ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={styles.availabilityText}>
              {bike.is_available ? 'Disponible para rentar' : 'No disponible actualmente'}
            </Text>
          </View>

          {/* Detalles */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <BikeIcon size={20} color="#4ADE80" />
              <Text style={styles.detailText}>Talla {bike.bike_size.toUpperCase()}</Text>
            </View>

            <TouchableOpacity style={styles.detailItem} onPress={openMaps}>
              <MapPin size={20} color="#4ADE80" />
              <Text style={styles.detailText}>{bike.location || 'Ubicación no especificada'}</Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {bike.description || 'Esta bicicleta no tiene descripción disponible.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón de renta */}
      {bike.is_available && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.rentButton} onPress={handleRent}>
            <Text style={styles.rentButtonText}>Rentar esta bicicleta</Text>
          </TouchableOpacity>
        </View>
      )}
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
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bikeTypeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '600',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4ADE80',
    marginBottom: 16,
  },
  availabilityBadge: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  availableBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  rentButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  rentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BikeDetailScreen;