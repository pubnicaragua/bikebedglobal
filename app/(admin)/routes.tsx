import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Map, Plus, Search, Filter, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface Route {
  id: string;
  name: string;
  distance: number;
  difficulty: string;
  is_active: boolean;
  created_at: string;
}

export default function RoutesManagementScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      fetchRoutes();
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={styles.routeCard}
      onPress={() => router.push(`/(admin)/routes`)}
    >
      <View style={styles.routeIcon}>
        <Map size={20} color="#8B5CF6" />
      </View>
      <View style={styles.routeInfo}>
        <Text style={styles.routeName}>{item.name}</Text>
        <View style={styles.routeMeta}>
          <Text style={styles.routeMetaText}>{item.distance} km</Text>
          <Text style={[styles.routeMetaText, styles.routeDifficulty]}>{item.difficulty}</Text>
          <Text style={[styles.routeMetaText, styles.routeStatus]}>
            {item.is_active ? 'Activa' : 'Inactiva'}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gestión de Rutas</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(admin)/routes')}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar rutas..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {routes.filter(r => r.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {routes.filter(r => !r.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Inactivas</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Todas las rutas</Text>
        
        {filteredRoutes.length > 0 ? (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.routesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Map size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No se encontraron rutas</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Prueba con otro término de búsqueda' : 'Crea tu primera ruta'}
            </Text>
          </View>
        )}
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
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#1F2937',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  routesList: {
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  routeMetaText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  routeDifficulty: {
    textTransform: 'capitalize',
  },
  routeStatus: {
    color: '#10B981',
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});