import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Search } from 'lucide-react-native';
import { FilterChip } from '../../src/components/ui/FilterChip';
import { Card } from '../../src/components/ui/Card';
import { useI18n } from '../../src/hooks/useI18n';

const { width, height } = Dimensions.get('window');

const sampleMarkers = [
  {
    id: '1',
    latitude: -13.1631,
    longitude: -72.545,
    title: 'Apartamento en Machu Picchu',
    subtitle: 'Cusco, Perú',
    price: '$250',
    rating: 5.0,
    type: 'accommodation',
    imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  },
  {
    id: '2',
    latitude: -13.1631,
    longitude: -72.55,
    title: 'Casa Rural en los Andes',
    subtitle: 'Cusco, Perú',
    price: '$200',
    rating: 4.0,
    type: 'accommodation',
    imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
  },
];

export default function ExploreScreen() {
  const [selectedFilter, setSelectedFilter] = useState('accommodations');
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const { t } = useI18n();

  const filters = [
    { key: 'accommodations', label: t('explore.filters.accommodations') },
    { key: 'bikes', label: t('explore.filters.bikes') },
    { key: 'routes', label: t('explore.filters.routes') },
    { key: 'all', label: t('explore.filters.all') },
  ];

  const mapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#212121' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#000000' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: '#2c2c2c' }],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>{t('common.search')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -13.1631,
            longitude: -72.545,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          customMapStyle={mapStyle}
        >
          {sampleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() => setSelectedMarker(marker)}
            >
              <View style={styles.marker}>
                <Text style={styles.markerText}>{marker.rating}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {selectedMarker && (
          <View style={styles.selectedCardContainer}>
            <Card
              imageUrl={selectedMarker.imageUrl}
              title={selectedMarker.title}
              subtitle={selectedMarker.subtitle}
              price={`${selectedMarker.price}/${t('accommodation.perNight')}`}
              rating={selectedMarker.rating}
              onPress={() => console.log('View details')}
              style={styles.selectedCard}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchPlaceholder: {
    color: '#9CA3AF',
    fontSize: 16,
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  marker: {
    backgroundColor: '#4ADE80',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  selectedCard: {
    width: '100%',
    marginBottom: 0,
  },
});