import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterChip } from '../../src/components/ui/FilterChip';
import { Card } from '../../src/components/ui/Card';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';

const sampleAccommodations = [
  {
    id: '1',
    name: 'Apartamento en Machu Picchu',
    location: 'Cusco, Perú',
    price: '$100',
    rating: 4.0,
    reviewCount: 1,
    imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  },
  {
    id: '2',
    name: 'Casa Rural en los Andes',
    location: 'Cusco, Perú',
    price: '$85',
    rating: 4.5,
    reviewCount: 23,
    imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
  },
];

const sampleRoutes = [
  {
    id: '1',
    name: 'Tour Machu Picchu',
    location: 'Cusco, Perú',
    type: 'Ruta turística',
    rating: 4.0,
    reviewCount: 1,
    imageUrl: 'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg',
  },
  {
    id: '2',
    name: 'Camino del Inca',
    location: 'Cusco, Perú',
    type: 'Ruta de aventura',
    rating: 4.8,
    reviewCount: 156,
    imageUrl: 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg',
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { t } = useI18n();

  const filters = [
    { key: 'all', label: t('home.filters.all') },
    { key: 'nearby', label: t('home.filters.nearby') },
    { key: 'popular', label: t('home.filters.popular') },
    { key: 'beach', label: t('home.filters.beach') },
    { key: 'cheap', label: t('home.filters.cheap') },
    { key: 'expensive', label: t('home.filters.expensive') },
  ];

  const handleLocationPress = () => {
    // Handle location picker
    console.log('Location picker pressed');
  };

  const handleAccommodationPress = (accommodation: any) => {
    router.push(`/accommodation/${accommodation.id}`);
  };

  const handleRoutePress = (route: any) => {
    router.push(`/route/${route.id}`);
  };

  const renderAccommodationCard = ({ item }: { item: any }) => (
    <Card
      imageUrl={item.imageUrl}
      title={item.name}
      subtitle={item.location}
      price={`${item.price}/${t('accommodation.perNight')}`}
      rating={item.rating}
      reviewCount={item.reviewCount}
      onPress={() => handleAccommodationPress(item)}
      onFavoritePress={() => console.log('Favorite pressed')}
      style={styles.card}
    />
  );

  const renderRouteCard = ({ item }: { item: any }) => (
    <Card
      imageUrl={item.imageUrl}
      title={item.name}
      subtitle={item.location}
      rating={item.rating}
      reviewCount={item.reviewCount}
      onPress={() => handleRoutePress(item)}
      onFavoritePress={() => console.log('Favorite pressed')}
      style={styles.card}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('home.search')}
            onLocationPress={handleLocationPress}
          />
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('home.sections.recommended')}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>
                {t('home.sections.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sampleAccommodations}
            renderItem={renderAccommodationCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('home.sections.routes')}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>
                {t('home.sections.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sampleRoutes}
            renderItem={renderRouteCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('home.sections.services')}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>
                {t('home.sections.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sampleAccommodations.slice(0, 1)}
            renderItem={renderAccommodationCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
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
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  card: {
    width: 280,
    marginRight: 16,
  },
});