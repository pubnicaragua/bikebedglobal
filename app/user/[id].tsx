import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
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

// --- Tipos y Funciones de Utilidad ---
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

const getRoleText = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'host':
      return 'Anfitrión';
    case 'user':
      return 'Usuario';
    default:
      return role;
  }
};

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '#EF4444'; // red-500
    case 'host':
      return '#F59E0B'; // amber-500
    case 'user':
      return '#4ADE80'; // green-400
    default:
      return '#9CA3AF'; // gray-400
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// --- Componente Modal para Editar Rol (Corregido) ---
interface RoleEditorModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserDetails;
  currentUserRole: UserRole;
  currentUserId?: string;
  onRoleUpdated: (newRole: UserRole) => void;
}

const RoleEditorModal = ({
  visible,
  onClose,
  user,
  currentUserRole,
  currentUserId,
  onRoleUpdated,
}: RoleEditorModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleRoleUpdate = async () => {
    if (!user || selectedRole === user.role) return;

    setLoading(true);
    setError(null);

    try {
      // Parámetros actualizados para coincidir con la función SQL
      const { error: rpcError } = await supabase.rpc('update_user_role', {
        target_id: user.id, // Nombre del parámetro en SQL: target_id
        new_role: selectedRole, // Nombre del parámetro en SQL: new_role
      });

      if (rpcError) throw rpcError;

      onRoleUpdated(selectedRole);
      Alert.alert('Éxito', 'Rol actualizado correctamente');
      onClose();
    } catch (err) {
      console.error('Error updating role:', err);
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`No se pudo actualizar el rol: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const isSelf = user.id === currentUserId;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar Rol de Usuario</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={24} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          <Text style={styles.currentRoleText}>
            Cambiando rol para:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {user.first_name || user.email}
            </Text>
          </Text>

          {isSelf && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                No puedes cambiar tu propio rol.
              </Text>
            </View>
          )}

          <View style={styles.roleSelectionContainer}>
            {(['admin', 'host', 'user'] as UserRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  { backgroundColor: getRoleColor(role) },
                  selectedRole === role && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole(role)}
                disabled={loading || isSelf}
              >
                <Text style={styles.roleOptionText}>{getRoleText(role)}</Text>
                {selectedRole === role && <Check size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorTextModal}>{error}</Text>}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                (loading || selectedRole === user.role || isSelf) &&
                  styles.disabledButton,
              ]}
              onPress={handleRoleUpdate}
              disabled={loading || selectedRole === user.role || isSelf}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Componente Modal para Editar Usuario ---
const UserEditModal = ({
  visible,
  onClose,
  user,
  onSave,
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
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
                style={styles.disabledInput}
                value={user.email}
                editable={false}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, first_name: text })
                }
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, last_name: text })
                }
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                placeholder="Teléfono"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          {error && <Text style={styles.errorTextModal}>{error}</Text>}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Pantalla Principal ---
export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const { user: currentUser, profile } = useAuth();

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== 'string')
        throw new Error('ID de usuario inválido.');

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setUser(data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('No se pudo cargar la información del usuario.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const updateUser = async (updatedData: Partial<UserDetails>) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
      Alert.alert('Éxito', 'Datos actualizados correctamente.');
    } catch (err) {
      console.error('Error updating user:', err);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
      throw err; // Re-throw para que el modal pueda manejarlo
    }
  };

  const handleRoleUpdated = (newRole: UserRole) => {
    setUser((prev) => (prev ? { ...prev, role: newRole } : null));
  };

  const handleDeleteUser = async () => {
    if (!user || !currentUser || user.id === currentUser.id) return;

    setLoading(true);
    try {
      // Llamar a la función SQL con el nombre correcto del parámetro
      const { error: functionError } = await supabase.rpc('delete_user', {
        user_id_to_delete: user.id, // ✅ Nombre del parámetro que coincide con la función
      });

      if (functionError) throw functionError;

      Alert.alert('Éxito', 'Usuario eliminado permanentemente.');
      router.replace('/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      Alert.alert('Error', `No se pudo eliminar el usuario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          '¿Estás seguro de que quieres eliminar este usuario permanentemente? Esta acción no se puede deshacer.'
        )
      ) {
        handleDeleteUser();
      }
    } else {
      Alert.alert(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar este usuario permanentemente? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: handleDeleteUser },
        ]
      );
    }
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>
            {error || 'No se encontró el usuario.'}
          </Text>
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
  const isSelf = user.id === currentUser?.id;

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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri:
                user.avatar_url ||
                'https://placehold.co/200x200/64748B/FFFFFF?text=User',
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>
            {user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : user.email}
          </Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(user.role) },
            ]}
          >
            <Text style={styles.roleText}>{getRoleText(user.role)}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Información</Text>
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
          <Text style={styles.sectionTitle}>Acciones</Text>

          {(isAdmin || isSelf) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditModalVisible(true)}
              disabled={loading}
            >
              <Edit size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setRoleModalVisible(true)}
            disabled={loading || isSelf}
          >
            <Shield size={20} color={isSelf ? '#4B5563' : '#F59E0B'} />
            <Text
              style={[
                styles.actionButtonText,
                { color: isSelf ? '#4B5563' : '#F59E0B' },
              ]}
            >
              Cambiar Rol
            </Text>
          </TouchableOpacity>

          {!isSelf && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={confirmDeleteUser}
              disabled={loading}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Eliminar Usuario
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <UserEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
        onSave={updateUser}
      />

      {roleModalVisible && (
        <RoleEditorModal
          visible={roleModalVisible}
          onClose={() => setRoleModalVisible(false)}
          user={user}
          currentUserRole={currentUser?.role as UserRole}
          currentUserId={currentUser?.id}
          onRoleUpdated={handleRoleUpdated}
        />
      )}
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: { padding: 4 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  returnButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  returnButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  detailsSection: {
    marginBottom: 24,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#E5E7EB',
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
    gap: 16,
    paddingVertical: 8,
  },
  detailText: { color: '#D1D5DB', fontSize: 16, flex: 1 },
  actionsSection: { marginBottom: 32 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  deleteButtonText: { color: '#EF4444' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#4B5563' },
  confirmButton: { backgroundColor: '#3B82F6' },
  saveButton: { backgroundColor: '#22C55E' },
  disabledButton: { backgroundColor: '#374151' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  formContainer: { marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
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
  disabledInput: { backgroundColor: '#1F2937', color: '#9CA3AF' },
  roleSelectionContainer: { marginBottom: 16 },
  currentRoleText: {
    color: '#E5E7EB',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleOptionSelected: { borderWidth: 2, borderColor: '#FFFFFF' },
  roleOptionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  errorTextModal: {
    color: '#F87171',
    textAlign: 'center',
    marginVertical: 12,
    fontSize: 14,
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: { color: '#F59E0B', textAlign: 'center', fontWeight: '500' },
});
