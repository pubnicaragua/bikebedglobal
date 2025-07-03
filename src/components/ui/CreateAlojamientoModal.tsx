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
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface CreateAlojamientoModalProps {
  visible: boolean;
  onClose: () => void;
  onAccommodationCreated: () => void;
}

const CreateAlojamientoModal: React.FC<CreateAlojamientoModalProps> = ({
  visible,
  onClose,
  onAccommodationCreated,
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

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    setIsUploading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to select images');
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
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return null;

    try {
      // Verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || 'User not authenticated');
      }

      // Read and prepare the file
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `accommodations/${fileName}`;

      // Upload with proper content type
      const { data, error: uploadError } = await supabase
        .storage
        .from('accommodation-images')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('accommodation-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: unknown) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload image';
      if (error instanceof Error) {
        if (error.message.includes('row-level security policy')) {
          errorMessage = 'You don\'t have upload permissions. Contact support.';
        } else if (error.message.includes('Content-Type')) {
          errorMessage = 'Invalid image format';
        }
      }
      
      Alert.alert('Upload Error', errorMessage);
      return null;
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim() || !formData.description.trim() || 
        !formData.location.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (isNaN(Number(formData.pricePerNight))) {
      Alert.alert('Error', 'Price per night must be a valid number');
      return;
    }

    setIsLoading(true);

    try {
      // Verify authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || 'User not authenticated');
      }

      // Upload image if exists
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          Alert.alert('Warning', 'Accommodation will be created without image');
        }
      }

      // Create accommodation
      const { data, error } = await supabase
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
        .select();

      if (error) throw error;

      // Create image record if we have a URL
      if (imageUrl && data?.[0]?.id) {
        await supabase
          .from('accommodation_images')
          .insert({
            accommodation_id: data[0].id,
            image_url: imageUrl,
            is_primary: true
          });
      }

      Alert.alert('Success', 'Accommodation created successfully');
      onAccommodationCreated();
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error('Creation error:', error);
      let errorMessage = 'Failed to create accommodation';
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
              <Text style={styles.title}>Create New Accommodation</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Image Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Accommodation Image</Text>
              <TouchableOpacity 
                style={styles.imageUploadButton} 
                onPress={pickImage}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.imageUploadButtonText}>
                    {image ? 'Change Image' : 'Select Image'}
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
                    <Text style={styles.removeImageButtonText}>Remove Image</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Basic Information Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Accommodation name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                placeholder="Describe your accommodation..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => handleChange('location', text)}
                placeholder="City, Country"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                placeholder="Street address"
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Price per night (USD)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pricePerNight}
                  onChangeText={(text) => handleChange('pricePerNight', text)}
                  placeholder="100"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Maximum guests</Text>
                <TextInput
                  style={styles.input}
                  value={formData.capacity}
                  onChangeText={(text) => handleChange('capacity', text)}
                  placeholder="4"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) => handleChange('bedrooms', text)}
                  placeholder="2"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) => handleChange('bathrooms', text)}
                  placeholder="1"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Amenities Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              
              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeStorage}
                  onValueChange={(value) => handleChange('hasBikeStorage', value)}
                  thumbColor={formData.hasBikeStorage ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Bike storage</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeRental}
                  onValueChange={(value) => handleChange('hasBikeRental', value)}
                  thumbColor={formData.hasBikeRental ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Bike rental</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasBikeTools}
                  onValueChange={(value) => handleChange('hasBikeTools', value)}
                  thumbColor={formData.hasBikeTools ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Bike tools</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasLaundry}
                  onValueChange={(value) => handleChange('hasLaundry', value)}
                  thumbColor={formData.hasLaundry ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Laundry</Text>
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
                <Text style={styles.toggleLabel}>Kitchen</Text>
              </View>

              <View style={styles.toggleContainer}>
                <Switch
                  value={formData.hasParking}
                  onValueChange={(value) => handleChange('hasParking', value)}
                  thumbColor={formData.hasParking ? '#4ADE80' : '#f4f3f4'}
                  trackColor={{ false: '#6B7280', true: '#4ADE8050' }}
                />
                <Text style={styles.toggleLabel}>Parking</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, (isLoading || isUploading) && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isLoading || isUploading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.createButtonText}>Create Accommodation</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Estilos (se mantienen igual)
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
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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

export default CreateAlojamientoModal;