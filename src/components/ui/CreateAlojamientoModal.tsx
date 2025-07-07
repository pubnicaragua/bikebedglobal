import React, { useState, useEffect } from 'react';
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
import { X, Plus, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface CreateAlojamientoModalProps {
  visible: boolean;
  onClose: () => void;
  onAccommodationCreated: () => void;
  isAdmin?: boolean;
}

interface AccommodationAmenity {
  id: string;
  amenity_name: string;
  amenity_type: string | null;
}

const CreateAlojamientoModal: React.FC<CreateAlojamientoModalProps> = ({
  visible,
  onClose,
  onAccommodationCreated,
  isAdmin = false,
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
  const [newOptionalAmenity, setNewOptionalAmenity] = useState('');
  const [optionalAmenities, setOptionalAmenities] = useState<AccommodationAmenity[]>([]);
  const [predefinedAmenities, setPredefinedAmenities] = useState<AccommodationAmenity[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadPredefinedAmenities();
    }
  }, [isAdmin]);

  const loadPredefinedAmenities = async () => {
    const { data, error } = await supabase
      .from('predefined_amenities')
      .select('*');
    
    if (!error && data) {
      setPredefinedAmenities(data.map(item => ({
        id: `predefined-${item.id}`,
        amenity_name: item.name,
        amenity_type: item.type
      })));
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOptionalAmenity = () => {
    if (newOptionalAmenity.trim() !== '') {
      setOptionalAmenities(prev => [
        ...prev,
        { 
          id: `new-${Date.now()}`, 
          amenity_name: newOptionalAmenity.trim(), 
          amenity_type: 'optional' 
        },
      ]);
      setNewOptionalAmenity('');
    }
  };

  const handleAddPredefinedAmenity = (amenity: AccommodationAmenity) => {
    if (!optionalAmenities.some(a => a.amenity_name === amenity.amenity_name)) {
      setOptionalAmenities(prev => [...prev, amenity]);
    }
  };

  const handleRemoveOptionalAmenity = (id: string) => {
    setOptionalAmenities(prev => prev.filter(amenity => amenity.id !== id));
  };

  const pickImage = async () => {
    setIsUploading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para seleccionar imágenes');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return null;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || 'Usuario no autenticado');
      }

      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase
        .storage
        .from('accommodation-images')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('accommodation-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: unknown) {
      console.error('Error al subir imagen:', error);
      let errorMessage = 'Error al subir la imagen';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || 
        !formData.location.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }

    if (isNaN(Number(formData.pricePerNight))) {
      Alert.alert('Error', 'El precio por noche debe ser un número válido');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || 'Usuario no autenticado');
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          Alert.alert('Advertencia', 'El alojamiento se creará sin imagen principal debido a un error en la carga');
        }
      }

      const { data: accommodationData, error: accommodationError } = await supabase
        .from('accommodations')
        .insert({
          host_id: user.id,
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
          is_active: true
        })
        .select()
        .single();

      if (accommodationError) throw accommodationError;
      if (!accommodationData) throw new Error('No se recibieron datos del alojamiento después de la creación');

      if (imageUrl) {
        const { error: imageError } = await supabase
          .from('accommodation_images')
          .insert({
            accommodation_id: accommodationData.id,
            image_url: imageUrl,
            is_primary: true
          });
        if (imageError) console.error('Error al insertar imagen:', imageError);
      }

      if (optionalAmenities.length > 0) {
        const amenitiesToInsert = optionalAmenities.map(amenity => ({
          accommodation_id: accommodationData.id,
          amenity_name: amenity.amenity_name,
          amenity_type: amenity.amenity_type,
        }));

        const { error: amenitiesError } = await supabase
          .from('accommodation_amenities')
          .insert(amenitiesToInsert);

        if (amenitiesError) console.error('Error al insertar amenidades opcionales:', amenitiesError);
      }

      Alert.alert('Éxito', 'Alojamiento creado correctamente');
      onAccommodationCreated();
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error('Error al crear alojamiento:', error);
      let errorMessage = 'Error al crear el alojamiento';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setImage(null);
    setNewOptionalAmenity('');
    setOptionalAmenities([]);
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
              <Text style={styles.title}>Crear Nuevo Alojamiento</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            {/* Sección de Imagen */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Imagen del Alojamiento</Text>
              <TouchableOpacity 
                style={styles.imageUploadButton} 
                onPress={pickImage}
                disabled={isUploading || isLoading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#161622" />
                ) : (
                  <Text style={styles.imageUploadButtonText}>
                    {image ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                  </Text>
                )}
              </TouchableOpacity>
              
              {image && (
                <View style={styles.imagePreviewWrapper}>
                  <Image 
                    source={{ uri: image }} 
                    style={styles.imagePreview} 
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => setImage(null)}
                    disabled={isUploading || isLoading}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sección de Información Básica */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Nombre del alojamiento"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                placeholder="Describa su alojamiento..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
              <Text style={styles.label}>Ubicación *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => handleChange('location', text)}
                placeholder="Ciudad, País"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.label}>Dirección *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                placeholder="Dirección exacta"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Sección de Detalles */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Detalles</Text>
              
              <Text style={styles.label}>Precio por noche (USD)</Text>
              <TextInput
                style={styles.input}
                value={formData.pricePerNight}
                onChangeText={(text) => handleChange('pricePerNight', text)}
                placeholder="100"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Huéspedes máximos</Text>
              <TextInput
                style={styles.input}
                value={formData.capacity}
                onChangeText={(text) => handleChange('capacity', text)}
                placeholder="4"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Habitaciones</Text>
              <TextInput
                style={styles.input}
                value={formData.bedrooms}
                onChangeText={(text) => handleChange('bedrooms', text)}
                placeholder="2"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.label}>Baños</Text>
              <TextInput
                style={styles.input}
                value={formData.bathrooms}
                onChangeText={(text) => handleChange('bathrooms', text)}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Sección de Amenidades Básicas */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Amenidades Básicas</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Almacenamiento para bicicletas</Text>
                <Switch
                  value={formData.hasBikeStorage}
                  onValueChange={(value) => handleChange('hasBikeStorage', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasBikeStorage ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Renta de bicicletas</Text>
                <Switch
                  value={formData.hasBikeRental}
                  onValueChange={(value) => handleChange('hasBikeRental', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasBikeRental ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Herramientas para bicicletas</Text>
                <Switch
                  value={formData.hasBikeTools}
                  onValueChange={(value) => handleChange('hasBikeTools', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasBikeTools ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Lavandería</Text>
                <Switch
                  value={formData.hasLaundry}
                  onValueChange={(value) => handleChange('hasLaundry', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasLaundry ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>WiFi</Text>
                <Switch
                  value={formData.hasWifi}
                  onValueChange={(value) => handleChange('hasWifi', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasWifi ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Cocina</Text>
                <Switch
                  value={formData.hasKitchen}
                  onValueChange={(value) => handleChange('hasKitchen', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasKitchen ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Estacionamiento</Text>
                <Switch
                  value={formData.hasParking}
                  onValueChange={(value) => handleChange('hasParking', value)}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={formData.hasParking ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
            </View>

            {/* Sección de Amenidades Opcionales */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Amenidades Opcionales</Text>
              
              <View style={styles.addAmenityContainer}>
                <TextInput
                  style={[styles.input, {flex: 1}]}
                  value={newOptionalAmenity}
                  onChangeText={setNewOptionalAmenity}
                  placeholder="Ej: Piscina, Jacuzzi, etc."
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddOptionalAmenity}
                  disabled={isLoading}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {isAdmin && predefinedAmenities.length > 0 && (
                <View style={{marginBottom: 10}}>
                  <Text style={styles.label}>Amenidades predefinidas:</Text>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                    {predefinedAmenities.map(amenity => (
                      <TouchableOpacity
                        key={amenity.id}
                        style={styles.predefinedAmenityButton}
                        onPress={() => handleAddPredefinedAmenity(amenity)}
                        disabled={optionalAmenities.some(a => a.amenity_name === amenity.amenity_name)}
                      >
                        <Text style={styles.predefinedAmenityText}>{amenity.amenity_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {optionalAmenities.length > 0 && (
                <View style={styles.amenitiesList}>
                  {optionalAmenities.map(amenity => (
                    <View key={amenity.id} style={styles.amenityItem}>
                      <Text style={styles.amenityText}>{amenity.amenity_name}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveOptionalAmenity(amenity.id)}
                        disabled={isLoading}
                      >
                        <Trash2 size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Botones de Acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading || isUploading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, (isLoading || isUploading) && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading || isUploading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#161622" />
                ) : (
                  <Text style={styles.createButtonText}>Crear Alojamiento</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Styles (Start of the StyleSheet.create block)
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B', // Darker background for the modal content
    borderRadius: 15,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden', // Ensures content stays within rounded corners
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // Subtle separator
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: { // Added style for the close button
    padding: 5,
  },
  formSection: { // General style for each section (Image, Basic, Details, Amenities)
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2D3748', // Slightly lighter than modal content for sections
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B', // Accent color for section titles
    paddingBottom: 8,
  },
  label: {
    color: '#D1D5DB', // Light gray for labels
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10, // Added margin to space out labels from previous elements
  },
  input: {
    backgroundColor: '#374151', // Darker input background
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 100, // Use minHeight for multiline inputs
    textAlignVertical: 'top', // Align text to top for multiline
  },
  switchContainer: { // General style for switch rows
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: '#374151', // Background for each switch row
    borderRadius: 8,
  },
  switchLabel: { // Label next to the switch
    color: '#FFFFFF',
    fontSize: 16,
  },
  imageUploadButton: {
    backgroundColor: '#F59E0B', // Orange accent color
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row', // For text and activity indicator
    justifyContent: 'center',
    gap: 10, // Space between text and indicator
    marginBottom: 15,
  },
  imageUploadButtonText: {
    color: '#161622', // Dark text on orange button
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewWrapper: { // Wrapper for the image and its close button
    marginTop: 10,
    position: 'relative',
    alignSelf: 'center',
    width: '100%',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: '#374151', // Placeholder background
  },
  removeImageButton: { // Small X button on the image
    position: 'absolute',
    top: -5, // Adjust position
    right: -5, // Adjust position
    backgroundColor: '#EF4444', // Red for delete
    borderRadius: 15, // Make it circular
    padding: 3,
    zIndex: 1, // Ensure it's above the image
  },
  addAmenityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addAmenityButton: {
    backgroundColor: '#4ADE80',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  amenitiesList: {
    marginTop: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  amenityText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    gap: 12, // Space between buttons
    marginTop: 20,
    paddingHorizontal: 16,
  },
  cancelButton: {
    borderColor: '#9CA3AF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1, // Make buttons take equal space
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#4ADE80', // Green accent for primary action
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1, // Make buttons take equal space
  },
  createButtonText: {
    color: '#161622', // Dark text on green button
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6, // Visual feedback when button is disabled
  },
    addButton: {
    backgroundColor: '#4ADE80',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  predefinedAmenityButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 5,
  },

  predefinedAmenityText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

});

export default CreateAlojamientoModal;