import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Bell, BellOff, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '.../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Definición de tipos para la navegación
type RootStackParamList = {
  Notifications: undefined;
};

// Tipo para las props del componente
type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

// Tipo para las notificaciones
type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
};

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedNotifications = data.map((notification: { id: any; title: any; message: any; created_at: string; is_read: any; notification_type: string; }) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          time: formatTime(notification.created_at),
          read: notification.is_read,
          icon: getIconType(notification.notification_type)
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching notifications:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    } else {
      return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
    }
  };

  const getIconType = (notificationType: string): string => {
    switch (notificationType) {
      case 'message':
        return 'Bell';
      case 'system':
        return 'BellOff';
      case 'booking':
      case 'confirmation':
        return 'CheckCircle2';
      default:
        return 'Bell';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error marking notification as read:', error.message);
      }
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bell':
        return <Bell size={20} color="#60A5FA" />;
      case 'BellOff':
        return <BellOff size={20} color="#F87171" />;
      case 'CheckCircle2':
        return <CheckCircle2 size={20} color="#34D399" />;
      default:
        return <Bell size={20} color="#60A5FA" />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      {/* Lista de notificaciones */}
      <ScrollView style={styles.notificationsContainer}>
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.notificationCard,
                !item.read && styles.unreadNotification
              ]}
              onPress={() => markAsRead(item.id)}
            >
              <View style={styles.iconContainer}>
                {renderIcon(item.icon)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationsContainer: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  notificationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});

export default NotificationsScreen;