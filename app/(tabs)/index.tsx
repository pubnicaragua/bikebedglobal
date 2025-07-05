import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterChip } from '../../src/components/ui/FilterChip';
import { Card } from '../../src/components/ui/Card';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';

type Accommodation = {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isFavorite: boolean;
  services: {
    wifi: boolean;
    kitchen: boolean;
    bikeStorage: boolean;
    bikeRental: boolean;
    bikeTools: boolean;
    laundry: boolean;
    parking: boolean;
  };
};

type Route = {
  id: string;
  name: string;
  location: string;
  type: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isFavorite: boolean;
  difficulty: string;
};

type Bike = {
  id: string;
  name: string;
  type: string;
  size: string;
  price: string;
  location: string;
  imageUrl: string;
  isFavorite: boolean;
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { user } = useAuth();

  const filters = [
    { key: 'all', label: t('home.filters.all') },
    { key: 'popular', label: t('home.filters.popular') },
    { key: 'cheap', label: t('home.filters.cheap') },
    { key: 'expensive', label: t('home.filters.expensive') },
    { key: 'beach', label: t('home.filters.beach') },
    { key: 'mountain', label: t('home.filters.mountain') },
    { key: 'easy', label: t('route.difficultyEasy') },
    { key: 'moderate', label: t('route.difficultyModerate') },
    { key: 'hard', label: t('route.difficultyHard') },
    { key: 'wifi', label: 'WiFi' },
    { key: 'kitchen', label: t('home.filters.kitchen') },
    { key: 'bikeStorage', label: t('home.filters.bikeStorage') },
    { key: 'bikeRental', label: t('home.filters.bikeRental') },
    { key: 'laundry', label: t('home.filters.laundry') },
    { key: 'parking', label: t('home.filters.parking') },
    { key: 'road', label: t('home.filters.road') },
    { key: 'hybrid', label: t('home.filters.hybrid') },
    { key: 'electric', label: t('home.filters.electric') },
  ];

  const filteredAccommodations = useMemo(() => {
    let result = [...accommodations];
    
    if (selectedFilter === 'all') return result;
    
    switch (selectedFilter) {
      case 'popular':
        return result.sort((a, b) => b.rating - a.rating);
      case 'cheap':
        return result.sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));
      case 'expensive':
        return result.sort((a, b) => parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', '')));
      case 'beach':
        return result.filter(acc => 
          acc.location.toLowerCase().includes('playa') || 
          acc.name.toLowerCase().includes('playa')
        );
      case 'mountain':
        return result.filter(acc => 
          acc.location.toLowerCase().includes('montaña') || 
          acc.name.toLowerCase().includes('montaña')
        );
      case 'wifi':
        return result.filter(acc => acc.services.wifi);
      case 'kitchen':
        return result.filter(acc => acc.services.kitchen);
      case 'bikeStorage':
        return result.filter(acc => acc.services.bikeStorage);
      case 'bikeRental':
        return result.filter(acc => acc.services.bikeRental);
      case 'laundry':
        return result.filter(acc => acc.services.laundry);
      case 'parking':
        return result.filter(acc => acc.services.parking);
      default:
        return result;
    }
  }, [accommodations, selectedFilter]);

  const filteredRoutes = useMemo(() => {
    let result = [...routes];
    
    if (selectedFilter === 'all') return result;
    
    switch (selectedFilter) {
      case 'popular':
        return result.sort((a, b) => b.rating - a.rating);
      case 'beach':
        return result.filter(route => 
          route.location.toLowerCase().includes('playa') || 
          route.name.toLowerCase().includes('playa')
        );
      case 'mountain':
        return result.filter(route => 
          route.location.toLowerCase().includes('montaña') || 
          route.name.toLowerCase().includes('montaña')
        );
      case 'easy':
        return result.filter(route => route.difficulty === 'easy');
      case 'moderate':
        return result.filter(route => route.difficulty === 'moderate');
      case 'hard':
        return result.filter(route => route.difficulty === 'hard');
      case 'road':
        return result.filter(route => route.difficulty === 'easy');
      default:
        return result;
    }
  }, [routes, selectedFilter]);

  const filteredBikes = useMemo(() => {
    let result = [...bikes];
    
    if (selectedFilter === 'all') return result;
    
    switch (selectedFilter) {
      case 'road':
        return result.filter(bike => bike.type.toLowerCase() === 'road');
      case 'hybrid':
        return result.filter(bike => bike.type.toLowerCase() === 'hybrid');
      case 'electric':
        return result.filter(bike => bike.type.toLowerCase() === 'electric');
      case 'bikeRental':
        return result;
      default:
        return result;
    }
  }, [bikes, selectedFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: accommodationsData, error: accommodationsError } = await supabase
          .from('accommodations')
          .select(`
            id,
            name,
            location,
            price_per_night,
            has_wifi,
            has_kitchen,
            has_bike_storage,
            has_bike_rental,
            has_laundry,
            has_parking,
            accommodation_images (
              image_url,
              is_primary
            ),
            accommodation_reviews (
              rating
            )
          `)
          .eq('is_active', true)
          .limit(10);

        if (accommodationsError) throw accommodationsError;

        const { data: favoriteAccommodations, error: favoritesError } = await supabase
          .from('favorite_accommodations')
          .select('accommodation_id')
          .eq('user_id', user?.id);

        if (favoritesError) throw favoritesError;

        const favoriteIds = favoriteAccommodations?.map(fav => fav.accommodation_id) || [];

        const processedAccommodations = (accommodationsData || []).map(acc => {
          const primaryImage = acc.accommodation_images?.find(img => img.is_primary) || 
                             acc.accommodation_images?.[0];
          const reviews = acc.accommodation_reviews || [];
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

          return {
            id: acc.id,
            name: acc.name,
            location: acc.location,
            price: `$${acc.price_per_night}`,
            rating: avgRating,
            reviewCount: reviews.length,
            imageUrl: primaryImage?.image_url || 'https://via.placeholder.com/300',
            isFavorite: favoriteIds.includes(acc.id),
            services: {
              wifi: acc.has_wifi,
              kitchen: acc.has_kitchen,
              bikeStorage: acc.has_bike_storage,
              bikeRental: acc.has_bike_rental,
              bikeTools: false,
              laundry: acc.has_laundry,
              parking: acc.has_parking
            }
          };
        });

        setAccommodations(processedAccommodations);

        const { data: routesData, error: routesError } = await supabase
          .from('routes')
          .select(`
            id,
            name,
            start_location,
            difficulty,
            route_images (
              image_url,
              is_primary
            ),
            route_reviews (
              rating
            )
          `)
          .eq('is_active', true)
          .limit(10);

        if (routesError) throw routesError;

        const { data: favoriteRoutes, error: favoriteRoutesError } = await supabase
          .from('favorite_routes')
          .select('route_id')
          .eq('user_id', user?.id);

        if (favoriteRoutesError) throw favoriteRoutesError;

        const favoriteRouteIds = favoriteRoutes?.map(fav => fav.route_id) || [];

        const processedRoutes = (routesData || []).map(route => {
          const primaryImage = route.route_images?.find(img => img.is_primary) || 
                             route.route_images?.[0];
          const reviews = route.route_reviews || [];
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

          return {
            id: route.id,
            name: route.name,
            location: route.start_location,
            type: t('route.touristRoute'),
            difficulty: route.difficulty,
            rating: avgRating,
            reviewCount: reviews.length,
            imageUrl: primaryImage?.image_url || 'https://via.placeholder.com/300',
            isFavorite: favoriteRouteIds.includes(route.id)
          };
        });

        setRoutes(processedRoutes);

        const { data: bikesData, error: bikesError } = await supabase
          .from('bike_rentals')
          .select(`
            id,
            bike_type,
            bike_size,
            price_per_day,
            is_available,
            accommodations (
              name,
              location
            )
          `)
          .eq('is_available', true)
          .limit(10);

        if (bikesError) throw bikesError;

        const { data: favoriteBikes, error: favoriteBikesError } = await supabase
          .from('favorite_bikes')
          .select('bike_id')
          .eq('user_id', user?.id);

        if (favoriteBikesError) throw favoriteBikesError;

        const favoriteBikeIds = favoriteBikes?.map(fav => fav.bike_id) || [];

        const processedBikes = (bikesData || []).map(bike => {
          const accommodation = bike.accommodations && bike.accommodations.length > 0 
            ? bike.accommodations[0] 
            : null;
          const location = accommodation?.location || t('common.unknownLocation');

          return {
            id: bike.id,
            name: `${bike.bike_type}`,
            type: bike.bike_type.toLowerCase(),
            size: bike.bike_size || t('bike.defaultSize'),
            price: `$${bike.price_per_day}/${t('common.perDay')}`,
            location: location,
            imageUrl: 'https://via.placeholder.com/300',
            isFavorite: favoriteBikeIds.includes(bike.id)
          };
        });

        setBikes(processedBikes);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, t]);

  const handleLocationPress = () => {
    console.log('Location picker pressed');
  };

  const handleAccommodationPress = (accommodation: Accommodation) => {
    router.push(`/accommodation/${accommodation.id}`);
  };

  const handleRoutePress = (route: Route) => {
    router.push(`/route/${route.id}`);
  };

  const handleBikePress = (bike: Bike) => {
    router.push(`/bike/${bike.id}`);
  };

  const toggleFavoriteAccommodation = async (accommodation: Accommodation) => {
    if (!user?.id) return;

    try {
      if (accommodation.isFavorite) {
        const { error } = await supabase
          .from('favorite_accommodations')
          .delete()
          .eq('user_id', user.id)
          .eq('accommodation_id', accommodation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_accommodations')
          .insert([
            { 
              user_id: user.id, 
              accommodation_id: accommodation.id 
            }
          ]);

        if (error) throw error;
      }

      setAccommodations(prev => prev.map(item => 
        item.id === accommodation.id 
          ? { ...item, isFavorite: !item.isFavorite } 
          : item
      ));

    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleFavoriteRoute = async (route: Route) => {
    if (!user?.id) return;

    try {
      if (route.isFavorite) {
        const { error } = await supabase
          .from('favorite_routes')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', route.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_routes')
          .insert([
            { 
              user_id: user.id, 
              route_id: route.id 
            }
          ]);

        if (error) throw error;
      }

      setRoutes(prev => prev.map(item => 
        item.id === route.id 
          ? { ...item, isFavorite: !item.isFavorite } 
          : item
      ));

    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleFavoriteBike = async (bike: Bike) => {
    if (!user?.id) return;

    try {
      if (bike.isFavorite) {
        const { error } = await supabase
          .from('favorite_bikes')
          .delete()
          .eq('user_id', user.id)
          .eq('bike_id', bike.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_bikes')
          .insert([
            { 
              user_id: user.id, 
              bike_id: bike.id 
            }
          ]);

        if (error) throw error;
      }

      setBikes(prev => prev.map(item => 
        item.id === bike.id 
          ? { ...item, isFavorite: !item.isFavorite } 
          : item
      ));

    } catch (error) {
      console.error('Error toggling bike favorite:', error);
    }
  };

  const renderAccommodationCard = ({ item }: { item: Accommodation }) => (
    <Card
      imageUrl={item.imageUrl}
      title={item.name}
      subtitle={item.location}
      price={`${item.price}/${t('accommodation.perNight')}`}
      rating={item.rating}
      reviewCount={item.reviewCount}
      onPress={() => handleAccommodationPress(item)}
      onFavoritePress={() => toggleFavoriteAccommodation(item)}
      isFavorite={item.isFavorite}
      style={styles.card}
    />
  );

const renderRouteCard = ({ item }: { item: Route }) => {
  // Primero obtenemos la dificultad formateada
  const difficultyKey = item.difficulty 
    ? `route.difficulty${item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}`
    : 'route.difficultyUnknown';
  
  // Luego creamos el subtítulo
  const subtitle = `${item.location} (${t(difficultyKey)})`;

  return (
    <Card
      imageUrl={item.imageUrl}
      title={item.name}
      subtitle={subtitle}
      rating={item.rating}
      reviewCount={item.reviewCount}
      onPress={() => handleRoutePress(item)}
      onFavoritePress={() => toggleFavoriteRoute(item)}
      isFavorite={item.isFavorite}
      style={styles.card}
    />
  );
};
  const renderBikeCard = ({ item }: { item: Bike }) => (
    <Card
      imageUrl={item.imageUrl}
      title={item.name}
      subtitle={`${item.type} - ${item.size}`}
      price={item.price}
      rating={0}
      reviewCount={0}
      onPress={() => handleBikePress(item)}
      onFavoritePress={() => toggleFavoriteBike(item)}
      isFavorite={item.isFavorite}
      style={styles.card}
    />
  );

  const renderEmptyComponent = (message: string) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('home.search')}
            onLocationPress={handleLocationPress}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>{t('home.filters.title')}</Text>
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
            data={filteredAccommodations}
            renderItem={renderAccommodationCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ListEmptyComponent={() => renderEmptyComponent(t('home.noAccommodations'))}
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
            data={filteredRoutes}
            renderItem={renderRouteCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ListEmptyComponent={() => renderEmptyComponent(t('home.noRoutes'))}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('home.sections.bikeRentals')}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>
                {t('home.sections.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredBikes}
            renderItem={renderBikeCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ListEmptyComponent={() => renderEmptyComponent(t('home.noBikesAvailable'))}
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
  filterSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
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
    minHeight: 200,
    gap: 16,
  },
  card: {
    width: 280,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  emptyContainer: {
    width: 280,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});