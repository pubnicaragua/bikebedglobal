import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DollarSign, ArrowLeft, Calendar, User, Home, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface FinancialStats {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  totalBookingsCount: number;
  paidBookingsCount: number;
  pendingBookingsCount: number;
  refundedBookingsCount: number;
}

interface BookingDetail {
  id: string;
  userName: string;
  accommodationName: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function FinancialReportsScreen() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    refundedRevenue: 0,
    totalBookingsCount: 0,
    paidBookingsCount: 0,
    pendingBookingsCount: 0,
    refundedBookingsCount: 0,
  });
  const [bookingDetails, setBookingDetails] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    } else {
      setLoading(false);
      // router.replace('/auth');
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, profiles(first_name, last_name), accommodations(name)'); 

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      if (!bookings || bookings.length === 0) {
        setStats({
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          refundedRevenue: 0,
          totalBookingsCount: 0,
          paidBookingsCount: 0,
          pendingBookingsCount: 0,
          refundedBookingsCount: 0,
        });
        setBookingDetails([]);
        return;
      }

      let totalRevenue = 0;
      let paidRevenue = 0;
      let pendingRevenue = 0;
      let refundedRevenue = 0;
      let totalBookingsCount = bookings?.length || 0;
      let paidBookingsCount = 0;
      let pendingBookingsCount = 0;
      let refundedBookingsCount = 0;

      const detailedBookings: BookingDetail[] = bookings?.map((booking: any) => {
        const price = parseFloat(booking.total_price);
        totalRevenue += price;

        switch (booking.payment_status) {
          case 'paid':
            paidRevenue += price;
            paidBookingsCount++;
            break;
          case 'pending':
            pendingRevenue += price;
            pendingBookingsCount++;
            break;
          case 'refunded':
            refundedRevenue += price;
            refundedBookingsCount++;
            break;
          default:
            break;
        }

        const userName = [booking.profiles?.first_name, booking.profiles?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          id: booking.id,
          userName: userName || 'Usuario Desconocido',
          accommodationName: booking.accommodations?.name || 'Alojamiento Desconocido', 
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          guests: booking.guests,
          total_price: price,
          status: booking.status,
          payment_status: booking.payment_status,
          created_at: booking.created_at,
        };
      }) || [];

      setStats({
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        refundedRevenue,
        totalBookingsCount,
        paidBookingsCount,
        pendingBookingsCount,
        refundedBookingsCount,
      });
      setBookingDetails(detailedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    } catch (error) {
      console.error('Unhandled error in fetchFinancialData:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = '#4ADE80' }: {
    icon: any;
    title: string;
    value: string | number;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  const BookingCard = ({ booking }: { booking: BookingDetail }) => {
    const getPaymentStatusColor = (status: string) => {
      switch (status) {
        case 'paid': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'refunded': return '#EF4444';
        default: return '#9CA3AF';
      }
    };

    const getBookingStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed': return '#3B82F6';
        case 'pending': return '#F59E0B';
        case 'cancelled': return '#EF4444';
        case 'completed': return '#10B981';
        default: return '#9CA3AF';
      }
    };

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingId}>Reserva ID: {booking.id.substring(0, 8)}...</Text>
          <Text style={styles.bookingDate}>{new Date(booking.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <User size={16} color="#9CA3AF" style={styles.detailIcon} />
          <Text style={styles.bookingDetailText}>Cliente: <Text style={styles.bookingDetailValue}>{booking.userName}</Text></Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Home size={16} color="#9CA3AF" style={styles.detailIcon} />
          <Text style={styles.bookingDetailText}>Alojamiento: <Text style={styles.bookingDetailValue}>{booking.accommodationName}</Text></Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Calendar size={16} color="#9CA3AF" style={styles.detailIcon} />
          <Text style={styles.bookingDetailText}>Fechas: <Text style={styles.bookingDetailValue}>{new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}</Text></Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Text style={styles.bookingDetailText}>Huéspedes: <Text style={styles.bookingDetailValue}>{booking.guests}</Text></Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Text style={styles.bookingDetailText}>Precio Total: <Text style={styles.bookingDetailValue}>${booking.total_price.toFixed(2)}</Text></Text>
        </View>
        <View style={styles.bookingStatusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(booking.payment_status) + '20' }]}>
            <Text style={[styles.statusText, { color: getPaymentStatusColor(booking.payment_status) }]}>Pago: {booking.payment_status}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getBookingStatusColor(booking.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getBookingStatusColor(booking.status) }]}>Estado: {booking.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Cargando reportes financieros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Reportes Financieros</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={DollarSign}
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            color="#10B981"
          />
          <StatCard
            icon={DollarSign}
            title="Ingresos Pagados"
            value={`$${stats.paidRevenue.toFixed(2)}`}
            color="#3B82F6"
          />
          <StatCard
            icon={DollarSign}
            title="Ingresos Pendientes"
            value={`$${stats.pendingRevenue.toFixed(2)}`}
            color="#F59E0B"
          />
          <StatCard
            icon={DollarSign}
            title="Ingresos Reembolsados"
            value={`$${stats.refundedRevenue.toFixed(2)}`}
            color="#EF4444"
          />
          <StatCard
            icon={Calendar}
            title="Total Reservas"
            value={stats.totalBookingsCount}
            color="#8B5CF6"
          />
          <StatCard
            icon={Calendar}
            title="Reservas Pagadas"
            value={stats.paidBookingsCount}
            color="#3B82F6"
          />
          <StatCard
            icon={Calendar}
            title="Reservas Pendientes"
            value={stats.pendingBookingsCount}
            color="#F59E0B"
          />
          <StatCard
            icon={Calendar}
            title="Reservas Reembolsadas"
            value={stats.refundedBookingsCount}
            color="#EF4444"
          />
        </View>

        <View style={styles.bookingListSection}>
          <Text style={styles.sectionTitle}>Detalle de Reservas</Text>
          {bookingDetails.length > 0 ? (
            bookingDetails.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <Text style={styles.noBookingsText}>No hay reservas para mostrar.</Text>
          )}
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
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
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
  bookingListSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  bookingId: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  bookingDetailText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  bookingDetailValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bookingStatusContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noBookingsText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  }
});
