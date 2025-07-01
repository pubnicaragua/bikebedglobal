import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Home, Calendar, DollarSign, Route, TrendingUp } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';

interface AdminStats {
  totalUsers: number;
  totalHosts: number;
  totalAccommodations: number;
  totalBookings: number;
  totalRevenue: number;
  totalRoutes: number;
}

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalHosts: 0,
    totalAccommodations: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalRoutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch hosts count
      const { count: hostsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'host');

      // Fetch accommodations count
      const { count: accommodationsCount } = await supabase
        .from('accommodations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch bookings and revenue
      const { data: bookings, count: bookingsCount } = await supabase
        .from('bookings')
        .select('total_price, status', { count: 'exact' });

      const totalRevenue = bookings?.reduce((sum, booking) => {
        return booking.status === 'confirmed' ? sum + booking.total_price : sum;
      }, 0) || 0;

      // Fetch routes count
      const { count: routesCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalUsers: usersCount || 0,
        totalHosts: hostsCount || 0,
        totalAccommodations: accommodationsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        totalRoutes: routesCount || 0,
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
      <LanguageToggle />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel de Administración</Text>
          <Text style={styles.subtitle}>Gestiona toda la plataforma</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={Users}
            title="Usuarios Totales"
            value={stats.totalUsers}
            subtitle="registrados"
          />
          
          <StatCard
            icon={Home}
            title="Anfitriones"
            value={stats.totalHosts}
            subtitle="activos"
            color="#F59E0B"
          />
          
          <StatCard
            icon={Home}
            title="Alojamientos"
            value={stats.totalAccommodations}
            subtitle="publicados"
            color="#8B5CF6"
          />
          
          <StatCard
            icon={Calendar}
            title="Reservas"
            value={stats.totalBookings}
            subtitle="totales"
            color="#EF4444"
          />
          
          <StatCard
            icon={DollarSign}
            title="Ingresos"
            value={`$${stats.totalRevenue.toFixed(0)}`}
            subtitle="confirmados"
            color="#10B981"
          />
          
          <StatCard
            icon={Route}
            title="Rutas"
            value={stats.totalRoutes}
            subtitle="verificadas"
            color="#06B6D4"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Gestión del Sistema</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Users size={20} color="#4ADE80" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestionar Usuarios</Text>
              <Text style={styles.actionSubtitle}>Activar, desactivar y moderar usuarios</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Home size={20} color="#F59E0B" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Aprobar Anfitriones</Text>
              <Text style={styles.actionSubtitle}>Revisar solicitudes de anfitrión</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Route size={20} color="#06B6D4" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Verificar Rutas</Text>
              <Text style={styles.actionSubtitle}>Aprobar y verificar nuevas rutas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Configuración Global</Text>
              <Text style={styles.actionSubtitle}>Ajustes del sistema y políticas</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Nuevo usuario registrado</Text>
            <Text style={styles.activityTime}>Hace 1 hora</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Solicitud de anfitrión pendiente</Text>
            <Text style={styles.activityTime}>Hace 3 horas</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Nueva ruta creada</Text>
            <Text style={styles.activityTime}>Ayer</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>Reporte de usuario</Text>
            <Text style={styles.activityTime}>Hace 2 días</Text>
          </View>
        </View>

        {/* System Health */}
        <View style={styles.systemHealth}>
          <Text style={styles.sectionTitle}>Estado del Sistema</Text>
          
          <View style={styles.healthCard}>
            <View style={styles.healthIndicator}>
              <View style={[styles.healthDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.healthText}>Base de Datos</Text>
            </View>
            <Text style={styles.healthStatus}>Operativo</Text>
          </View>
          
          <View style={styles.healthCard}>
            <View style={styles.healthIndicator}>
              <View style={[styles.healthDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.healthText}>Servidor de Imágenes</Text>
            </View>
            <Text style={styles.healthStatus}>Operativo</Text>
          </View>
          
          <View style={styles.healthCard}>
            <View style={styles.healthIndicator}>
              <View style={[styles.healthDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.healthText}>Sistema de Pagos</Text>
            </View>
            <Text style={styles.healthStatus}>Mantenimiento</Text>
          </View>
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
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubtitle: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
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
    fontSize: 16,
  },
  activityTime: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  systemHealth: {
    marginBottom: 32,
  },
  healthCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  healthStatus: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});