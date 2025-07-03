import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

// Valores EXACTOS según la restricción bike_type_check en Supabase
const ALLOWED_BIKE_TYPES = ['road', 'mountain', 'hybrid', 'city', 'electric', 'folding', 'bmx', 'other'];

// Valores para mostrar en la interfaz (pueden tener mayúsculas)
const DISPLAY_BIKE_TYPES = ['Road', 'Mountain', 'Hybrid', 'City', 'Electric', 'Folding', 'BMX', 'Other'];

const ALLOWED_BIKE_SIZES = ['xs', 's', 'm', 'l', 'xl'];

interface CreateBikeModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

const CreateBikeModal: React.FC<CreateBikeModalProps> = ({
  visible,
  onClose,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState({
    bike_type: '',
    price_per_day: '',
    is_available: true,
    bike_size: '',
    description: '',
    accommodation_id: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Convertir a minúsculas para validación
    const normalizedBikeType = formData.bike_type.toLowerCase();
    
    // Validaciones
    if (!formData.bike_type.trim()) {
      Alert.alert('Error', 'Por favor seleccione el tipo de bicicleta');
      return;
    }

    if (!ALLOWED_BIKE_TYPES.includes(normalizedBikeType)) {
      Alert.alert('Error', `Tipo de bicicleta no válido. Opciones permitidas: ${DISPLAY_BIKE_TYPES.join(', ')}`);
      return;
    }

    if (isNaN(Number(formData.price_per_day))) {
      Alert.alert('Error', 'El precio por día debe ser un número válido');
      return;
    }

    if (Number(formData.price_per_day) <= 0) {
      Alert.alert('Error', 'El precio por día debe ser mayor a 0');
      return;
    }

    // Validar talla si se proporciona
    const normalizedBikeSize = formData.bike_size.toLowerCase();
    if (formData.bike_size && !ALLOWED_BIKE_SIZES.includes(normalizedBikeSize)) {
      Alert.alert('Error', `Talla no válida. Opciones: ${ALLOWED_BIKE_SIZES.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(userError?.message || 'Usuario no autenticado');
      }

      // Preparar datos con valores normalizados
      const bikeData = {
        bike_type: normalizedBikeType, // Usar el valor normalizado
        price_per_day: Number(formData.price_per_day),
        is_available: formData.is_available,
        bike_size: formData.bike_size ? normalizedBikeSize : null,
        description: formData.description.trim() || null,
        accommodation_id: formData.accommodation_id,
        host_id: user.id,
      };

      const { data, error } = await supabase
        .from('bike_rentals')
        .insert(bikeData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert('Éxito', 'Bicicleta registrada correctamente');
      onSaveSuccess?.();
      onClose();
      resetForm();
      
    } catch (error: unknown) {
      console.error('Error al registrar la bicicleta:', error);
      let errorMessage = 'No se pudo registrar la bicicleta';
      
      if (error instanceof Error) {
        if ('code' in error && error.code === '23514') {
          if (error.message.includes('bike_type_check')) {
            errorMessage = `Tipo de bicicleta no válido. Opciones permitidas: ${DISPLAY_BIKE_TYPES.join(', ')}`;
          } else if (error.message.includes('bike_size_check')) {
            errorMessage = `Talla no válida. Opciones permitidas: ${ALLOWED_BIKE_SIZES.join(', ')}`;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bike_type: '',
      price_per_day: '',
      is_available: true,
      bike_size: '',
      description: '',
      accommodation_id: null,
    });
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
          <ScrollView style={styles.scrollViewContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Registrar Nueva Bicicleta</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información básica</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de bicicleta*</Text>
                <View style={styles.optionsContainer}>
                  {DISPLAY_BIKE_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionButton,
                        formData.bike_type.toLowerCase() === type.toLowerCase() && styles.optionButtonSelected
                      ]}
                      onPress={() => handleChange('bike_type', type)}
                    >
                      <Text style={styles.optionText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.hint}>Seleccione un tipo de bicicleta</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio por día*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price_per_day}
                  onChangeText={(text) => handleChange('price_per_day', text)}
                  placeholder="Ej: 15.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Talla (opcional)</Text>
                <View style={styles.optionsContainer}>
                  {ALLOWED_BIKE_SIZES.map(size => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.optionButton,
                        formData.bike_size === size && styles.optionButtonSelected
                      ]}
                      onPress={() => handleChange('bike_size', size)}
                    >
                      <Text style={styles.optionText}>{size.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.hint}>Seleccione una talla (opcional)</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>ID de alojamiento asociado (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.accommodation_id || ''}
                  onChangeText={(text) => handleChange('accommodation_id', text || null)}
                  placeholder="ID del alojamiento"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.is_available}
                  onValueChange={(value) => handleChange('is_available', value)}
                />
                <Text style={styles.toggleLabel}>Disponible para alquiler</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción adicional</Text>
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Detalles adicionales sobre la bicicleta..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, isLoading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.createButtonText}>Registrar Bicicleta</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    marginHorizontal: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    borderColor: '#9CA3AF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  scrollViewContent: {
    padding: 20,
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  optionButtonSelected: {
    backgroundColor: '#4ADE80',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default CreateBikeModal;