import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Users, Shield, Ban, CheckCircle} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'host' | 'admin';
  created_at: string;
  is_active?: boolean;
  phone?: string | null;
}

export default function UsersManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'host' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      Alert.alert('Éxito', 'Rol actualizado correctamente');
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'No se pudo actualizar el rol');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));
      
      Alert.alert(
        'Éxito', 
        `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado del usuario');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

              if (error) throw error;
              
              setUsers(prev => prev.filter(u => u.id !== userId));
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'No se pudo eliminar el usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#EF4444';
      case 'host':
        return '#F59E0B';
      case 'user':
        return '#4ADE80';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive ? '#10B981' : '#EF4444';
  };

  const getRoleText = (role: string) => {
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

  const getStatusText = (isActive: boolean | undefined) => {
    return isActive ? 'Activo' : 'Inactivo';
  };

  const navigateToUserDetail = (user: User) => {
    router.push({
      pathname: '/user/[id]',
      params: { id: user.id },
    });
  };

  const UserCard = ({ user: userItem }: { user: User }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => navigateToUserDetail(userItem)}
    >
      <View style={styles.userInfo}>
        <Image
          source={{
            uri: userItem.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          }}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {userItem.first_name} {userItem.last_name}
          </Text>
          <Text style={styles.userEmail}>{userItem.email}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userItem.is_active) }]}>
              <Text style={styles.statusText}>{getStatusText(userItem.is_active)}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userItem.role) }]}>
              <Text style={styles.roleText}>{getRoleText(userItem.role)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Usuarios</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#4ADE80" />
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Shield size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'host').length}
            </Text>
            <Text style={styles.statLabel}>Anfitriones</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#EF4444" />
            <Text style={styles.statNumber}>
              {users.filter(u => u.role === 'admin').length}
            </Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
        </View>

        <View style={styles.usersList}>
          {users.map((userItem) => (
            <UserCard key={userItem.id} user={userItem} />
          ))}
        </View>
      </ScrollView>
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
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#1E40AF',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
  },
});