import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { User, X, Check } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: {
    avatar_url?: string | null;
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

export default function EditProfileModal({ visible, onClose, profile }: EditProfileModalProps) {
  const { updateProfile, updateAvatar, removeAvatar, loading: authLoading } = useAuth();
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [currentAvatar, setCurrentAvatar] = React.useState(profile.avatar_url);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
      });
      setCurrentAvatar(profile.avatar_url);
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Debes permitir acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setLoading(true);
      const { data, error } = await updateAvatar(result.assets[0].uri);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else if (data?.path) {
        const avatarUrl = `https://[TU-ID-DE-SUPABASE].supabase.co/storage/v1/object/public/avatars/${data.path}`;
        setCurrentAvatar(avatarUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error en handleAvatarChange:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    Alert.alert(
      'Eliminar avatar',
      '¿Estás seguro de eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await removeAvatar();
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                setCurrentAvatar(null);
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al eliminar');
              console.error('Error en handleAvatarRemove:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getAvatarUrl = () => {
    if (!currentAvatar) return null;
    
    if (currentAvatar.startsWith('http')) {
      return currentAvatar;
    }
    
    return `https://[TU-ID-DE-SUPABASE].supabase.co/storage/v1/object/public/avatars/${currentAvatar}`;
  };

  const isLoading = loading || authLoading;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <X size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            {getAvatarUrl() ? (
              <Image 
                source={{ uri: getAvatarUrl()! }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handleAvatarChange}
                disabled={isLoading}
              >
                <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>Cambiar</Text>
              </TouchableOpacity>
              {getAvatarUrl() && (
                <TouchableOpacity
                  style={[styles.avatarButton, styles.removeAvatarButton]}
                  onPress={handleAvatarRemove}
                  disabled={isLoading}
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                  <Text style={[styles.avatarButtonText, { color: '#EF4444' }]}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                placeholder="Teléfono"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>¡Perfil actualizado!</Text>}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  saveButton: {
    backgroundColor: '#4ADE80',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  removeAvatarButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#E5E7EB',
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
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: '#4ADE80',
    textAlign: 'center',
    marginBottom: 10,
  },
});