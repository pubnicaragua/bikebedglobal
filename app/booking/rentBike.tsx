import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert, // Usaremos un modal personalizado en un entorno real, pero para el ejemplo mantendremos Alert.
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Importamos useRouter en lugar de router y useLocalSearchParams
import { ArrowLeft, Calendar } from 'lucide-react-native'; // Se eliminan CreditCard y User ya que no se usan
import { supabase } from '../../src/services/supabase'; // Asegúrate de que esta ruta sea correcta
import DateTimePicker from '@react-native-community/datetimepicker';

const RentScreen = () => {
  // Parámetros recibidos de la navegación
  const { bikeId, bikeType, pricePerDay, bikeImage } = useLocalSearchParams();

  // Estados para las fechas de renta
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Estado para el ID del usuario
  const [userId, setUserId] = useState<string | null>(null);

  // Estado para el indicador de carga
  const [loading, setLoading] = useState(false);

  // Usamos useRouter para la navegación
  const router = useRouter();

  // Efecto para obtener el ID del usuario al cargar el componente
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // Manejar el caso donde no hay usuario autenticado (ej. redirigir al login)
        Alert.alert('Error de Autenticación', 'Debes iniciar sesión para realizar una reserva.');
        router.replace('/'); // Asume que tienes una ruta de login
      }
    };
    fetchUser();
  }, []);

  // Calcula el total de días y el precio base
  const calculateBaseTotal = () => {
    // Asegura que las fechas sean válidas
    if (!startDate || !endDate) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    // Sumamos 1 para incluir el día de inicio en el cálculo
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays * parseFloat(pricePerDay as string);
  };

  // Calcula el total con impuestos
  const calculateTotalWithTaxes = () => {
    const baseTotal = calculateBaseTotal();
    const taxes = baseTotal * 0.16; // 16% de impuestos
    return baseTotal + taxes;
  };

  // Manejador para el cambio de fecha de inicio
  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
    // Si la fecha de fin es anterior a la nueva fecha de inicio, la actualizamos
    if (endDate < currentDate) {
      // Establece la fecha de fin al día siguiente de la fecha de inicio
      setEndDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  // Manejador para el cambio de fecha de fin
  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    if (currentDate >= startDate) {
      setEndDate(currentDate);
    } else {
      Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
    }
  };

  // Función principal para manejar la renta
  const handleRent = async () => {
    // Verificar si el ID de usuario está disponible
    if (!userId) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario. Intenta de nuevo.');
      return;
    }
    // Verificar que bikeId no sea nulo o indefinido
    if (!bikeId) {
      Alert.alert('Error', 'ID de bicicleta no encontrado.');
      return;
    }

    setLoading(true); // Inicia el estado de carga
    try {
      // Calcular el precio total con impuestos
      const totalPrice = calculateTotalWithTaxes();

      // Insertar la reserva en la tabla 'bike_bookings'
      const { error } = await supabase
        .from('bike_bookings') // Nombre de la tabla correcto
        .insert([{
          user_id: userId, // ID del usuario autenticado
          bike_id: bikeId as string, // ID de la bicicleta
          start_date: startDate.toISOString().split('T')[0], // Formato 'YYYY-MM-DD'
          end_date: endDate.toISOString().split('T')[0],     // Formato 'YYYY-MM-DD'
          total_price: totalPrice, // Precio total calculado con impuestos
          status: 'pending', // Estado inicial según la tabla
          payment_status: 'pending', // Estado de pago inicial según la tabla
        }]);

      if (error) {
        console.error('Error al insertar la reserva:', error);
        throw error;
      }

      // Mostrar mensaje de éxito y redirigir
      Alert.alert(
        '¡Reserva Exitosa!',
        `Has reservado la bicicleta ${bikeType} desde ${startDate.toLocaleDateString('es-ES')} hasta ${endDate.toLocaleDateString('es-ES')}.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/bookings'), // Redirige a la página de reservas
          }
        ]
      );
    } catch (error) {
      console.error('Error al procesar la reserva:', error);
      Alert.alert('Error', 'No se pudo completar la reserva. Por favor intenta nuevamente.');
    } finally {
      setLoading(false); // Finaliza el estado de carga
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proceso de Reserva</Text>
        </View>

        {/* Resumen de la bicicleta */}
        <View style={styles.bikeSummary}>
          <Image
            source={{ uri: bikeImage as string || 'https://placehold.co/100x60/374151/FFFFFF?text=Bici' }}
            style={styles.bikeImage}
          />
          <View style={styles.bikeInfo}>
            <Text style={styles.bikeType}>{bikeType} Bicicleta</Text>
            <Text style={styles.bikePrice}>${pricePerDay} / día</Text>
          </View>
        </View>

        {/* Fechas de renta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas de Reserva</Text>
          
          <View style={styles.dateRow}>
            <Calendar size={20} color="#4ADE80" />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Desde</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {startDate.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Calendar size={20} color="#4ADE80" />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Hasta</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {endDate.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onChangeStartDate}
              minimumDate={new Date()} // No se puede seleccionar una fecha anterior a hoy
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onChangeEndDate}
              minimumDate={startDate} // La fecha de fin no puede ser anterior a la de inicio
            />
          )}
        </View>

        {/* Resumen de pago */}
        <View style={styles.paymentSummary}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentValue}>${calculateBaseTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Impuestos (16%)</Text>
            <Text style={styles.paymentValue}>${(calculateBaseTotal() * 0.16).toFixed(2)}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={[styles.paymentLabel, styles.totalLabel]}>Total a Pagar</Text>
            <Text style={[styles.paymentValue, styles.totalValue]}>${calculateTotalWithTaxes().toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón de confirmación */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleRent}
          disabled={loading || !userId} // Deshabilita si está cargando o no hay userId
        >
          {loading ? (
            <Text style={styles.confirmButtonText}>Procesando Reserva...</Text>
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Fondo oscuro
  },
  scrollContainer: {
    paddingBottom: 100, // Espacio para el footer
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto blanco
  },
  bikeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // Borde gris oscuro
  },
  bikeImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bikePrice: {
    fontSize: 16,
    color: '#4ADE80', // Verde brillante
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#9CA3AF', // Gris claro
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#1F2937', // Fondo más oscuro para inputs
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  paymentSummary: {
    padding: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#D1D5DB', // Gris muy claro
  },
  paymentValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
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
  confirmButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RentScreen;
