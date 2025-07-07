import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, BellOff, ChevronRight, Globe, Mail, Calendar, CreditCard, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'expo-router';

type Notification = {
  id: string;
  user_id: string | null; // Será null para notificaciones globales
  title: string;
  message: string;
  time: string; // Campo formateado para UI
  is_read: boolean;
  notification_type: 'system' | 'booking' | 'message' | 'payment' | 'alert' | 'global';
  is_global: boolean; // Indica si viene de global_notifications
  created_at: string;
  related_id?: string;
  target_roles?: string[]; // Solo para notificaciones globales
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      // Opcional: Si el usuario no está autenticado, puedes limpiar las notificaciones
      // o mostrar un mensaje para iniciar sesión.
      setNotifications([]);
      setLoading(false);
    }
  }, [user, filter]);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener notificaciones individuales para el usuario
      let userNotificationsQuery = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);

      if (filter === 'unread') {
        userNotificationsQuery = userNotificationsQuery.eq('is_read', false);
      }

      const { data: userNotifications, error: userError } = await userNotificationsQuery;
      if (userError) throw userError;

      // 2. Obtener notificaciones globales
      let globalNotificationsQuery = supabase
        .from('global_notifications') // Tu nueva tabla para notificaciones globales
        .select('*');

      const { data: globalNotifications, error: globalError } = await globalNotificationsQuery;
      if (globalError) throw globalError;

      // 3. Combinar y procesar las notificaciones
      let combinedNotifications: Notification[] = [];

      if (userNotifications) {
        const formattedUserNotifications: Notification[] = userNotifications.map((notif: any) => ({
          ...notif,
          time: formatTime(notif.created_at),
          is_global: false, // Explicitamente marcadas como no globales
        }));
        combinedNotifications = combinedNotifications.concat(formattedUserNotifications);
      }

      if (globalNotifications) {

        const formattedGlobalNotifications: Notification[] = globalNotifications.map((notif: any) => ({
          ...notif,
          time: formatTime(notif.created_at),
          user_id: null, 
          is_global: true, // Explicitamente marcadas como globales
          notification_type: notif.notification_type || 'global', // Asegura un tipo, default a 'global'
        }));
        combinedNotifications = combinedNotifications.concat(formattedGlobalNotifications);
      }

      // 4. Ordenar y establecer notificaciones
      combinedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const finalNotifications = filter === 'unread'
        ? combinedNotifications.filter(n => !n.is_read)
        : combinedNotifications;

      setNotifications(finalNotifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const markAsRead = async (id: string, isGlobal: boolean) => {
    try {
      if (isGlobal) {
        console.warn('Marking global notification as read is a local client-side action unless a user-specific read-tracking table exists.');
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
      }
      
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Marcar notificaciones individuales como leídas
      const unreadUserNotifications = notifications
        .filter(n => !n.is_read && !n.is_global)
        .map(n => n.id);

      if (unreadUserNotifications.length > 0) {
        const { error: userUpdateError } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadUserNotifications)
          .eq('user_id', user.id); // Asegúrate de actualizar solo las del usuario
        if (userUpdateError) throw userUpdateError;
      }

      const unreadGlobalNotifications = notifications
        .filter(n => !n.is_read && n.is_global)
        .map(n => n.id);
      
      if (unreadGlobalNotifications.length > 0) {
         console.warn('Marking all global notifications as read is a client-side action unless a user-specific read-tracking table exists.');
      }
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const renderNotificationIcon = (type: string, isGlobal: boolean) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={20} color={isGlobal ? "#F59E0B" : "#EF4444"} />; // Color de alerta o de global
      case 'booking':
        return <Calendar size={20} color={isGlobal ? "#F59E0B" : "#4ADE80"} />;
      case 'message':
        return <Mail size={20} color={isGlobal ? "#F59E0B" : "#3B82F6"} />;
      case 'payment':
        return <CreditCard size={20} color={isGlobal ? "#F59E0B" : "#F59E0B"} />;
      case 'global': // Este caso podría ser redundante si el tipo ya viene de la global_notification.type
        return <Globe size={20} color="#F59E0B" />;
      default: // System u otros
        return <Bell size={20} color={isGlobal ? "#F59E0B" : "#9CA3AF"} />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      // Pasa isGlobal al markAsRead
      markAsRead(notification.id, notification.is_global);
    }
    
    // Navegación basada en el tipo y related_id
    if (notification.related_id) {
      switch (notification.notification_type) {
        case 'booking':
          // router.push(`/bookings/${notification.related_id}`); // Ejemplo
          router.push(`/`); // Manteniendo la redirección actual por ahora
          break;
        case 'message':
          router.push(`/`);
          break;
        case 'payment':
          // router.push(`/payments/${notification.related_id}`); // Ejemplo
          router.push(`/`); // Manteniendo la redirección actual por ahora
          break;
        default:
          router.push(`/`);
      }
    } else {
      router.push(`/`); // Por defecto, si no hay related_id
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const hasUnreadNotifications = notifications.some(n => !n.is_read);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerActions}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
              onPress={() => setFilter('all')}
            >
              <Text style={styles.filterText}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'unread' && styles.activeFilter]}
              onPress={() => setFilter('unread')}
            >
              <Text style={styles.filterText}>No leídas</Text>
            </TouchableOpacity>
          </View>
          {hasUnreadNotifications && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Marcar todas como leídas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellOff size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No hay notificaciones</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4ADE80']}
            />
          }
        >
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.notificationItem,
                !item.is_read && styles.unreadNotification, // Estilo para no leídas (borde izquierdo verde)
                item.is_global && styles.globalNotification, // Estilo para globales (borde izquierdo naranja)
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={styles.notificationIcon}>
                {renderNotificationIcon(item.notification_type, item.is_global)}
                {item.is_global && (
                  <View style={styles.globalBadge}>
                    <Globe size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  {item.is_global && (
                    <Text style={styles.globalTag}>Global</Text>
                  )}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'column',
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  activeFilter: {
    backgroundColor: '#4ADE80',
  },
  filterText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  markAllText: {
    color: '#4ADE80',
    fontSize: 14,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
  },
  listContainer: {
    paddingBottom: 32,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  unreadNotification: {
    backgroundColor: '#111827',
    borderLeftWidth: 4,
    borderLeftColor: '#4ADE80',
  },
  globalNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Naranja para notificaciones globales
  },
  notificationIcon: {
    marginRight: 16,
    position: 'relative',
  },
  globalBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  globalTag: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1F2937',
    borderRadius: 4,
  },
  notificationMessage: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  notificationTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
});

export default NotificationsScreen;