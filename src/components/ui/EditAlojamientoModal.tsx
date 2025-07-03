import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface Alojamiento {
  id: string;
  host_id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  price_per_night: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  has_bike_storage: boolean;
  has_bike_rental: boolean;
  has_bike_tools: boolean;
  has_laundry: boolean;
  has_wifi: boolean;
  has_kitchen: boolean;
  has_parking: boolean;
  image_url?: string;
}

interface EditAlojamientoModalProps {
  visible: boolean;
  onClose: () => void;
  alojamiento: Alojamiento | null;
  onSaveSuccess?: () => void;
}

const EditAlojamientoModal: React.FC<EditAlojamientoModalProps> = ({
  visible,
  onClose,
  alojamiento,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    pricePerNight: '0',
    capacity: '1',
    bedrooms: '1',
    bathrooms: '1',
    hasBikeStorage: false,
    hasBikeRental: false,
    hasBikeTools: false,
    hasLaundry: false,
    hasWifi: false,
    hasKitchen: false,
    hasParking: false,
  });

  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (alojamiento) {
      setFormData({
        name: alojamiento.name || '',
        description: alojamiento.description || '',
        location: alojamiento.location || '',
        address: alojamiento.address || '',
        pricePerNight: alojamiento.price_per_night?.toString() || '0',
        capacity: alojamiento.capacity?.toString() || '1',
        bedrooms: alojamiento.bedrooms?.toString() || '1',
        bathrooms: alojamiento.bathrooms?.toString() || '1',
        hasBikeStorage: alojamiento.has_bike_storage || false,
        hasBikeRental: alojamiento.has_bike_rental || false,
        hasBikeTools: alojamiento.has_bike_tools || false,
        hasLaundry: alojamiento.has_laundry || false,
        hasWifi: alojamiento.has_wifi || false,
        hasKitchen: alojamiento.has_kitchen || false,
        hasParking: alojamiento.has_parking || false,
      });
      setImage(alojamiento.image_url || null);
    }
  }, [alojamiento]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    setIsUploading(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async () => {
    if (!image || !alojamiento?.id) return null;
    
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      
      const fileExt = image.split('.').pop();
      const fileName = `${alojamiento.id}-${Date.now()}.${fileExt}`;
      const filePath = `accommodations/${fileName}`;

      const { data, error } = await supabase
        .storage
        .from('accommodation-images')
        .upload(filePath, blob);

      if (error) throw error;

      return data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
      return null;
    }
  };

  const handleSave = async () => {
    if (!alojamiento?.id) {
      Alert.alert('Error', 'No se ha seleccionado un alojamiento para editar');
      return;
    }

    // Validación de campos requeridos
    if (!formData.name.trim() || !formData.description.trim() || 
        !formData.location.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    // Validación de campos numéricos
    if (isNaN(Number(formData.pricePerNight))){
      Alert.alert('Error', 'El precio por noche debe ser un número válido');
      return;
    }

    setIsLoading(true);

    try {
      let imagePath = null;
      if (image && !image.startsWith('https://')) {
        imagePath = await uploadImage();
      } else if (image) {
        imagePath = image.split('/').pop();
      }

      const { error } = await supabase
        .from('accommodations')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          address: formData.address.trim(),
          price_per_night: Number(formData.pricePerNight) || 0,
          capacity: Number(formData.capacity) || 1,
          bedrooms: Number(formData.bedrooms) || 1,
          bathrooms: Number(formData.bathrooms) || 1,
          has_bike_storage: formData.hasBikeStorage,
          has_bike_rental: formData.hasBikeRental,
          has_bike_tools: formData.hasBikeTools,
          has_laundry: formData.hasLaundry,
          has_wifi: formData.hasWifi,
          has_kitchen: formData.hasKitchen,
          has_parking: formData.hasParking,
          image_url: imagePath ? `${supabase.storage}/object/public/accommodation-images/${imagePath}` : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alojamiento.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Alojamiento actualizado correctamente');
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al actualizar el alojamiento:', error);
      Alert.alert('Error', 'No se pudo actualizar el alojamiento');
    } finally {
      setIsLoading(false);
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
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Alojamiento</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información básica</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Imagen del alojamiento</Text>
                <TouchableOpacity 
                  style={styles.imageUploadButton} 
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.imageUploadButtonText}>
                      {image ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </Text>
                  )}
                </TouchableOpacity>
                
                {image && (
                  <>
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: image }} 
                        style={styles.imagePreview} 
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => setImage(null)}
                      disabled={isUploading}
                    >
                      <Text style={styles.removeImageButtonText}>Eliminar imagen</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del alojamiento*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Nombre"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción*</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Descripción"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ubicación*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                  placeholder="Ubicación"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Dirección*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => handleChange('address', text)}
                  placeholder="Dirección"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio por noche</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pricePerNight}
                  onChangeText={(text) => handleChange('pricePerNight', text)}
                  placeholder="Precio"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacidad</Text>
                <TextInput
                  style={styles.input}
                  value={formData.capacity}
                  onChangeText={(text) => handleChange('capacity', text)}
                  placeholder="Capacidad"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Habitaciones</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) => handleChange('bedrooms', text)}
                  placeholder="Habitaciones"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Baños</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) => handleChange('bathrooms', text)}
                  placeholder="Baños"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              
              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeStorage}
                  onValueChange={(value) => handleChange('hasBikeStorage', value)}
                  thumbColor={formData.hasBikeStorage ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Almacenamiento de bicicletas</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeRental}
                  onValueChange={(value) => handleChange('hasBikeRental', value)}
                  thumbColor={formData.hasBikeRental ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Alquiler de bicicletas</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeTools}
                  onValueChange={(value) => handleChange('hasBikeTools', value)}
                  thumbColor={formData.hasBikeTools ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Herramientas para bicicletas</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasLaundry}
                  onValueChange={(value) => handleChange('hasLaundry', value)}
                  thumbColor={formData.hasLaundry ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Lavandería</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasWifi}
                  onValueChange={(value) => handleChange('hasWifi', value)}
                  thumbColor={formData.hasWifi ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>WiFi</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasKitchen}
                  onValueChange={(value) => handleChange('hasKitchen', value)}
                  thumbColor={formData.hasKitchen ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Cocina</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasParking}
                  onValueChange={(value) => handleChange('hasParking', value)}
                  thumbColor={formData.hasParking ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Estacionamiento</Text>
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
                style={[styles.createButton, (isLoading || isUploading) && styles.disabledButton]}
                onPress={handleSave}
                disabled={isLoading || isUploading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.createButtonText}>Guardar</Text>
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
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
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
    flexDirection: 'row',
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
  disabledButton: {
    opacity: 0.6,
  },
  imageUploadButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageUploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default EditAlojamientoModal;