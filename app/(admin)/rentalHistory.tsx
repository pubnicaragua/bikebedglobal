import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // Para el indicador de carga
  Alert, // Usado para mensajes, aunque se prefiere un modal personalizado
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft, // Icono para volver atrás
  Calendar,
  DollarSign,
  User,
  Bike,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase'; // Asegúrate de que esta ruta sea correcta
import { useI18n } from '../../src/hooks/useI18n'; // Para internacionalización

// Definición de la interfaz para una reserva de bicicleta
interface BikeBooking {
  id: string;
  user_id: string;
  bike_id: string;
  start_date: string; // Formato de fecha ISO (YYYY-MM-DD)
  end_date: string;   // Formato de fecha ISO (YYYY-MM-DD)
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string; // Timestamp ISO
  updated_at: string; // Timestamp ISO
  // Campos adicionales para detalles del usuario y la bicicleta (obtenidos por join)
  profiles?: { first_name?: string; last_name?: string; email?: string };
  bike_rentals?: { bike_type?: string; bike_size?: string };
}

export default function RentalHistoryScreen() {
  const [bookings, setBookings] = useState<BikeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n(); // Hook para obtener traducciones

  useEffect(() => {
    fetchRentalHistory();
  }, []);

  const fetchRentalHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Realiza una consulta a la tabla bike_bookings
      // Ahora selecciona 'first_name' y 'last_name' de la tabla 'profiles'
      // Y 'bike_type' y 'bike_size' de la tabla 'bike_rentals'
      const { data, error } = await supabase
        .from('bike_bookings')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          ),
          bike_rentals (
            bike_type,
            bike_size
          )
        `)
        .order('created_at', { ascending: false }); // Ordena por fecha de creación descendente

      // --- INICIO DE CAMBIOS PARA DEPURACIÓN ---
      console.log('Datos recibidos de Supabase:', data);
      console.log('Error recibido de Supabase:', error);
      // --- FIN DE CAMBIOS PARA DEPURACIÓN ---

      if (error) {
        throw error;
      }

      setBookings(data as BikeBooking[]);
    } catch (err: any) {
      console.error('Error fetching rental history:', err.message);
      setError('No se pudo cargar el historial de alquileres. Inténtalo de nuevo más tarde.');
      // En un entorno de producción, podrías usar un modal en lugar de Alert
      Alert.alert('Error', 'No se pudo cargar el historial de alquileres. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Componente para renderizar cada tarjeta de reserva
  const BookingCard = ({ booking }: { booking: BikeBooking }) => {
    const getUserName = () => {
      // Combina first_name y last_name si están disponibles
      if (booking.profiles?.first_name || booking.profiles?.last_name) {
        return `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim();
      }
      if (booking.profiles?.email) return booking.profiles.email;
      return 'Usuario Desconocido';
    };

    const getBikeName = () => {
      // Prioriza el tipo y tamaño de la bicicleta, si no existen, muestra parte del ID
      if (booking.bike_rentals?.bike_type && booking.bike_rentals?.bike_size) {
        return `${booking.bike_rentals.bike_type} (${booking.bike_rentals.bike_size.toUpperCase()})`;
      }
      if (booking.bike_rentals?.bike_type) {
        return booking.bike_rentals.bike_type;
      }
      return `Bicicleta ID: ${booking.bike_id.substring(0, 8)}...`; // Muestra parte del ID si no hay tipo/tamaño
    };

    const getStatusIcon = (status: BikeBooking['status']) => {
      switch (status) {
        case 'completed':
          return <CheckCircle size={18} color="#10B981" />; // Verde para completado
        case 'confirmed':
          return <CheckCircle size={18} color="#3B82F6" />; // Azul para confirmado
        case 'pending':
          return <Clock size={18} color="#F59E0B" />;      // Naranja para pendiente
        case 'cancelled':
          return <XCircle size={18} color="#EF4444" />;      // Rojo para cancelado
        default:
          return <Info size={18} color="#9CA3AF" />;        // Gris para desconocido
      }
    };

    const getPaymentStatusColor = (status: BikeBooking['payment_status']) => {
      switch (status) {
        case 'paid':
          return '#10B981'; // Verde
        case 'pending':
          return '#F59E0B'; // Naranja
        case 'refunded':
          return '#EF4444'; // Rojo
        default:
          return '#9CA3AF'; // Gris
      }
    };

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingId}>ID: {booking.id.substring(0, 8)}...</Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(booking.status)}
            <Text style={[styles.bookingStatus, { marginLeft: 4 }]}>{t(`bookingStatus.${booking.status}`)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetailRow}>
          <User size={16} color="#9CA3AF" />
          <Text style={styles.bookingDetailText}>Usuario: {getUserName()}</Text>
        </View>

        <View style={styles.bookingDetailRow}>
          <Bike size={16} color="#9CA3AF" />
          <Text style={styles.bookingDetailText}>Bicicleta: {getBikeName()}</Text>
        </View>

        <View style={styles.bookingDetailRow}>
          <Calendar size={16} color="#9CA3AF" />
          <Text style={styles.bookingDetailText}>
            Fechas: {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.bookingDetailRow}>
          <DollarSign size={16} color="#9CA3AF" />
          <Text style={styles.bookingDetailText}>
            Total: ${booking.total_price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.bookingDetailRow}>
          <Text style={styles.paymentStatusLabel}>Estado de Pago:</Text>
          <Text style={[styles.paymentStatusText, { color: getPaymentStatusColor(booking.payment_status) }]}>
            {t(`paymentStatus.${booking.payment_status}`)}
          </Text>
        </View>

        <Text style={styles.bookingTimestamp}>
          Creado: {new Date(booking.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando historial de alquileres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRentalHistory}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Historial de Alquileres</Text>
        <View style={{ width: 24 }} /> {/* Espaciador para centrar el título */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.noBookingsContainer}>
            <Text style={styles.noBookingsText}>No hay historial de alquileres disponible.</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Fondo oscuro consistente
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noBookingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noBookingsText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  bookingId: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bookingStatus: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize', // Para que la primera letra sea mayúscula
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  paymentStatusLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  bookingTimestamp: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 10,
    textAlign: 'right',
  },
});