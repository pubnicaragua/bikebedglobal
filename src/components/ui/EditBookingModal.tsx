import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useI18n } from '../../../src/hooks/useI18n';
import { supabase } from '../../../src/services/supabase';
import { Button } from '../../../src/components/ui/Button';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react-native';

interface EditBookingModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBookingModal({ visible, booking, onClose, onSuccess }: EditBookingModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    special_requests: '',
    guests: 1,
    check_in_date: '',
    check_out_date: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setForm({
        special_requests: booking.special_requests || '',
        guests: booking.guests || 1,
        check_in_date: booking.check_in_date || '',
        check_out_date: booking.check_out_date || ''
      });
    }
  }, [booking]);

  const handleSubmit = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          special_requests: form.special_requests,
          guests: form.guests,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      Alert.alert(t('bookings.updateSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert(t('common.error'), t('bookings.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('bookings.editTitle')}</Text>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#9CA3AF" style={styles.icon} />
              <View>
                <Text style={styles.label}>{t('bookings.checkIn')}</Text>
                <Text style={styles.dateText}>{new Date(form.check_in_date).toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Calendar size={20} color="#9CA3AF" style={styles.icon} />
              <View>
                <Text style={styles.label}>{t('bookings.checkOut')}</Text>
                <Text style={styles.dateText}>{new Date(form.check_out_date).toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Users size={20} color="#9CA3AF" style={styles.icon} />
              <View style={styles.guestsContainer}>
                <Text style={styles.label}>{t('bookings.guests')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={form.guests.toString()}
                  onChangeText={(value) => setForm({...form, guests: parseInt(value) || 1})}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <CreditCard size={20} color="#9CA3AF" style={styles.icon} />
              <View>
                <Text style={styles.label}>{t('bookings.paymentStatus')}</Text>
                <Text style={styles.statusText}>{t(`bookings.paymentStatus.${booking?.payment_status}`)}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t('bookings.requests')}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={form.special_requests}
              onChangeText={(value) => setForm({...form, special_requests: value})}
              placeholder={t('bookings.requestsPlaceholder')}
              placeholderTextColor="#9CA3AF"
            />
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <Button
              title={t('common.cancel')}
              onPress={onClose}
              style={styles.secondaryButton}
              textStyle={styles.buttonText}
            />
            <Button
              title={t('common.update')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.primaryButton}
              textStyle={styles.buttonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  guestsContainer: {
    flex: 1,
  },
  numberInput: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#374151',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});