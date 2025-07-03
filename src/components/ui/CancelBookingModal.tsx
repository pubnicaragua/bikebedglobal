import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert } from 'react-native';
import { useI18n } from '../../../src/hooks/useI18n';
import { supabase } from '../../../src/services/supabase';
import { Button } from '../../../src/components/ui/Button';
import { AlertTriangle } from 'lucide-react-native';

interface CancelBookingModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelBookingModal({ visible, booking, onClose, onSuccess }: CancelBookingModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      Alert.alert(t('bookings.cancelSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error canceling booking:', error);
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
          <AlertTriangle size={48} color="#EF4444" style={styles.warningIcon} />
          <Text style={styles.modalTitle}>{t('bookings.cancelTitle')}</Text>
          <Text style={styles.modalText}>{t('bookings.cancelMessage')}</Text>
          
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingName}>{booking?.accommodation?.name}</Text>
            <Text style={styles.bookingDates}>
              {new Date(booking?.check_in_date).toLocaleDateString()} - {new Date(booking?.check_out_date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <Button
              title={t('common.no')}
              onPress={onClose}
              style={styles.secondaryButton}
              textStyle={styles.buttonText}
            />
            <Button
              title={t('common.yes')}
              onPress={handleCancel}
              loading={loading}
              style={styles.dangerButton}
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
    alignItems: 'center',
  },
  warningIcon: {
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
  bookingInfo: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 24,
  },
  bookingName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  bookingDates: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#374151',
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});