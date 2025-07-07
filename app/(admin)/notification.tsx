import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BellOff,
  Check,
  X,
  Filter,
  ChevronRight,
  Clock,
  AlertCircle,
  Info,
  Plus,
} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import NotificationModal from '../../src/components/ui/CreateNotificationModal';

interface Notification {
  id: string;
  notification_type: 'system' | 'booking' | 'message' | 'payment' | 'alert';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [isGlobalNotification, setIsGlobalNotification] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [user, filter]);

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    // Implement navigation based on notification type
    switch (notification.notification_type) {
      case 'booking':
        router.push(`/`);
        break;
      case 'message':
        router.push(`/`);
        break;
      case 'payment':
        router.push(`/`);
        break;
      default:
        router.push(`/`);
    }
  };

  // Handle notification submission
  const handleNotificationSubmit = async (notificationData: any) => {
    try {
      if (isGlobalNotification) {
        // Insert into global_notifications
        const { error } = await supabase
          .from('global_notifications')
          .insert(notificationData);

        if (error) throw error;
      } else {
        // Insert into notifications
        const { data, error } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select();

        if (error) throw error;

        if (data) {
          setNotifications(prev => [data[0], ...prev]);
        }
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Render notification icon based on type
  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'booking':
        return <Check size={20} color="#4ADE80" />;
      case 'message':
        return <Info size={20} color="#3B82F6" />;
      case 'payment':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#9CA3AF" />;
    }
  };

  // Render notification item
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        {renderNotificationIcon(item.notification_type)}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setIsGlobalNotification(false);
                setModalVisible(true);
              }}
            >
              <Plus size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setIsGlobalNotification(true);
                setModalVisible(true);
              }}
            >
              <Plus size={24} color="#4ADE80" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilter,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={styles.filterText}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'unread' && styles.activeFilter,
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text style={styles.filterText}>No leídas</Text>
          </TouchableOpacity>
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
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4ADE80']}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      <NotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleNotificationSubmit}
        isGlobal={isGlobalNotification}
      />
    </SafeAreaView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
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
  notificationIcon: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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