import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Mail, 
  User, 
  Phone, 
  Calendar as CalendarIcon,
  Shield,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';

type UserRole = 'user' | 'host' | 'admin';

interface UserDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  phone: string | null;
}

// Funciones de utilidad
const getRoleText = (role: UserRole): string => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'host': return 'Anfitrión';
    case 'user': return 'Usuario';
    default: return role;
  }
};

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin': return '#EF4444';
    case 'host': return '#F59E0B';
    case 'user': return '#4ADE80';
    default: return '#9CA3AF';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const RoleEditorModal = ({ 
  visible, 
  onClose, 
  user,
  currentUserRole,
  onRoleUpdated
}: {
  visible: boolean;
  onClose: () => void;
  user: UserDetails;
  currentUserRole: UserRole;
  onRoleUpdated: (newRole: UserRole) => void;
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleUpdate = async () => {
    if (!user || selectedRole === user.role) return;
    
    setLoading(true);
    setError(null);

    try {
      if (currentUserRole !== 'admin') {
        throw new Error('Solo los administradores pueden cambiar roles');
      }

      const { data: { user: currentAuthUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (user.id === currentAuthUser?.id) {
        throw new Error('No puedes cambiar tu propio rol');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onRoleUpdated(selectedRole);
      Alert.alert('Éxito', 'Rol actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error updating role:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Rol de Usuario</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.roleSelectionContainer}>
            <Text style={styles.currentRoleText}>
              Rol actual: <Text style={{ fontWeight: 'bold' }}>{getRoleText(user.role)}</Text>
            </Text>
            
            {(['admin', 'host', 'user'] as UserRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  selectedRole === role && styles.roleOptionSelected,
                  { backgroundColor: getRoleColor(role) }
                ]}
                onPress={() => setSelectedRole(role)}
                disabled={loading || currentUserRole !== 'admin'}
              >
                <Text style={styles.roleOptionText}>{getRoleText(role)}</Text>
                {selectedRole === role && <Check size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleRoleUpdate}
              disabled={loading || selectedRole === user.role || currentUserRole !== 'admin'}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Confirmar Cambio</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UserEditModal = ({ 
  visible, 
  onClose, 
  user,
  onSave 
}: {
  visible: boolean;
  onClose: () => void;
  user: UserDetails;
  onSave: (data: Partial<UserDetails>) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await onSave({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user.email}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(text) => setFormData({...formData, first_name: text})}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) => setFormData({...formData, last_name: text})}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                placeholder="Teléfono"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (id) fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<UserDetails>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => ({ ...prev!, ...updatedData }));
      Alert.alert('Éxito', 'Datos actualizados');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo actualizar');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdated = (newRole: UserRole) => {
    setUser(prev => prev ? { ...prev, role: newRole } : null);
  };

  const handleDeleteUser = async () => {
    if (!user || !currentUser) return;
    
    setLoading(true);
    try {
      if (currentUser.role !== 'admin') {
        throw new Error('Solo los administradores pueden eliminar usuarios');
      }

      if (user.id === currentUser.id) {
        throw new Error('No puedes eliminar tu propio usuario');
      }

      await Promise.all([
        supabase.from('bookings').delete().eq('user_id', user.id),
        supabase.from('messages').delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
      ]);

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      Alert.alert('Éxito', 'Usuario eliminado correctamente');
      router.replace('/users');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      Alert.alert('Error', error.message || 'No se pudo eliminar el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró el usuario</Text>
          <TouchableOpacity 
            style={styles.returnButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isAdmin || user.id === currentUser?.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalles del Usuario</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: user.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>
            {user.first_name} {user.last_name}
          </Text>
          
          <View style={styles.roleBadgeContainer}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(user.role) }
            ]}>
              <Text style={styles.roleText}>{getRoleText(user.role)}</Text>
            </View>
          </View>

            <>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setEditModalVisible(true)}
                disabled={loading}
              >
                <Edit size={18} color="#3B82F6" />
                <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editProfileButton, { marginTop: 8, backgroundColor: '#1F2937' }]}
                onPress={() => setRoleModalVisible(true)}
                disabled={loading}
              >
                <Shield size={18} color="#F59E0B" />
                <Text style={[styles.editProfileButtonText, { color: '#F59E0B' }]}>
                  Cambiar Rol
                </Text>
              </TouchableOpacity>
            </>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.detailRow}>
            <Mail size={20} color="#9CA3AF" />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          
          {user.phone && (
            <View style={styles.detailRow}>
              <Phone size={20} color="#9CA3AF" />
              <Text style={styles.detailText}>{user.phone}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <CalendarIcon size={20} color="#9CA3AF" />
            <Text style={styles.detailText}>
              Miembro desde {formatDate(user.created_at)}
            </Text>
          </View>
        </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Acciones Administrativas</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => {
                Alert.alert(
                  'Confirmar Eliminación',
                  '¿Estás seguro de eliminar este usuario permanentemente?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: handleDeleteUser
                    }
                  ]
                );
              }}
              disabled={loading}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Eliminar Usuario
              </Text>
            </TouchableOpacity>
          </View>
      </ScrollView>

      <UserEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
        onSave={updateUser}
      />

      <RoleEditorModal
        visible={roleModalVisible}
        onClose={() => setRoleModalVisible(false)}
        user={user}
        currentUserRole={currentUser?.role as UserRole || 'user'}
        onRoleUpdated={handleRoleUpdated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1E40AF',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleBadgeContainer: {
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
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
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonTitle: {
    backgroundColor: '#374151',
  },
  saveButton: {
    backgroundColor: '#4ADE80',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 16,
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
  disabledInput: {
    backgroundColor: '#1F2937',
    color: '#9CA3AF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  roleSelectionContainer: {
    marginBottom: 16,
  },
  currentRoleText: {
    color: '#E5E7EB',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleOptionSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  roleOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorTex: {
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 12,
  },
  cancelButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});