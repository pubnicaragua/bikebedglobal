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
import { Home, DollarSign, Star, MessageCircle, Calendar, Bike, LogOut, History, Coffee } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { LanguageToggle } from '../../src/components/ui/LanguageToggle';

interface HostStats {
  totalAccommodations: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  unreadMessages: number;
}

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = '#4ADE80' 
}: {
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

export default function HostDashboardScreen() {
  const [stats, setStats] = useState<HostStats>({
    totalAccommodations: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchHostStats();
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOut') || 'Cerrar Sesión',
      t('profile.signOutConfirmation') || '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
        {
          text: t('profile.signOut') || 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const fetchHostStats = async () => {
    if (!user) return;

    try {
      // Obtener estadísticas de alojamientos
      const { count: accommodationsCount } = await supabase
        .from('accommodations')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id)
        .eq('is_active', true);

      // Obtener estadísticas de reservas
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_price, status, accommodations!inner(host_id)')
        .eq('accommodations.host_id', user.id);

      const totalRevenue = bookings?.reduce((sum, booking) => {
        return booking.status === 'confirmed' ? sum + booking.total_price : sum;
      }, 0) || 0;

      // Obtener estadísticas de reseñas
      const { data: reviews } = await supabase
        .from('accommodation_reviews')
        .select('rating, accommodations!inner(host_id)')
        .eq('accommodations.host_id', user.id);

      const averageRating = reviews?.length 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      // Obtener mensajes no leídos
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setStats({
        totalAccommodations: accommodationsCount || 0,
        totalBookings: bookings?.length || 0,
        totalRevenue,
        averageRating,
        unreadMessages: unreadCount || 0
      });
    } catch (error) {
      console.error('Error fetching host stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading') || 'Cargando...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('hostDashboard.title') || 'Panel de Anfitrión'}</Text>
          <Text style={styles.subtitle}>{t('hostDashboard.subtitle') || 'Gestiona tus alojamientos y reservas'}</Text>
        </View>
        <View style={styles.headerButtonsContainer}>
          <LanguageToggle />
          <TouchableOpacity 
            onPress={handleSignOut} 
            style={styles.signOutButton}
          >
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={Home}
            title={t('hostDashboard.accommodationsTitle') || "Alojamientos"}
            value={stats.totalAccommodations}
            subtitle={t('hostDashboard.accommodationsSubtitle') || "activos"}
          />
          <StatCard
            icon={Calendar}
            title={t('hostDashboard.bookingsTitle') || "Reservas"}
            value={stats.totalBookings}
            subtitle={t('hostDashboard.bookingsSubtitle') || "totales"}
            color="#F59E0B"
          />
          <StatCard
            icon={DollarSign}
            title={t('hostDashboard.revenueTitle') || "Ingresos"}
            value={`$${stats.totalRevenue.toFixed(0)}`}
            subtitle={t('hostDashboard.revenueSubtitle') || "confirmados"}
            color="#10B981"
          />
          <StatCard
            icon={Star}
            title={t('hostDashboard.ratingTitle') || "Calificación"}
            value={stats.averageRating.toFixed(1)}
            subtitle={t('hostDashboard.ratingSubtitle') || "promedio"}
            color="#8B5CF6"
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t('hostDashboard.quickActionsTitle') || 'Acciones Rápidas'}</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(host)/accommodations')}
          >
            <View style={styles.actionIcon}>
              <Home size={20} color="#4ADE80" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('hostDashboard.manageAccommodationsTitle') || 'Gestionar Alojamientos'}</Text>
              <Text style={styles.actionSubtitle}>{t('hostDashboard.manageAccommodationsSubtitle') || 'Agregar, editar o desactivar propiedades'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(host)/bike')}
          >
            <View style={styles.actionIcon}>
              <Bike size={20} color="#4ADE80" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('hostDashboard.manageBikesTitle') || 'Gestionar Bicicletas'}</Text>
              <Text style={styles.actionSubtitle}>{t('hostDashboard.manageBikesSubtitle') || 'Administrar tu flota de bicicletas'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(host)/bookings')}
          >
            <View style={styles.actionIcon}>
              <Calendar size={20} color="#4ADE80" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('hostDashboard.viewBookingsTitle') || 'Ver Reservas'}</Text>
              <Text style={styles.actionSubtitle}>{t('hostDashboard.viewBookingsSubtitle') || 'Revisar y gestionar reservas pendientes'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/')}
          >
            <View style={styles.actionIcon}>
              <History size={20} color="#4ADE80" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t('hostDashboard.viewRentalHistory') || 'Ver Historial de Alquileres'}</Text>
              <Text style={styles.actionSubtitle}>{t('hostDashboard.rentalHistorySubtitle') || 'Revisa todas tus transacciones pasadas'}</Text>
            </View>
          </TouchableOpacity>
          {stats.unreadMessages > 0 && (
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/chat')}
            >
              <View style={styles.actionIcon}>
                <MessageCircle size={20} color="#EF4444" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{t('hostDashboard.messagesTitle') || 'Mensajes'}</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.unreadMessages} {t('hostDashboard.unreadMessages') || 'mensajes sin leer'}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.unreadMessages}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>{t('hostDashboard.recentActivityTitle') || 'Actividad Reciente'}</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>{t('hostDashboard.newBookingReceived') || 'Nueva reserva recibida'}</Text>
            <Text style={styles.activityTime}>{t('hostDashboard.twoHoursAgo') || 'Hace 2 horas'}</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>{t('hostDashboard.fiveStarReview') || 'Reseña de 5 estrellas'}</Text>
            <Text style={styles.activityTime}>{t('hostDashboard.yesterday') || 'Ayer'}</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityTitle}>{t('hostDashboard.paymentProcessed') || 'Pago procesado'}</Text>
            <Text style={styles.activityTime}>{t('hostDashboard.threeDaysAgo') || 'Hace 3 días'}</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutButton: {
    padding: 4,
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