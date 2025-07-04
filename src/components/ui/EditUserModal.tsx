import React, { useState, useEffect } from 'react';
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
  ImageSourcePropType,
} from 'react-native';
import { User, X, Check } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase'; // Asegúrate de ajustar esta ruta
import * as ImagePicker from 'expo-image-picker';

// Definición de tipos
type UserRole = 'user' | 'host' | 'admin';

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email: string;
  role: UserRole;
}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<ProfileData>) => void;
  profile: ProfileData;
  isAdmin?: boolean;
}

const supabaseUrl = 'https://eseezsiwiuogxovjfvrl.supabase.co';

export default function EditProfileModal({ 
  visible, 
  onClose, 
  onSave,
  profile,
  isAdmin = false 
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
    role: UserRole;
  }>({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(profile.avatar_url);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        role: profile.role || 'user',
      });
      setCurrentAvatar(profile.avatar_url);
    }
  }, [profile]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          ...(isAdmin && { role: formData.role }),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSuccess(true);
      onSave(formData);
      setTimeout(onClose, 1500);
    } catch (error: any) {
      setError(error.message || 'Error al actualizar perfil');
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
      
      const fileExt = result.assets[0].uri.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, {
          uri: result.assets[0].uri,
          type: `image/${fileExt}`,
          name: fileName,
        } as any, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setCurrentAvatar(publicUrl);
      onSave({ avatar_url: publicUrl });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al cambiar el avatar');
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
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', profile.id);

              if (updateError) throw updateError;

              if (currentAvatar) {
                const filePath = currentAvatar.split('/').pop();
                if (filePath) {
                  await supabase.storage
                    .from('avatars')
                    .remove([filePath]);
                }
              }

              setCurrentAvatar(null);
              onSave({ avatar_url: null });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Ocurrió un error al eliminar');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getAvatarSource = (): ImageSourcePropType | undefined => {
    if (!currentAvatar) return undefined;
    
    const avatarUrl = currentAvatar.startsWith('http') 
      ? currentAvatar 
      : `${supabaseUrl}/storage/v1/object/public/avatars/${currentAvatar}`;
    
    return { uri: avatarUrl };
  };

  const avatarSource = getAvatarSource();

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
            <Text style={styles.modalTitle}>
              {isAdmin ? 'Editar Usuario' : 'Editar Perfil'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            {avatarSource ? (
              <Image 
                source={avatarSource} 
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
                disabled={loading}
              >
                <MaterialIcons name="photo-camera" size={20} color="#FFFFFF" />
                <Text style={styles.avatarButtonText}>Cambiar</Text>
              </TouchableOpacity>
              {avatarSource && (
                <TouchableOpacity
                  style={[styles.avatarButton, styles.removeAvatarButton]}
                  onPress={handleAvatarRemove}
                  disabled={loading}
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
                value={formData.first_name}
                onChangeText={(text) => handleChange('first_name', text)}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) => handleChange('last_name', text)}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            {isAdmin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rol</Text>
                <View style={styles.roleButtons}>
                  {(['user', 'host', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive
                      ]}
                      onPress={() => handleRoleChange(role)}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive
                      ]}>
                        {role === 'user' ? 'Usuario' : 
                         role === 'host' ? 'Anfitrión' : 'Administrador'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>¡Cambios guardados!</Text>}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
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
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  roleButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});