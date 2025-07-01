import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../src/hooks/useI18n';

const sampleBookings = [
  {
    id: '1',
    name: 'Apartamento en Machu Picchu',
    checkIn: '27',
    checkOut: '31',
    month: 'junio',
    status: 'confirmed',
    imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  },
  {
    id: '2',
    name: 'Apartamento en Machu Picchu',
    checkIn: '27',
    checkOut: '31',
    month: 'junio',
    status: 'confirmed',
    imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  },
  {
    id: '3',
    name: 'Apartamento en Machu Picchu',
    checkIn: '27',
    checkOut: '31',
    month: 'junio',
    status: 'confirmed',
    imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  },
];

export default function BookingsScreen() {
  const { t } = useI18n();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4ADE80';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status: string) => {
    return t(`bookings.status.${status}`);
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bookingItem}
      onPress={() => router.push(`/booking/${item.id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.bookingImage} />
      <View style={styles.bookingContent}>
        <View style={styles.bookingHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bookingTitle}>{item.name}</Text>
        <Text style={styles.bookingDates}>
          {t('bookings.reservedFrom')} {item.checkIn} al {item.checkOut} de {item.month}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
      </View>

      <FlatList
        data={sampleBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        style={styles.content}
        showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookingImage: {
    width: 80,
    height: 80,
    backgroundColor: '#374151',
  },
  bookingContent: {
    flex: 1,
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
  menuButton: {
    padding: 4,
  },
  menuText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingDates: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});