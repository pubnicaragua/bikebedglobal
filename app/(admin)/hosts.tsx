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
import { ArrowLeft, Home, CheckCircle, Clock, X } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface HostApplication {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  accommodations: Array<{
    id: string;
    name: string;
    location: string;
    is_active: boolean;
  }>;
}

export default function HostsManagementScreen() {
  const [hosts, setHosts] = useState<HostApplication[]>([]);
  const [pendingHosts, setPendingHosts] = useState<HostApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchHosts();
    }
  }, [user]);

  const fetchHosts = async () => {
    try {
      // Fetch current hosts
      const { data: hostsData, error: hostsError } = await supabase
        .from('profiles')
        .select(`
          *,
          accommodations(id, name, location, is_active)
        `)
        .eq('role', 'host');

      if (hostsError) throw hostsError;

      // For demo purposes, we'll simulate pending applications
      // In a real app, you'd have a separate table for host applications
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .limit(3);

      if (pendingError) throw pendingError;

      setHosts(hostsData || []);
      setPendingHosts(pendingData || []);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      Alert.alert('Error', 'No se pudieron cargar los anfitriones');
    } finally {
      setLoading(false);
    }
  };

  const approveHost = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'host' })
        .eq('id', userId);

      if (error) throw error;
      
      Alert.alert('Éxito', 'Anfitrión aprobado correctamente');
      fetchHosts(); // Refresh data
    } catch (error) {
      console.error('Error approving host:', error);
      Alert.alert('Error', 'No se pudo aprobar el anfitrión');
    }
  };

  const rejectHost = async (userId: string) => {
    Alert.alert(
      'Rechazar Solicitud',
      '¿Estás seguro de que quieres rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            // In a real app, you'd update the application status
            setPendingHosts(prev => prev.filter(h => h.id !== userId));
            Alert.alert('Solicitud rechazada');
          },
        },
      ]
    );
  };

  const HostCard = ({ host, isPending = false }: { host: HostApplication; isPending?: boolean }) => (
    <View style={styles.hostCard}>
      <View style={styles.hostInfo}>
        <Image
          source={{
            uri: host.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          }}
          style={styles.avatar}
        />
        <View style={styles.hostDetails}>
          <Text style={styles.hostName}>
            {host.first_name} {host.last_name}
          </Text>
          <Text style={styles.hostEmail}>{host.email}</Text>
          {!isPending && (
            <Text style={styles.accommodationsCount}>
              {host.accommodations?.length || 0} alojamientos
            </Text>
          )}
          {isPending && (
            <View style={styles.pendingBadge}>
              <Clock size={12} color="#F59E0B" />
              <Text style={styles.pendingText}>Pendiente</Text>
            </View>
          )}
        </View>
      </View>
      
      {isPending ? (
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => approveHost(host.id)}
          >
            <CheckCircle size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => rejectHost(host.id)}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.hostActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Home size={16} color="#4ADE80" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando anfitriones...</Text>
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
        <Text style={styles.title}>Gestión de Anfitriones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pendingHosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
            {pendingHosts.map((host) => (
              <HostCard key={host.id} host={host} isPending={true} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anfitriones Activos</Text>
          {hosts.map((host) => (
            <HostCard key={host.id} host={host} />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hostCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostInfo: {
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
  hostDetails: {
    flex: 1,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  hostEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  accommodationsCount: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  hostActions: {
    flexDirection: 'row',
  },
  pendingActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#4ADE80',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
});