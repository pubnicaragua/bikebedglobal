import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, CreditCard, User } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

const RentScreen = () => {
  const { bikeId, bikeType, pricePerDay, bikeImage } = useLocalSearchParams();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateTotal = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays * parseFloat(pricePerDay as string);
  };

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
    // Si la fecha de fin es anterior a la nueva fecha de inicio, la actualizamos
    if (endDate < currentDate) {
      setEndDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)); // +1 día
    }
  };

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    if (currentDate >= startDate) {
      setEndDate(currentDate);
    } else {
      Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
    }
  };

  const handleRent = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      Alert.alert('Error', 'Por favor completa todos los datos de pago');
      return;
    }

    setLoading(true);
    try {
      // Simulamos un proceso de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aquí iría la lógica real para guardar la renta en Supabase
      const { error } = await supabase
        .from('rentals')
        .insert([{
          bike_id: bikeId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_amount: calculateTotal(),
          payment_status: 'completed',
        }]);

      if (error) throw error;

      Alert.alert(
        '¡Renta exitosa!',
        `Has rentado la bicicleta ${bikeType} desde ${startDate.toLocaleDateString()} hasta ${endDate.toLocaleDateString()}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          }
        ]
      );
    } catch (error) {
      console.error('Error al procesar la renta:', error);
      Alert.alert('Error', 'No se pudo completar la renta. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proceso de Renta</Text>
        </View>

        {/* Resumen de la bicicleta */}
        <View style={styles.bikeSummary}>
          <Image
            source={{ uri: bikeImage as string || 'https://via.placeholder.com/100?text=Bike' }}
            style={styles.bikeImage}
          />
          <View style={styles.bikeInfo}>
            <Text style={styles.bikeType}>{bikeType} Bike</Text>
            <Text style={styles.bikePrice}>${pricePerDay} / día</Text>
          </View>
        </View>

        {/* Fechas de renta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas de Renta</Text>
          
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
              minimumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onChangeEndDate}
              minimumDate={startDate}
            />
          )}
        </View>

        {/* Información de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Pago</Text>
          
          <View style={styles.inputContainer}>
            <CreditCard size={20} color="#4ADE80" />
            <TextInput
              style={styles.input}
              placeholder="Número de tarjeta"
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#4ADE80" />
            <TextInput
              style={styles.input}
              placeholder="Nombre en la tarjeta"
              value={cardName}
              onChangeText={setCardName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="CVV"
                keyboardType="numeric"
                value={cardCvv}
                onChangeText={setCardCvv}
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Resumen de pago */}
        <View style={styles.paymentSummary}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentValue}>${calculateTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Impuestos</Text>
            <Text style={styles.paymentValue}>${(calculateTotal() * 0.16).toFixed(2)}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={[styles.paymentLabel, styles.totalLabel]}>Total</Text>
            <Text style={[styles.paymentValue, styles.totalValue]}>
              ${(calculateTotal() * 1.16).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón de confirmación */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleRent}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.confirmButtonText}>Procesando...</Text>
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Renta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    paddingBottom: 100,
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
    color: '#FFFFFF',
  },
  bikeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
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
    color: '#4ADE80',
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
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
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
    color: '#D1D5DB',
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