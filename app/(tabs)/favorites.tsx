import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '../../src/components/ui/FilterChip';
import { Card } from '../../src/components/ui/Card';
import { useI18n } from '../../src/hooks/useI18n';

const sampleFavorites = [
  {
    title: 'Guardado este mes',
    data: [
      {
        id: '1',
        name: 'Apartamento en Machu Picchu',
        location: 'Cusco, Perú',
        rating: 4.0,
        reviewCount: 1,
        imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
        savedAt: '2024-01-15',
      },
    ],
  },
  {
    title: 'Guardado en mayo',
    data: [
      {
        id: '2',
        name: 'Apartamento en Machu Picchu',
        location: 'Cusco, Perú',
        rating: 4.0,
        reviewCount: 1,
        imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
        savedAt: '2024-05-20',
      },
      {
        id: '3',
        name: 'Casa Rural en los Andes',
        location: 'Cusco, Perú',
        rating: 4.5,
        reviewCount: 23,
        imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
        savedAt: '2024-05-18',
      },
    ],
  },
  {
    title: 'Guardado en abril',
    data: [
      {
        id: '4',
        name: 'Apartamento en Machu Picchu',
        location: 'Cusco, Perú',
        rating: 4.0,
        reviewCount: 1,
        imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
        savedAt: '2024-04-25',
      },
      {
        id: '5',
        name: 'Apartamento en Machu Picchu',
        location: 'Cusco, Perú',
        rating: 4.0,
        reviewCount: 1,
        imageUrl: 'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
        savedAt: '2024-04-12',
      },
    ],
  },
];

export default function FavoritesScreen() {
  const [selectedTab, setSelectedTab] = useState('accommodations');
  const { t } = useI18n();

  const tabs = [
    { key: 'accommodations', label: t('favorites.tabs.accommodations') },
    { key: 'routes', label: t('favorites.tabs.routes') },
    { key: 'bikes', label: t('favorites.tabs.bikes') },
  ];

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderFavoriteItem = ({ item }: { item: any }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteHeader}>
        <View style={styles.savedIndicator}>
          <Text style={styles.savedText}>Guardado</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>⋮</Text>
        </TouchableOpacity>
      </View>
      <Card
        imageUrl={item.imageUrl}
        title={item.name}
        subtitle={item.location}
        rating={item.rating}
        reviewCount={item.reviewCount}
        onPress={() => console.log('Navigate to detail')}
        style={styles.card}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <FilterChip
              key={tab.key}
              label={tab.label}
              selected={selectedTab === tab.key}
              onPress={() => setSelectedTab(tab.key)}
              style={styles.tab}
            />
          ))}
        </View>
      </View>

      <SectionList
        sections={sampleFavorites}
        renderItem={renderFavoriteItem}
        renderSectionHeader={renderSectionHeader}
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
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    marginRight: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  favoriteItem: {
    marginBottom: 16,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedIndicator: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  menuText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 0,
  },
});