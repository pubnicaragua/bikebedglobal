import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Home, 
  DollarSign, 
  Star, 
  MessageCircle, 
  Calendar, 
  Bike, 
  LogOut,
  Users,
  Map,
  Bell,
  Settings
} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRoutes: number;
  activeRoutes: number;
  totalBookings: number;
  pendingNotifications: number;
  unreadMessages: number;
}

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalBookings: 0,
    pendingNotifications: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchAdminStats();
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOut'),
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const fetchAdminStats = async () => {
    if (!user) return;

    try {
      // Estadísticas de usuarios
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Estadísticas de rutas
      const { count: totalRoutes } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true });

      const { count: activeRoutes } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Estadísticas de reservas
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Notificaciones pendientes
      const { count: pendingNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Mensajes no leídos
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalRoutes: totalRoutes || 0,
        activeRoutes: activeRoutes || 0,
        totalBookings: totalBookings || 0,
        pendingNotifications: pendingNotifications || 0,
        unreadMessages: unreadMessages || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = '#4ADE80' }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Panel de Administrador</Text>
            <Text style={styles.subtitle}>Gestión completa de la plataforma</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.languageToggleContainer}>
              <LanguageToggle />
            </View>
            <TouchableOpacity 
              onPress={handleSignOut} 
              style={styles.signOutButton}
            >
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={Users}
            title="Usuarios"
            value={`${stats.activeUsers}/${stats.totalUsers}`}
            subtitle="activos/totales"
            color="#3B82F6"
          />
          <StatCard
            icon={Map}
            title="Rutas"
            value={`${stats.activeRoutes}/${stats.totalRoutes}`}
            subtitle="activas/totales"
            color="#8B5CF6"
          />
          <StatCard
            icon={Calendar}
            title="Reservas"
            value={stats.totalBookings}
            subtitle="totales"
            color="#F59E0B"
          />
          <StatCard
            icon={Bell}
            title="Notificaciones"
            value={stats.pendingNotifications}
            subtitle="pendientes"
            color="#EC4899"
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Gestión Principal</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/users')}
          >
            <View style={styles.actionIcon}>
              <Users size={20} color="#3B82F6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Usuarios</Text>
              <Text style={styles.actionSubtitle}>Administrar todos los usuarios del sistema</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/routes')}
          >
            <View style={styles.actionIcon}>
              <Map size={20} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Rutas</Text>
              <Text style={styles.actionSubtitle}>Crear y administrar rutas disponibles</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/')}
          >
            <View style={styles.actionIcon}>
              <Bell size={20} color="#EC4899" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Notificaciones</Text>
              <Text style={styles.actionSubtitle}>Enviar y administrar notificaciones</Text>
            </View>
            {stats.pendingNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/')}
          >
            <View style={styles.actionIcon}>
              <Calendar size={20} color="#F59E0B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Reservas</Text>
              <Text style={styles.actionSubtitle}>Ver y administrar todas las reservas</Text>
            </View>
          </TouchableOpacity>

          {/* Nuevo botón para Reportes Financieros */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/')}
          >
            <View style={styles.actionIcon}>
              <DollarSign size={20} color="#10B981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Reportes Financieros</Text>
              <Text style={styles.actionSubtitle}>Ver reportes de ingresos y ganancias</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Otras Acciones</Text>
          
          {stats.unreadMessages > 0 && (
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/')}
            >
              <View style={styles.actionIcon}>
                <MessageCircle size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Mensajes</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.unreadMessages} mensajes sin leer
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.unreadMessages}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/')}
          >
            <View style={styles.actionIcon}>
              <Settings size={20} color="#6B7280" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Configuración del Sistema</Text>
              <Text style={styles.actionSubtitle}>Ajustes generales de la plataforma</Text>
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageToggleContainer: {},
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statSubtitle: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentActivity: {
    marginBottom: 32,
  },
  activityCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  activityTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});