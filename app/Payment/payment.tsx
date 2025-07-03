import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { 
  CreditCard, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronDown,
  Lock,
  BadgeCheck,
  Shield,
  Clock,
  Bitcoin,
  Banknote,
  Check
} from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';

type PaymentMethod = 'card' | 'crypto' | 'bank';

export default function PaymentScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiryDate, setExpiryDate] = useState('12/25');
  const [cvv, setCvv] = useState('123');
  const [cardholderName, setCardholderName] = useState('John Doe');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              price_per_night,
              location
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        Alert.alert(t('common.error'), t('bookings.errorLoading'));
      }
    };

    if (id) fetchBookingDetails();
  }, [id]);

  const calculateTotalPrice = () => {
    if (!booking) return {
      nights: 0,
      subtotal: 0,
      taxes: 0,
      total: 0
    };
    
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    
    // Calcular la diferencia en días
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular subtotal (precio por noche * noches)
    const subtotal = booking.accommodations?.price_per_night * diffDays;
    
    // Calcular impuestos (5% del subtotal)
    const taxes = subtotal * 0.05;
    
    // Total (subtotal + impuestos)
    const total = subtotal + taxes;
    
    return {
      nights: diffDays,
      subtotal,
      taxes,
      total
    };
  };

  const priceDetails = calculateTotalPrice();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          payment_method: selectedMethod,
          total_price: priceDetails.total,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (selectedMethod === 'crypto') {
        setShowCryptoModal(true);
      } else {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          router.back();
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(t('common.error'), t('bookings.paymentError'));
    } finally {
      setLoading(false);
    }
  };

  const copyCryptoAddress = () => {
    Alert.alert(t('bookings.addressCopied'));
  };

  if (!booking) {
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('bookings.paymentTitle')}</Text>
        </View>

        {/* Booking summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookings.bookingSummary')}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={18} color="#4ADE80" />
              <Text style={styles.infoText}>
                {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Users size={18} color="#4ADE80" />
              <Text style={styles.infoText}>{booking.guests} {t('bookings.guests')}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MapPin size={18} color="#4ADE80" />
              <Text style={styles.infoText} numberOfLines={1}>
                {booking.accommodations?.location || t('bookings.unknownLocation')}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment method selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookings.paymentMethod')}</Text>
          
          <TouchableOpacity 
            style={[
              styles.paymentMethod, 
              selectedMethod === 'card' && styles.selectedMethod
            ]}
            onPress={() => setSelectedMethod('card')}
          >
            <View style={styles.methodIcon}>
              <CreditCard size={24} color="#3B82F6" />
            </View>
            <Text style={styles.methodText}>{t('bookings.creditCard')}</Text>
            {selectedMethod === 'card' && <Check size={20} color="#4ADE80" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentMethod, 
              selectedMethod === 'crypto' && styles.selectedMethod
            ]}
            onPress={() => setSelectedMethod('crypto')}
          >
            <View style={styles.methodIcon}>
              <Bitcoin size={24} color="#F59E0B" />
            </View>
            <Text style={styles.methodText}>{t('bookings.cryptocurrency')}</Text>
            {selectedMethod === 'crypto' && <Check size={20} color="#4ADE80" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentMethod, 
              selectedMethod === 'bank' && styles.selectedMethod,
              { borderBottomWidth: 0 }
            ]}
            onPress={() => setSelectedMethod('bank')}
          >
            <View style={styles.methodIcon}>
              <Banknote size={24} color="#10B981" />
            </View>
            <Text style={styles.methodText}>{t('bookings.bankTransfer')}</Text>
            {selectedMethod === 'bank' && <Check size={20} color="#4ADE80" />}
          </TouchableOpacity>
        </View>

        {/* Payment details based on selected method */}
        {selectedMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('bookings.cardDetails')}</Text>
            
            <View style={styles.cardInputContainer}>
              <Text style={styles.inputLabel}>{t('bookings.cardNumber')}</Text>
              <View style={styles.inputWithIcon}>
                <CreditCard size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.cardInputContainer, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>{t('bookings.expiryDate')}</Text>
                <View style={styles.inputWithIcon}>
                  <Calendar size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                  />
                </View>
              </View>
              
              <View style={[styles.cardInputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputWithIcon}>
                  <Lock size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="***"
                    secureTextEntry
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.cardInputContainer}>
              <Text style={styles.inputLabel}>{t('bookings.cardholderName')}</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 16 }]}
                value={cardholderName}
                onChangeText={setCardholderName}
                placeholder={t('bookings.cardholderName')}
              />
            </View>
          </View>
        )}

        {selectedMethod === 'crypto' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('bookings.cryptoPayment')}</Text>
            <Text style={styles.cryptoInfoText}>
              {t('bookings.cryptoInstructions')}
            </Text>
            <View style={styles.cryptoQRContainer}>
              <View style={styles.qrPlaceholder}>
                <Bitcoin size={48} color="#F59E0B" />
              </View>
            </View>
          </View>
        )}

        {selectedMethod === 'bank' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('bookings.bankDetails')}</Text>
            <Text style={styles.bankInfoText}>
              {t('bookings.bankName')}: Crypto Travel Bank
            </Text>
            <Text style={styles.bankInfoText}>
              {t('bookings.accountNumber')}: 1234 5678 9012 3456
            </Text>
            <Text style={styles.bankInfoText}>
              {t('bookings.swiftCode')}: CTBKENYA
            </Text>
            <Text style={styles.bankInfoText}>
              {t('bookings.reference')}: BOOK-{id}
            </Text>
            <Text style={[styles.bankInfoText, { marginTop: 12, color: '#9CA3AF' }]}>
              {t('bookings.bankInstructions')}
            </Text>
          </View>
        )}

        {/* Payment summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('bookings.paymentSummary')}</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('bookings.nights')}: {priceDetails.nights}</Text>
            <Text style={styles.summaryValue}>${booking.accommodations?.price_per_night.toFixed(2)}/noche</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('bookings.subtotal')}</Text>
            <Text style={styles.summaryValue}>${priceDetails.subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('bookings.taxes')} (5%)</Text>
            <Text style={styles.summaryValue}>${priceDetails.taxes.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('bookings.serviceFee')}</Text>
            <Text style={styles.summaryValue}>$0.00</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('bookings.total')}</Text>
            <Text style={styles.totalValue}>${priceDetails.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Security guarantees */}
        <View style={styles.securityRow}>
          <BadgeCheck size={20} color="#4ADE80" />
          <Text style={styles.securityText}>{t('bookings.secureTransaction')}</Text>
        </View>

        {/* Payment button */}
        <Button 
          title={
            selectedMethod === 'crypto' ? t('bookings.generateAddress') : 
            selectedMethod === 'bank' ? t('bookings.confirmTransfer') :
            `${t('common.pay')} $${priceDetails.total.toFixed(2)}`
          }
          onPress={handlePayment}
          loading={loading}
          style={styles.payButton}
          icon={<Lock size={20} color="#FFFFFF" />}
        />
      </ScrollView>

      {/* Crypto Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCryptoModal}
        onRequestClose={() => setShowCryptoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Bitcoin size={48} color="#F59E0B" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>{t('bookings.cryptoPayment')}</Text>
            <Text style={styles.modalText}>{t('bookings.sendCryptoTo')}</Text>
            
            <TouchableOpacity 
              style={styles.cryptoAddressBox}
              onPress={copyCryptoAddress}
            >
              <Text style={styles.cryptoAddressText}>0x71C7656EC7ab88b098defB751B7401B5f6d8976F</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalSubtext}>
              {t('bookings.amountToSend')}: ${priceDetails.total.toFixed(2)} USD
            </Text>
            
            <Button
              title={t('bookings.iHaveSent')}
              onPress={() => {
                setShowCryptoModal(false);
                setShowSuccessModal(true);
                setTimeout(() => {
                  setShowSuccessModal(false);
                  router.back();
                }, 2000);
              }}
              style={styles.modalButton}
            />
            
            <Button
              title={t('common.cancel')}
              onPress={() => setShowCryptoModal(false)}
              style={styles.modalSecondaryButton}
              textStyle={styles.modalSecondaryButtonText}
            />
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Check size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.successModalTitle}>{t('bookings.paymentSuccess')}</Text>
            <Text style={styles.successModalText}>
              {t('bookings.bookingConfirmed')}
            </Text>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 15,
    flex: 1,
  },
  cardInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
    paddingLeft: 12,
  },
  row: {
    flexDirection: 'row',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  selectedMethod: {
    backgroundColor: '#1E3A8A20',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  methodText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  summaryValue: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  securityText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  payButton: {
    marginTop: 8,
    backgroundColor: '#10B981',
  },
  cryptoInfoText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  bankInfoText: {
    color: '#D1D5DB',
    fontSize: 15,
    marginBottom: 8,
  },
  cryptoQRContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  cryptoAddressBox: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 8,
  },
  cryptoAddressText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#10B981',
    marginTop: 8,
  },
  modalSecondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 12,
  },
  modalSecondaryButtonText: {
    color: '#D1D5DB',
  },
  // Success modal
  successModalContent: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successModalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successModalText: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});