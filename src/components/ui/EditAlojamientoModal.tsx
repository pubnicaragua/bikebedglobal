import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Image,
  ActivityIndicator
} from 'react-native';
import { X, Plus, Trash2, Camera } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
// No se necesita decode de base64 si se usa `fetch` con `blob`

// Re-defining interfaces as they are used in this file
interface AccommodationImage {
  id: string;
  image_url: string;
  is_primary: boolean; // This property is required and comes from the DB
}

interface Booking {
  id: string;
  status: string;
}

interface AccommodationAmenity {
  id: string;
  amenity_name: string;
  amenity_type: string | null;
}

// Extend SelectedImage for edit modal to include DB ID if it's an existing image
// Removed 'isPrimary' here to avoid conflict and rely solely on 'is_primary' from AccommodationImage
interface SelectedImageForEdit extends AccommodationImage {
  uri: string; // This will be the local URI after selection, or image_url for existing
  name?: string; // Optional for new uploads
  type?: string; // Optional for new uploads
  isNew?: boolean; // Flag to identify newly added images
  isDeleted?: boolean; // Flag to mark images for deletion (soft delete approach)
}

interface Accommodation {
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  accommodation_images: AccommodationImage[];
  bookings: Booking[];
  accommodation_amenities: AccommodationAmenity[];
}

interface EditAlojamientoModalProps {
  visible: boolean;
  onClose: () => void;
  alojamiento: Accommodation | null;
  onSaveSuccess: () => void;
}

export default function EditAlojamientoModal({
  visible,
  onClose,
  alojamiento,
  onSaveSuccess,
}: EditAlojamientoModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [capacity, setCapacity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [hasBikeStorage, setHasBikeStorage] = useState(false);
  const [hasBikeRental, setHasBikeRental] = useState(false);
  const [hasBikeTools, setHasBikeTools] = useState(false);
  const [hasLaundry, setHasLaundry] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [hasKitchen, setHasKitchen] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [optionalAmenities, setOptionalAmenities] = useState<AccommodationAmenity[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImageForEdit[]>([]); // For existing and new images
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alojamiento) {
      setName(alojamiento.name);
      setDescription(alojamiento.description);
      setLocation(alojamiento.location);
      setAddress(alojamiento.address);
      setPricePerNight(alojamiento.price_per_night.toString());
      setCapacity(alojamiento.capacity.toString());
      setBedrooms(alojamiento.bedrooms.toString());
      setBathrooms(alojamiento.bathrooms.toString());
      setHasBikeStorage(alojamiento.has_bike_storage);
      setHasBikeRental(alojamiento.has_bike_rental);
      setHasBikeTools(alojamiento.has_bike_tools);
      setHasLaundry(alojamiento.has_laundry);
      setHasWifi(alojamiento.has_wifi);
      setHasKitchen(alojamiento.has_kitchen);
      setHasParking(alojamiento.has_parking);
      setOptionalAmenities(alojamiento.accommodation_amenities || []);
      
      // Initialize selectedImages with existing images from the accommodation
      const existingImages: SelectedImageForEdit[] = alojamiento.accommodation_images.map(img => ({
        ...img,
        uri: img.image_url, // Use image_url as URI for existing images
        isNew: false, // Mark as not new
        isDeleted: false, // Mark as not deleted
      }));
      setSelectedImages(existingImages);
    } else {
      resetForm();
    }
  }, [alojamiento]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocation('');
    setAddress('');
    setPricePerNight('');
    setCapacity('');
    setBedrooms('');
    setBathrooms('');
    setHasBikeStorage(false);
    setHasBikeRental(false);
    setHasBikeTools(false);
    setHasLaundry(false);
    setHasWifi(false);
    setHasKitchen(false);
    setHasParking(false);
    setNewAmenity('');
    setOptionalAmenities([]);
    setSelectedImages([]);
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() !== '') {
      setOptionalAmenities(prev => [
        ...prev,
        { id: `new-${Date.now()}`, amenity_name: newAmenity.trim(), amenity_type: null },
      ]);
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (id: string) => {
    setOptionalAmenities(optionalAmenities.filter(amenity => amenity.id !== id));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant media library permissions to upload images.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: false, // No necesitamos base64 si subiremos el blob directamente
    });

    if (!result.canceled && result.assets) {
      const newImages: SelectedImageForEdit[] = result.assets.map(asset => ({
        id: `new-${Date.now() + Math.random()}`, // Unique temporary ID for new images
        uri: asset.uri,
        is_primary: false, // Use is_primary, not isPrimary
        name: asset.fileName || `image_${Date.now()}.${asset.type}`,
        type: asset.mimeType || 'image/jpeg',
        image_url: '', // Will be filled after upload
        isNew: true, // Mark as new image
      }));

      setSelectedImages(prev => {
        let updatedImages = [...prev.filter(img => !img.isDeleted), ...newImages];
        // Ensure only one primary image exists among active images
        const activeImages = updatedImages.filter(img => !img.isDeleted);
        const currentPrimary = activeImages.find(img => img.is_primary);

        if (!currentPrimary && activeImages.length > 0) {
          // If no primary image exists, make the first active one primary
          const firstActiveImage = activeImages[0];
          updatedImages = updatedImages.map(img =>
            img.id === firstActiveImage.id ? { ...img, is_primary: true } : img
          );
        }
        return updatedImages;
      });
    }
  };

  const removeImage = (idToRemove: string) => {
    setSelectedImages(prev => {
      let updatedImages = prev.map(img => 
        img.id === idToRemove ? { ...img, isDeleted: true } : img
      );

      // If the removed image was primary and there are other non-deleted images, make the first one primary
      const removedWasPrimary = prev.find(img => img.id === idToRemove)?.is_primary; // Use is_primary
      const nonDeletedImages = updatedImages.filter(img => !img.isDeleted);

      if (removedWasPrimary && nonDeletedImages.length > 0) {
        // Find the first non-deleted image and make it primary
        const firstAvailableImage = nonDeletedImages[0];
        updatedImages = updatedImages.map(img => 
          img.id === firstAvailableImage.id ? { ...img, is_primary: true } : img
        );
      }
      return updatedImages;
    });
  };

  const togglePrimaryImage = (idToMakePrimary: string) => {
    setSelectedImages(prev =>
      prev.map(img => ({
        ...img,
        is_primary: img.id === idToMakePrimary, // Use is_primary
      }))
    );
  };

  const handleUpdateAccommodation = async () => {
    if (!alojamiento) {
      Alert.alert('Error', 'No se ha seleccionado ningún alojamiento para editar.');
      return;
    }

    if (
      !name || !description || !location || !address || !pricePerNight ||
      !capacity || !bedrooms || !bathrooms
    ) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    // Ensure there is at least one primary image among non-deleted ones
    const activeImages = selectedImages.filter(img => !img.isDeleted);
    const hasPrimaryActiveImage = activeImages.some(img => img.is_primary); // Use is_primary
    if (activeImages.length === 0 || !hasPrimaryActiveImage) {
      Alert.alert('Error', 'Debe haber al menos una imagen activa y una imagen principal.');
      return;
    }


    setLoading(true);

    try {
      // 1. Update the accommodation details
      const { error: accommodationError } = await supabase
        .from('accommodations')
        .update({
          name,
          description,
          location,
          address,
          price_per_night: parseFloat(pricePerNight),
          capacity: parseInt(capacity),
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          has_bike_storage: hasBikeStorage,
          has_bike_rental: hasBikeRental,
          has_bike_tools: hasBikeTools,
          has_laundry: hasLaundry,
          has_wifi: hasWifi,
          has_kitchen: hasKitchen,
          has_parking: hasParking,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alojamiento.id);

      if (accommodationError) throw accommodationError;

      // 2. Handle images: upload new, delete marked, update existing primary status
      const imagesToUpload = selectedImages.filter(img => img.isNew && !img.isDeleted);
      const imagesToDelete = selectedImages.filter(img => img.isDeleted && !img.isNew); // Only delete existing ones
      const imagesToUpdatePrimary = selectedImages.filter(img => !img.isNew && !img.isDeleted);

      // Upload new images
      const uploadPromises = imagesToUpload.map(async (image) => {
        const fileExtension = image.uri.split('.').pop();
        const path = `${user?.id}/${alojamiento.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`; // Use user.id safely

        const response = await fetch(image.uri);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('accommodation_images')
          .upload(path, blob, {
            contentType: image.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('accommodation_images')
          .getPublicUrl(path);

        if (!publicURLData || !publicURLData.publicUrl) {
          throw new Error('Failed to get public URL for image');
        }

        return {
          accommodation_id: alojamiento.id,
          image_url: publicURLData.publicUrl,
          is_primary: image.is_primary, // Use is_primary
        };
      });

      const uploadedImagesData = await Promise.all(uploadPromises);
      if (uploadedImagesData.length > 0) {
        const { error: insertNewImagesError } = await supabase
          .from('accommodation_images')
          .insert(uploadedImagesData);
        if (insertNewImagesError) throw insertNewImagesError;
      }

      // Delete marked images
      for (const image of imagesToDelete) {
        if (image.image_url) {
          // Extract path from URL for storage deletion
          const urlParts = image.image_url.split('/');
          const bucketIndex = urlParts.indexOf('accommodation_images'); // Find the bucket name index
          const pathToRemove = urlParts.slice(bucketIndex + 1).join('/'); // Get everything after the bucket name

          const { error: storageDeleteError } = await supabase.storage
            .from('accommodation_images')
            .remove([pathToRemove]);
          if (storageDeleteError) {
            console.warn('Error deleting image from storage:', storageDeleteError.message);
            // Don't throw, just warn, as DB deletion is more critical
          }
        }
        const { error: dbDeleteError } = await supabase
          .from('accommodation_images')
          .delete()
          .eq('id', image.id);
        if (dbDeleteError) throw dbDeleteError;
      }

      // Update primary status for existing images
      const updatePrimaryPromises = imagesToUpdatePrimary.map(async (image) => {
        const { error: updateError } = await supabase
          .from('accommodation_images')
          .update({ is_primary: image.is_primary }) // Use is_primary
          .eq('id', image.id);
        if (updateError) throw updateError;
      });
      await Promise.all(updatePrimaryPromises);

      // 3. Sync optional amenities
      const existingAmenityNames = alojamiento.accommodation_amenities.map(a => a.amenity_name);
      const currentAmenityNames = optionalAmenities.map(a => a.amenity_name);

      // Amenities to add (new amenities in current list)
      const amenitiesToAdd = optionalAmenities.filter(
        amenity => amenity.id.startsWith('new-') && !existingAmenityNames.includes(amenity.amenity_name)
      );

      if (amenitiesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('accommodation_amenities')
          .insert(amenitiesToAdd.map(a => ({
            accommodation_id: alojamiento.id,
            amenity_name: a.amenity_name
          })));
        if (insertError) throw insertError;
      }

      // Amenities to remove (existing amenities not in current list)
      const amenitiesToRemove = alojamiento.accommodation_amenities.filter(
        amenity => !currentAmenityNames.includes(amenity.amenity_name)
      );

      if (amenitiesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('accommodation_amenities')
          .delete()
          .in('id', amenitiesToRemove.map(a => a.id));
        if (deleteError) throw deleteError;
      }

      Alert.alert('Éxito', 'Alojamiento actualizado correctamente.');
      onSaveSuccess();
      onClose(); // Close the modal after successful update
    } catch (error: any) {
      console.error('Error updating accommodation:', error.message);
      Alert.alert('Error', `No se pudo actualizar el alojamiento: ${error.message}`);
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
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Alojamiento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Detalles del Alojamiento</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del Alojamiento"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
              <TextInput
                style={styles.input}
                placeholder="Ubicación (Ej: Ciudad, País)"
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección Completa"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="Precio por Noche (USD)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={pricePerNight}
                onChangeText={setPricePerNight}
              />
              <TextInput
                style={styles.input}
                placeholder="Capacidad de Huéspedes"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
              />
              <TextInput
                style={styles.input}
                placeholder="Número de Dormitorios"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={bedrooms}
                onChangeText={setBedrooms}
              />
              <TextInput
                style={styles.input}
                placeholder="Número de Baños"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={bathrooms}
                onChangeText={setBathrooms}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Imágenes del Alojamiento</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                <Camera size={20} color="#161622" />
                <Text style={styles.imagePickerButtonText}>Seleccionar Imágenes</Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreviewContainer}>
                {selectedImages.filter(img => !img.isDeleted).map((image) => (
                  <View key={image.id} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity onPress={() => removeImage(image.id)} style={styles.removeImageButton}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => togglePrimaryImage(image.id)}
                      style={[
                        styles.primaryImageBadge,
                        { backgroundColor: image.is_primary ? '#F59E0B' : 'rgba(0,0,0,0.6)' }, // Use is_primary
                      ]}
                    >
                      <Text style={styles.primaryImageText}>
                        {image.is_primary ? 'Principal' : 'Marcar Principal'} // Use is_primary
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Amenities Obligatorios</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Espacio para Bicicletas</Text>
                <Switch
                  value={hasBikeStorage}
                  onValueChange={setHasBikeStorage}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasBikeStorage ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Alquiler de Bicicletas</Text>
                <Switch
                  value={hasBikeRental}
                  onValueChange={setHasBikeRental}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasBikeRental ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Herramientas para Bicicletas</Text>
                <Switch
                  value={hasBikeTools}
                  onValueChange={setHasBikeTools}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasBikeTools ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Lavandería</Text>
                <Switch
                  value={hasLaundry}
                  onValueChange={setHasLaundry}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasLaundry ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>WiFi</Text>
                <Switch
                  value={hasWifi}
                  onValueChange={setHasWifi}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasWifi ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Cocina</Text>
                <Switch
                  value={hasKitchen}
                  onValueChange={setHasKitchen}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasKitchen ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Estacionamiento</Text>
                <Switch
                  value={hasParking}
                  onValueChange={setHasParking}
                  trackColor={{ false: '#767577', true: '#4ADE80' }}
                  thumbColor={hasParking ? '#F4F3F4' : '#F4F3F4'}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Amenities Opcionales</Text>
              <View style={styles.addAmenityContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Ej: Piscina, Gimnasio, Aire Acondicionado..."
                  placeholderTextColor="#9CA3AF"
                  value={newAmenity}
                  onChangeText={setNewAmenity}
                  onSubmitEditing={handleAddAmenity}
                />
                <TouchableOpacity onPress={handleAddAmenity} style={styles.addAmenityButton}>
                  <Plus size={20} color="#161622" />
                </TouchableOpacity>
              </View>
              <View style={styles.amenitiesList}>
                {optionalAmenities.map((amenity) => (
                  <View key={amenity.id} style={styles.amenityItem}>
                    <Text style={styles.amenityText}>{amenity.amenity_name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveAmenity(amenity.id)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateAccommodation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#161622" />
            ) : (
              <Text style={styles.buttonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    backgroundColor: '#1E293B',
    borderRadius: 15,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#2D3748',
    borderRadius: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  addAmenityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addAmenityButton: {
    backgroundColor: '#F59E0B',
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
  imagePickerButton: {
    backgroundColor: '#F59E0B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },
  imagePickerButtonText: {
    color: '#161622',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesPreviewContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  imagePreviewWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 15,
    padding: 3,
    zIndex: 1,
  },
  primaryImageBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  primaryImageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 16,
  },
  buttonText: {
    color: '#161622',
    fontSize: 18,
    fontWeight: 'bold',
  },
});