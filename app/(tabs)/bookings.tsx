import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import EditBookingModal from '../../src/components/ui/EditBookingModal';
import CancelBookingModal from '../../src/components/ui/CancelBookingModal';

interface Booking {
  id: string;
  user_id: string;
  accommodation_id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  payment_status: string;
  special_requests?: string;
  created_at: string;
  accommodation: {
    name: string;
    image_url: string;
  };
}

export default function BookingsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          accommodation_id,
          check_in_date,
          check_out_date,
          guests,
          total_price,
          status,
          payment_status,
          special_requests,
          created_at,
          accommodations (
            name,
            accommodation_images (
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('check_in_date', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedBookings = data?.map((booking: any) => ({
        ...booking,
        accommodation: {
          name: booking.accommodations?.name || t('bookings.unknownAccommodation'),
          image_url: booking.accommodations?.accommodation_images[0]?.image_url || 'https://via.placeholder.com/150'
        }
      })) || [];

      setBookings(processedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(t('bookings.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleBookingUpdated = () => {
    fetchBookings();
    setEditingBooking(null);
  };

  const handleBookingCanceled = () => {
    fetchBookings();
    setCancelingBooking(null);
  };

const handlePayBooking = (bookingId: string) => {
  router.push({
    pathname: '/Payment/payment',
    params: { id: bookingId }
  });
};

  const formatDate = (dateString: string) => {
    const months = [
      t('months.january'), t('months.february'), t('months.march'),
      t('months.april'), t('months.may'), t('months.june'),
      t('months.july'), t('months.august'), t('months.september'),
      t('months.october'), t('months.november'), t('months.december')
    ];
    
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()] || '',
      year: date.getFullYear().toString()
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4ADE80';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const checkIn = formatDate(item.check_in_date);
    const checkOut = formatDate(item.check_out_date);
    
    return (
      <View style={styles.bookingItem}>
        <TouchableOpacity onPress={() => router.push(`/`)}>
          <Image 
            source={{ uri: item.accommodation.image_url }} 
            style={styles.bookingImage} 
          />
          <View style={styles.bookingContent}>
            <View style={styles.bookingHeader}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{t(`bookings.status.${item.status}`)}</Text>
              </View>
              <View style={styles.paymentStatus}>
                <Text style={[styles.paymentStatusText, { 
                  color: item.payment_status === 'paid' ? '#4ADE80' : '#F59E0B'
                }]}>
                  {t(`bookings.paymentStatus.${item.payment_status.toLowerCase()}`)}
                </Text>
              </View>
            </View>
            <Text style={styles.bookingTitle}>{item.accommodation.name}</Text>
            <Text style={styles.bookingDates}>
              {t('bookings.reservedFrom')} {checkIn.day} al {checkOut.day} de {checkIn.month} {checkIn.year}
            </Text>
            <View style={styles.bookingDetails}>
              <Text style={styles.detailText}>
                {t('bookings.guests')}: {item.guests}
              </Text>
              <Text style={styles.detailText}>
                {t('bookings.total')}: ${item.total_price.toFixed(2)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setEditingBooking(item)}
          >
            <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setCancelingBooking(item)}
          >
            <Text style={styles.actionButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          
          {item.payment_status !== 'paid' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.payButton]}
              onPress={() => handlePayBooking(item.id)}
            >
              <Text style={styles.actionButtonText}>{t('common.pay')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>{t('bookings.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchBookings}
          >
            <Text style={styles.retryButtonText}>{t('bookings.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
      </View>

      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchBookings}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('bookings.empty')}</Text>
        </View>
      )}

      {/* Modales */}
      <EditBookingModal
        visible={!!editingBooking}
        booking={editingBooking}
        onClose={() => setEditingBooking(null)}
        onSuccess={handleBookingUpdated}
      />

      <CancelBookingModal
        visible={!!cancelingBooking}
        booking={cancelingBooking}
        onClose={() => setCancelingBooking(null)}
        onSuccess={handleBookingCanceled}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bookingItem: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#374151',
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  paymentStatus: {
    padding: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingDates: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  payButton: {
    backgroundColor: '#10B981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});