import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Map, Plus, Search, Filter, ChevronRight, MapPin, Clock, X, Save, Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

interface Route {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  distance: number;
  elevation_gain: number | null;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  estimated_time: number | null;
  start_location: string;
  end_location: string;
  is_loop: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewRouteForm {
  name: string;
  description: string;
  distance: string;
  elevation_gain: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  estimated_time: string;
  start_location: string;
  end_location: string;
  is_loop: boolean;
  is_verified: boolean;
  is_active: boolean;
}

interface SelectedImage {
  id: string;
  uri: string;
  type: string;
  name: string;
  size: number;
  is_primary: boolean;
}

export default function RoutesManagementScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();

  const [newRoute, setNewRoute] = useState<NewRouteForm>({
    name: '',
    description: '',
    distance: '',
    elevation_gain: '',
    difficulty: 'easy',
    estimated_time: '',
    start_location: '',
    end_location: '',
    is_loop: false,
    is_verified: false,
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchRoutes();
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener rutas:', error);
        throw error;
      }
      
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRouteDetail = (routeId: string) => {
    router.push({
      pathname: '/routes/[id]',
      params: { id: routeId }
    });
  };

  const resetForm = () => {
    setNewRoute({
      name: '',
      description: '',
      distance: '',
      elevation_gain: '',
      difficulty: 'easy',
      estimated_time: '',
      start_location: '',
      end_location: '',
      is_loop: false,
      is_verified: false,
      is_active: true,
    });
    setSelectedImages([]);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu galería para seleccionar imágenes de la ruta.'
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          size: asset.fileSize || 0,
          is_primary: selectedImages.length === 0 && index === 0,
        }));

        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error al seleccionar imágenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu cámara para tomar fotos de la ruta.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          id: `${Date.now()}`,
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          is_primary: selectedImages.length === 0,
        };

        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const removeImage = (imageId: string) => {
    setSelectedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      if (filtered.length > 0 && !filtered.some(img => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (imageId: string) => {
    setSelectedImages(prev => 
      prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
    );
  };

  const uploadImages = async (routeId: string): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];
    
    for (const image of selectedImages) {
      try {
        const base64 = await FileSystem.readAsStringAsync(image.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const arrayBuffer = decode(base64);
        const fileExt = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${routeId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('route-images')
          .upload(fileName, arrayBuffer, {
            contentType: `image/${fileExt}`,
            upsert: false
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('route-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
        
      } catch (error) {
        console.error('Error procesando imagen:', error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const createImageRecords = async (routeId: string, imageUrls: string[]) => {
    const imageRecords = imageUrls.map((url, index) => ({
      route_id: routeId,
      image_url: url,
      is_primary: index === 0,
    }));

    const { error } = await supabase
      .from('route_images')
      .insert(imageRecords);

    if (error) throw error;
  };

  const validateForm = (): boolean => {
    if (!newRoute.name.trim()) {
      Alert.alert('Error', 'El nombre de la ruta es obligatorio');
      return false;
    }
    if (!newRoute.description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return false;
    }
    if (!newRoute.distance.trim() || isNaN(Number(newRoute.distance)) || Number(newRoute.distance) <= 0) {
      Alert.alert('Error', 'La distancia debe ser un número válido mayor a 0');
      return false;
    }
    if (!newRoute.start_location.trim()) {
      Alert.alert('Error', 'La ubicación de inicio es obligatoria');
      return false;
    }
    if (!newRoute.end_location.trim()) {
      Alert.alert('Error', 'La ubicación de fin es obligatoria');
      return false;
    }
    if (newRoute.elevation_gain.trim() && isNaN(Number(newRoute.elevation_gain))) {
      Alert.alert('Error', 'La ganancia de elevación debe ser un número válido');
      return false;
    }
    if (newRoute.estimated_time.trim() && isNaN(Number(newRoute.estimated_time))) {
      Alert.alert('Error', 'El tiempo estimado debe ser un número válido (en minutos)');
      return false;
    }
    return true;
  };

  const createRoute = async () => {
    if (!validateForm() || !user) return;

    try {
      setCreatingRoute(true);
      
      const routeData = {
        creator_id: user.id,
        name: newRoute.name.trim(),
        description: newRoute.description.trim(),
        distance: Number(newRoute.distance),
        elevation_gain: newRoute.elevation_gain.trim() ? Number(newRoute.elevation_gain) : null,
        difficulty: newRoute.difficulty,
        estimated_time: newRoute.estimated_time.trim() ? Number(newRoute.estimated_time) : null,
        start_location: newRoute.start_location.trim(),
        end_location: newRoute.end_location.trim(),
        is_loop: newRoute.is_loop,
        is_verified: newRoute.is_verified,
        is_active: newRoute.is_active,
      };

      const { data: routeData_result, error: routeError } = await supabase
        .from('routes')
        .insert([routeData])
        .select()
        .single();

      if (routeError) {
        console.error('Error al crear ruta:', routeError);
        Alert.alert('Error', 'No se pudo crear la ruta. Inténtalo de nuevo.');
        return;
      }

      if (selectedImages.length > 0) {
        try {
          setUploadingImages(true);
          const imageUrls = await uploadImages(routeData_result.id);
          
          const imageRecords = imageUrls.map((url, index) => {
            const selectedImage = selectedImages[index];
            return {
              route_id: routeData_result.id,
              image_url: url,
              is_primary: selectedImage?.is_primary || index === 0,
            };
          });

          const { error: imageError } = await supabase
            .from('route_images')
            .insert(imageRecords);

          if (imageError) throw imageError;
          
        } catch (imageUploadError) {
          console.error('Error subiendo imágenes:', imageUploadError);
          Alert.alert(
            'Advertencia', 
            'La ruta se creó pero no se pudieron subir las imágenes.'
          );
        } finally {
          setUploadingImages(false);
        }
      }

      Alert.alert('Éxito', `La ruta "${routeData_result.name}" ha sido creada exitosamente`);
      await fetchRoutes();
      setShowCreateModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating route:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setCreatingRoute(false);
      setUploadingImages(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.start_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.end_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'expert': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'moderate': return 'Moderada';
      case 'hard': return 'Difícil';
      case 'expert': return 'Experto';
      default: return difficulty;
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={styles.routeCard}
      onPress={() => navigateToRouteDetail(item.id)}
    >
      <View style={styles.routeIcon}>
        <Map size={20} color="#8B5CF6" />
      </View>
      <View style={styles.routeInfo}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeName}>{item.name}</Text>
          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.routeDescription} numberOfLines={1}>
          {item.description}
        </Text>
        
        <View style={styles.routeLocation}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.start_location} → {item.end_location}
          </Text>
        </View>
        
        <View style={styles.routeMeta}>
          <Text style={styles.routeMetaText}>{item.distance} km</Text>
          
          <Text style={[
            styles.routeMetaText, 
            styles.routeDifficulty,
            { color: getDifficultyColor(item.difficulty) }
          ]}>
            {getDifficultyText(item.difficulty)}
          </Text>
          
          {item.estimated_time && (
            <View style={styles.timeContainer}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.routeMetaText}>
                {formatTime(item.estimated_time)}
              </Text>
            </View>
          )}
          
          {item.elevation_gain && (
            <Text style={styles.routeMetaText}>
              ↗ {item.elevation_gain}m
            </Text>
          )}
          
          {item.is_loop && (
            <Text style={styles.loopBadge}>Circular</Text>
          )}
          
          <Text style={[
            styles.routeMetaText, 
            styles.routeStatus,
            { color: item.is_active ? '#10B981' : '#EF4444' }
          ]}>
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
          <Text style={styles.loadingText}>Cargando rutas...</Text>
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
            onPress={() => setShowCreateModal(true)}
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
            placeholder="Buscar rutas por nombre, descripción o ubicación..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => console.log('Filtro presionado')}
        >
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
              {routes.filter(r => r.is_verified).length}
            </Text>
            <Text style={styles.statLabel}>Verificadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {routes.filter(r => !r.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Inactivas</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Todas las rutas ({filteredRoutes.length})
        </Text>
        
        {filteredRoutes.length > 0 ? (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRouteItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.routesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Map size={48} color="#6B7280" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron rutas' : 'No hay rutas disponibles'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Prueba con otro término de búsqueda' 
                : 'Crea tu primera ruta para comenzar'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Crear primera ruta</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!creatingRoute && !uploadingImages) {
            setShowCreateModal(false);
            resetForm();
          }
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  if (!creatingRoute && !uploadingImages) {
                    setShowCreateModal(false);
                    resetForm();
                  }
                }}
                disabled={creatingRoute || uploadingImages}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nueva Ruta</Text>
              <TouchableOpacity 
                style={[styles.saveButton, (creatingRoute || uploadingImages) && styles.saveButtonDisabled]}
                onPress={createRoute}
                disabled={creatingRoute || uploadingImages}
              >
                {(creatingRoute || uploadingImages) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Save size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Resto del formulario... */}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
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
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 6,
  },
  routeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  routeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  routeMetaText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  routeDifficulty: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loopBadge: {
    backgroundColor: '#374151',
    color: '#D1D5DB',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  routeStatus: {
    fontWeight: '600',
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyOption: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  difficultyOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  difficultyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyTextSelected: {
    color: '#FFFFFF',
  },
  switchContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  switchRowLast: {
    borderBottomWidth: 0,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  modalFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  requiredNote: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  formDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  imageButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedImagesContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  selectedImagesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagesScrollView: {
    marginBottom: 12,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageActions: {
    marginTop: 8,
    gap: 4,
  },
  setPrimaryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  setPrimaryButtonText: {
    color: '#D1D5DB',
    fontSize: 10,
  },
  removeImageButton: {
    backgroundColor: '#EF444420',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 4,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  uploadingText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
});