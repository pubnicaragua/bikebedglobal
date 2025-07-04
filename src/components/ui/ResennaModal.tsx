import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  accommodationId: string;
  user: any;
  onSuccess: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  accommodationId,
  user,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Selecciona una calificación.');
      return;
    }

    try {
      setLoading(true);

      // Busca booking completado
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('accommodation_id', accommodationId)
        .eq('status', 'completed')
        .single();

      if (bookingError || !booking) {
        throw new Error('No tienes reservas completadas.');
      }

      const { error } = await supabase
        .from('accommodation_reviews')
        .insert({
          booking_id: booking.id,
          user_id: user.id,
          accommodation_id: accommodationId,
          rating,
          comment: comment || null,
        });

      if (error) throw error;

      onSuccess();
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar la reseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Tu reseña</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star
                  size={32}
                  color={star <= rating ? "#4ADE80" : "#9CA3AF"}
                  fill={star <= rating ? "#4ADE80" : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Escribe tu reseña (opcional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Publicar reseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
