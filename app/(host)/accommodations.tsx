import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Home, Edit, Eye, MoreVertical } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  location: string;
  price_per_night: number;
  capacity: number;
  is_active: boolean;
  accommodation_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
  bookings: Array<{
    id: string;
    status: string;
  }>;
}

export default function AccommodationsManagementScreen() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchAccommodations();
    }
  }, [user]);

  const fetchAccommodations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select(`
          *,
          accommodation_images(*),
          bookings(id, status)
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccommodations(data || []);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      Alert.alert('Error', 'No se pudieron cargar los alojamientos');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccommodationStatus = async (accommodationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ is_active: !currentStatus })
        .eq('id', accommodationId);

      if (error) throw error;
      
      setAccommodations(prev => prev.map(acc => 
        acc.id === accommodationId ? { ...acc, is_active: !currentStatus } : acc
      ));
      
      Alert.alert('Éxito', `Alojamiento ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error updating accommodation status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del alojamiento');
    }
  };

  const AccommodationCard = ({ accommodation }: { accommodation: Accommodation }) => {
    const primaryImage = accommodation.accommodation_images.find(img => img.is_primary) || 
                        accommodation.accommodation_images[0];
    const activeBookings = accommodation.bookings.filter(b => b.status === 'confirmed').length;

    return (
      <View style={styles.accommodationCard}>
        <Image
          source={{
            uri: primaryImage?.image_url || 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
          }}
          style={styles.accommodationImage}
        />
        
        <View style={styles.accommodationContent}>
          <View style={styles.accommodationHeader}>
            <Text style={styles.accommodationName} numberOfLines={1}>
              {accommodation.name}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: accommodation.is_active ? '#4ADE80' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {accommodation.is_active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.accommodationLocation} numberOfLines={1}>
            {accommodation.location}
          </Text>
          
          <View style={styles.accommodationStats}>
            <Text style={styles.statText}>
              ${accommodation.price_per_night}/noche
            </Text>
            <Text style={styles.statText}>
              {accommodation.capacity} huéspedes
            </Text>
            <Text style={styles.statText}>
              {activeBookings} reservas activas
            </Text>
          </View>
          
          <View style={styles.accommodationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/accommodation/${accommodation.id}`)}
            >
              <Eye size={16} color="#4ADE80" />
              <Text style={styles.actionText}>Ver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Navigate to edit screen (would need to be implemented)
                Alert.alert('Editar', 'Función de edición próximamente');
              }}
            >
              <Edit size={16} color="#F59E0B" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  accommodation.is_active ? 'Desactivar' : 'Activar',
                  `¿Estás seguro de que quieres ${accommodation.is_active ? 'desactivar' : 'activar'} este alojamiento?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: accommodation.is_active ? 'Desactivar' : 'Activar',
                      onPress: () => toggleAccommodationStatus(accommodation.id, accommodation.is_active),
                    },
                  ]
                );
              }}
            >
              <MoreVertical size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando alojamientos...</Text>
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
        <Text style={styles.title}>Mis Alojamientos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Alert.alert('Agregar', 'Función de agregar alojamiento próximamente');
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Home size={24} color="#4ADE80" />
            <Text style={styles.statNumber}>{accommodations.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Home size={24} color="#4ADE80" />
            <Text style={styles.statNumber}>
              {accommodations.filter(a => a.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statCard}>
            <Home size={24} color="#EF4444" />
            <Text style={styles.statNumber}>
              {accommodations.filter(a => !a.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Inactivos</Text>
          </View>
        </View>

        <View style={styles.accommodationsList}>
          {accommodations.length > 0 ? (
            accommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} accommodation={accommodation} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Home size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No tienes alojamientos</Text>
              <Text style={styles.emptyDescription}>
                Agrega tu primer alojamiento para comenzar a recibir huéspedes
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  Alert.alert('Agregar', 'Función de agregar alojamiento próximamente');
                }}
              >
                <Text style={styles.emptyButtonText}>Agregar Alojamiento</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
  backButton: {
    marginRight: 16,
  },
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
    padding: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  accommodationsList: {
    flex: 1,
  },
  accommodationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accommodationImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#374151',
  },
  accommodationContent: {
    padding: 16,
  },
  accommodationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accommodationName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  accommodationLocation: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  accommodationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  accommodationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
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
  emptyButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});