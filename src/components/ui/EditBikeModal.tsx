import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Bike } from '../../../app/(host)/bike';
import { X, ToggleLeft, ToggleRight } from 'lucide-react-native';

interface BikeFormData {
  bike_type: string;
  price_per_day: number;
  is_available: boolean;
  bike_size: string;
  description: string;
}

const EditBikeModal: React.FC<{
  visible: boolean;
  bike: Bike | null;
  onClose: () => void;
  onSave: (updatedBike: Bike) => void;
}> = ({ visible, bike, onClose, onSave }) => {
  const [formData, setFormData] = useState<BikeFormData>({
    bike_type: '',
    price_per_day: 0,
    is_available: true,
    bike_size: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bike) {
      setFormData({
        bike_type: bike.bike_type ?? '',
        price_per_day: bike.price_per_day ?? 0,
        is_available: bike.is_available ?? true,
        bike_size: bike.bike_size ?? '',
        description: bike.description ?? '',
      });
    }
  }, [bike]);

  const handleInputChange = (field: keyof BikeFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!bike) return;
    
    try {
      setLoading(true);
      const updatedBike = {
        ...bike,
        ...formData,
        // Asegurar que los campos opcionales mantengan su tipo correcto
        bike_size: formData.bike_size || null,
        description: formData.description || null
      };
      onSave(updatedBike);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la bicicleta');
    } finally {
      setLoading(false);
    }
  };

  if (!bike) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Bicicleta</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de bicicleta</Text>
              <TextInput
                style={styles.input}
                value={formData.bike_type}
                onChangeText={(text) => handleInputChange('bike_type', text)}
                placeholder="Ej: Montaña, Ruta, Urbana"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Precio por día ($)</Text>
              <TextInput
                style={styles.input}
                value={formData.price_per_day.toString()}
                onChangeText={(text) => handleInputChange('price_per_day', Number(text) || 0)}
                keyboardType="numeric"
                placeholder="Ej: 25"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Talla</Text>
              <TextInput
                style={styles.input}
                value={formData.bike_size}
                onChangeText={(text) => handleInputChange('bike_size', text)}
                placeholder="Ej: M, L, XL"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Describe la bicicleta"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.availabilityContainer}>
              <Text style={styles.label}>Disponibilidad</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => handleInputChange('is_available', !formData.is_available)}
              >
                {formData.is_available ? (
                  <ToggleRight size={28} color="#10B981" />
                ) : (
                  <ToggleLeft size={28} color="#EF4444" />
                )}
                <Text style={styles.toggleText}>
                  {formData.is_available ? 'Disponible' : 'No disponible'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#e2e2e2',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  availabilityContainer: {
    marginVertical: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  toggleText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditBikeModal;