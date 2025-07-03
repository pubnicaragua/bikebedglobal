import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '../../src/components/ui/FilterChip';
import { Card } from '../../src/components/ui/Card';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';

type FavoriteItem = {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  savedAt: string;
};

type FavoriteSection = {
  title: string;
  data: FavoriteItem[];
};

const FavoriteItemComponent = ({ item, onRemove }: { item: FavoriteItem, onRemove: (id: string) => void }) => {
  const { t } = useI18n();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `${item.name} - ${item.location}\n\n${t('favorites.shareMessage')}`,
        title: item.name,
      });
    } catch (error) {
      Alert.alert(t('favorites.shareError'));
    }
  };

  const handleRemoveFavorite = () => {
    setMenuVisible(false);
    Alert.alert(
      t('favorites.confirmRemoveTitle'),
      t('favorites.confirmRemoveMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => onRemove(item.id),
        },
      ]
    );
  };

  const showMenu = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX - 100, y: pageY + 20 });
    setMenuVisible(true);
  };

  return (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteHeader}>
        <View style={styles.savedIndicator}>
          <Text style={styles.savedText}>{t('favorites.saved')}</Text>
        </View>
        
        <TouchableOpacity onPress={showMenu} style={styles.menuButton}>
          <Text style={styles.menuText}>⋮</Text>
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.menuOverlay} 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
              <TouchableOpacity onPress={handleShare} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>{t('favorites.share')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRemoveFavorite} style={styles.menuOption}>
                <Text style={styles.removeOptionText}>{t('favorites.removeFavorite')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      
      <Card
        imageUrl={item.imageUrl}
        title={item.name}
        subtitle={item.location}
        rating={item.rating}
        reviewCount={item.reviewCount}
        style={styles.card}
      />
    </View>
  );
};

export default function FavoritesScreen() {
  const [selectedTab, setSelectedTab] = useState<'accommodations' | 'routes' | 'bikes'>('accommodations');
  const [favorites, setFavorites] = useState<FavoriteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { user } = useAuth();

  const tabs = [
    { key: 'accommodations', label: t('favorites.tabs.accommodations') },
    { key: 'routes', label: t('favorites.tabs.routes') },
    { key: 'bikes', label: t('favorites.tabs.bikes') },
  ];

  useEffect(() => {
    if (!user?.id) return;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        
        if (selectedTab === 'accommodations') {
          await fetchFavoriteAccommodations();
        } else if (selectedTab === 'routes') {
          await fetchFavoriteRoutes();
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [selectedTab, user?.id]);

  const fetchFavoriteAccommodations = async () => {
    const { data, error } = await supabase
      .from('favorite_accommodations')
      .select(`
        created_at,
        accommodations:accommodation_id (
          id,
          name,
          location,
          accommodation_images (
            image_url,
            is_primary
          ),
          accommodation_reviews (
            rating
          )
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const processedData = (data as any[]).map(item => ({
      id: item.accommodations.id,
      name: item.accommodations.name,
      location: item.accommodations.location,
      rating: calculateAverageRating(item.accommodations.accommodation_reviews),
      reviewCount: item.accommodations.accommodation_reviews?.length || 0,
      imageUrl: getPrimaryImage(item.accommodations.accommodation_images),
      savedAt: item.created_at
    }));

    setFavorites(groupByMonth(processedData));
  };

  const fetchFavoriteRoutes = async () => {
    const { data, error } = await supabase
      .from('favorite_routes')
      .select(`
        created_at,
        routes:route_id (
          id,
          name,
          start_location,
          route_images (
            image_url,
            is_primary
          ),
          route_reviews (
            rating
          )
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const processedData = (data as any[]).map(item => ({
      id: item.routes.id,
      name: item.routes.name,
      location: item.routes.start_location,
      rating: calculateAverageRating(item.routes.route_reviews),
      reviewCount: item.routes.route_reviews?.length || 0,
      imageUrl: getPrimaryImage(item.routes.route_images),
      savedAt: item.created_at
    }));

    setFavorites(groupByMonth(processedData));
  };

  const calculateAverageRating = (reviews: { rating: number }[] | null): number => {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const getPrimaryImage = (images: { image_url: string; is_primary: boolean }[] | null): string => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/300';
    const primary = images.find(img => img.is_primary);
    return primary?.image_url || images[0].image_url;
  };

  const groupByMonth = (items: FavoriteItem[]): FavoriteSection[] => {
    const months = [
      t('favorites.months.january'), 
      t('favorites.months.february'), 
      t('favorites.months.march'),
      t('favorites.months.april'), 
      t('favorites.months.may'), 
      t('favorites.months.june'),
      t('favorites.months.july'), 
      t('favorites.months.august'), 
      t('favorites.months.september'),
      t('favorites.months.october'), 
      t('favorites.months.november'), 
      t('favorites.months.december')
    ];

    const grouped: Record<string, FavoriteItem[]> = {};

    items.forEach(item => {
      const date = new Date(item.savedAt);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(item);
    });

    return Object.entries(grouped).map(([monthYear, data]) => ({
      title: `${t('favorites.savedIn')} ${monthYear}`,
      data
    }));
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      if (selectedTab === 'accommodations') {
        const { error } = await supabase
          .from('favorite_accommodations')
          .delete()
          .eq('user_id', user?.id)
          .eq('accommodation_id', id);

        if (error) throw error;
      } else if (selectedTab === 'routes') {
        const { error } = await supabase
          .from('favorite_routes')
          .delete()
          .eq('user_id', user?.id)
          .eq('route_id', id);

        if (error) throw error;
      }

      setFavorites(prev => 
        prev.map(section => ({
          ...section,
          data: section.data.filter(item => item.id !== id)
        })).filter(section => section.data.length > 0)
      );
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert(t('favorites.removeError'));
    }
  };

  const renderSectionHeader = ({ section }: { section: FavoriteSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <FavoriteItemComponent 
      item={item} 
      onRemove={handleRemoveFavorite} 
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {t(`favorites.empty.${selectedTab}`)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
        </View>
      </SafeAreaView>
    );
  }

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
              onPress={() => setSelectedTab(tab.key as any)}
              style={styles.tab}
            />
          ))}
        </View>
      </View>

      <SectionList
        sections={favorites}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{ flexGrow: 1 }}
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
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  card: {
    marginBottom: 0,
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
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeOptionText: {
    color: '#EF4444',
    fontSize: 14,
  },
});