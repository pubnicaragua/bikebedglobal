import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';

export default function CreateBookingScreen() {
  const { accommodationId } = useLocalSearchParams();
  const [accommodation, setAccommodation] = useState<any>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (accommodationId) {
      fetchAccommodation();
    }
  }, [accommodationId]);

  const fetchAccommodation = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', accommodationId)
        .single();

      if (error) throw error;
      setAccommodation(data);
    } catch (error) {
      console.error('Error fetching accommodation:', error);
      Alert.alert('Error', 'No se pudo cargar la información del alojamiento');
    }
  };

  const calculateTotalPrice = () => {
    if (!accommodation || !checkInDate || !checkOutDate) return 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return nights * accommodation.price_per_night;
  };

  const handleCreateBooking = async () => {
    if (!user || !accommodation) {
      Alert.alert('Error', 'Por favor inicia sesión para hacer una reserva');
      return;
    }

    if (!checkInDate || !checkOutDate || !guests) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    const totalPrice = calculateTotalPrice();
    if (totalPrice <= 0) {
      Alert.alert('Error', 'Las fechas seleccionadas no son válidas');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          accommodation_id: accommodationId as string,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          guests: parseInt(guests),
          total_price: totalPrice,
          status: 'pending',
          payment_status: 'pending',
          special_requests: specialRequests || null,
        });

      if (error) throw error;

      Alert.alert(
        'Éxito',
        'Tu reserva ha sido creada exitosamente. El anfitrión la revisará pronto.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'No se pudo crear la reserva. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!accommodation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalPrice = calculateTotalPrice();
  const nights = checkInDate && checkOutDate ? 
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Reserva</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.accommodationInfo}>
          <Text style={styles.accommodationName}>{accommodation.name}</Text>
          <Text style={styles.accommodationLocation}>{accommodation.location}</Text>
          <Text style={styles.pricePerNight}>${accommodation.price_per_night} por noche</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.dateSection}>
            <Text style={styles.sectionTitle}>Fechas</Text>
            <View style={styles.dateInputs}>
              <View style={styles.dateInput}>
                <Input
                  label="Fecha de entrada"
                  value={checkInDate}
                  onChangeText={setCheckInDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.dateInput}>
                <Input
                  label="Fecha de salida"
                  value={checkOutDate}
                  onChangeText={setCheckOutDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>

          <View style={styles.guestsSection}>
            <Text style={styles.sectionTitle}>Huéspedes</Text>
            <Input
              label="Número de huéspedes"
              value={guests}
              onChangeText={setGuests}
              keyboardType="numeric"
              placeholder="2"
            />
            <Text style={styles.capacityNote}>
              Capacidad máxima: {accommodation.capacity} huéspedes
            </Text>
          </View>

          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Solicitudes especiales (opcional)</Text>
            <Input
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Ej: Llegada tarde, necesidades especiales..."
            />
          </View>

          {totalPrice > 0 && (
            <View style={styles.priceBreakdown}>
              <Text style={styles.sectionTitle}>Resumen de precios</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  ${accommodation.price_per_night} x {nights} noches
                </Text>
                <Text style={styles.priceValue}>${totalPrice}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${totalPrice}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalText}>Total: ${totalPrice}</Text>
        </View>
        <Button
          title="Crear Reserva"
          onPress={handleCreateBooking}
          loading={loading}
          disabled={totalPrice <= 0}
          style={styles.createButton}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  accommodationInfo: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  accommodationName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accommodationLocation: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  pricePerNight: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  guestsSection: {
    marginBottom: 24,
  },
  capacityNote: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  requestsSection: {
    marginBottom: 24,
  },
  priceBreakdown: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  totalInfo: {
    flex: 1,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 32,
  },
});