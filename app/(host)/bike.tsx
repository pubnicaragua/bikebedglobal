import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Bike, Eye, Edit, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import EditBikeModal from '../../src/components/ui/EditBikeModal';

export interface Bike {
  id: string;
  bike_type: string;
  price_per_day: number;
  is_available: boolean;
  bike_size: string | null;
  description: string | null;
  image_url: string | null;
}

const DEFAULT_IMAGE_URL = 'https://picsum.photos/200/300?random=';

export default function BikesManagementScreen() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBikes();
    }
  }, [user]);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bike_rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBikes(data || []);
    } catch (error) {
      console.error('Error fetching bikes:', error);
      Alert.alert('Error', 'No se pudieron cargar las bicicletas');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (bikeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('bike_rentals')
        .update({ is_available: !currentStatus })
        .eq('id', bikeId);

      if (error) throw error;

      setBikes(bikes.map(bike => 
        bike.id === bikeId ? { ...bike, is_available: !currentStatus } : bike
      ));
    } catch (error) {
      console.error('Error updating bike status:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const handleBikeUpdate = (updatedBike: Bike) => {
    setBikes(bikes.map(bike => bike.id === updatedBike.id ? updatedBike : bike));
    setIsEditModalVisible(false);
  };

  const BikeCard = ({ bike }: { bike: Bike }) => (
    <View style={styles.bikeCard}>
      <Image
        source={{ uri: bike.image_url || DEFAULT_IMAGE_URL + bike.id }}
        style={styles.bikeImage}
        resizeMode="cover"
      />
      <View style={styles.bikeContent}>
        <View style={styles.bikeHeader}>
          <Text style={styles.bikeType}>
            {bike.bike_type.charAt(0).toUpperCase() + bike.bike_type.slice(1)}
          </Text>
          <TouchableOpacity
            onPress={() => toggleAvailability(bike.id, bike.is_available)}
            style={styles.toggleButton}
          >
            {bike.is_available ? (
              <ToggleRight size={24} color="#4ADE80" />
            ) : (
              <ToggleLeft size={24} color="#EF4444" />
            )}
            <Text style={[
              styles.availabilityText,
              bike.is_available ? styles.availableText : styles.unavailableText
            ]}>
              {bike.is_available ? 'Disponible' : 'No disponible'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bikePrice}>${bike.price_per_day}/día</Text>
        {bike.bike_size && (
          <Text style={styles.bikeSize}>Talla: {bike.bike_size.toUpperCase()}</Text>
        )}
        <View style={styles.bikeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/bike/${bike.id}`)}
          >
            <Eye size={16} color="#4ADE80" />
            <Text style={styles.actionText}>Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setEditingBike(bike);
              setIsEditModalVisible(true);
            }}
          >
            <Edit size={16} color="#F59E0B" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Bicicletas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/bike/new')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tarjetas de resumen */}
      <View style={styles.summaryCardsContainer}>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Bike size={24} color="#FFFFFF" />
          <Text style={styles.summaryNumber}>{bikes.length}</Text>
          <Text style={styles.summaryText}>Total</Text>
        </View>

        <View style={[styles.summaryCard, styles.availableCard]}>
          <ToggleRight size={24} color="#FFFFFF" />
          <Text style={styles.summaryNumber}>
            {bikes.filter(b => b.is_available).length}
          </Text>
          <Text style={styles.summaryText}>Disponibles</Text>
        </View>

        <View style={[styles.summaryCard, styles.unavailableCard]}>
          <ToggleLeft size={24} color="#FFFFFF" />
          <Text style={styles.summaryNumber}>
            {bikes.filter(b => !b.is_available).length}
          </Text>
          <Text style={styles.summaryText}>No disponibles</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bikes.length > 0 ? (
          <View style={styles.bikesList}>
            {bikes.map(bike => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bike size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No tienes bicicletas</Text>
            <Text style={styles.emptyDescription}>
              Agrega tu primera bicicleta para comenzar a ofrecerla
            </Text>
          </View>
        )}
      </ScrollView>

      <EditBikeModal
        visible={isEditModalVisible}
        bike={editingBike}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleBikeUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: { marginRight: 16 },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bikesList: {
    flex: 1,
  },
  bikeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bikeImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#374151',
  },
  bikeContent: {
    padding: 16,
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bikeType: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  availableText: {
    color: '#4ADE80',
  },
  unavailableText: {
    color: '#EF4444',
  },
  bikePrice: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bikeSize: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  bikeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCard: {
    backgroundColor: '#6366F1',
  },
  availableCard: {
    backgroundColor: '#10B981',
  },
  unavailableCard: {
    backgroundColor: '#EF4444',
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});