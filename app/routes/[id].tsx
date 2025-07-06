import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Star, MapPin, Flag, Clock, Edit, Trash2, Share2 } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface Route {
  id: string;
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
  images?: { image_url: string; is_primary: boolean }[];
}

export const RouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    distance: '',
    elevation_gain: '',
    difficulty: 'moderate' as 'easy' | 'moderate' | 'hard' | 'expert',
    estimated_time: '',
    start_location: '',
    end_location: '',
    is_loop: false,
    is_active: true,
  });

  const fetchRouteDetails = async () => {
    try {
      setLoading(true);
      
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (routeError) throw routeError;

      const { data: imagesData, error: imagesError } = await supabase
        .from('route_images')
        .select('image_url, is_primary')
        .eq('route_id', id);

      if (imagesError) console.error('Error fetching images:', imagesError);

      const route = {
        ...routeData,
        images: imagesData || []
      };

      setRoute(route);
      
      setFormData({
        name: routeData.name,
        description: routeData.description,
        distance: routeData.distance.toString(),
        elevation_gain: routeData.elevation_gain?.toString() || '',
        difficulty: routeData.difficulty,
        estimated_time: routeData.estimated_time?.toString() || '',
        start_location: routeData.start_location,
        end_location: routeData.end_location,
        is_loop: routeData.is_loop,
        is_active: routeData.is_active,
      });

    } catch (error) {
      console.error('Error fetching route details:', error);
      Alert.alert('Error', 'No se pudo cargar la ruta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRouteDetails();
  }, [id]);

  const handleUpdateRoute = async () => {
    if (!route) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('routes')
        .update({
          name: formData.name,
          description: formData.description,
          distance: parseFloat(formData.distance),
          elevation_gain: formData.elevation_gain ? parseFloat(formData.elevation_gain) : null,
          difficulty: formData.difficulty,
          estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
          start_location: formData.start_location,
          end_location: formData.end_location,
          is_loop: formData.is_loop,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', route.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Ruta actualizada correctamente');
      fetchRouteDetails();
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating route:', error);
      Alert.alert('Error', 'No se pudo actualizar la ruta');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!route) return;
    
    try {
      setIsDeleting(true);
      
      const { error: imagesError } = await supabase
        .from('route_images')
        .delete()
        .eq('route_id', route.id);

      if (imagesError) throw imagesError;

      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', route.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Ruta eliminada correctamente');
      router.replace('/routes');
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'No se pudo eliminar la ruta');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  const handleShareRoute = async () => {
    if (!route) return;

    try {
      const shareOptions = {
        title: 'Compartir Ruta',
        message: `¡Mira esta increíble ruta que encontré!\n\n` +
                 `🏞️ ${route.name}\n\n` +
                 `📝 Descripción: ${route.description || 'Sin descripción'}\n\n` +
                 `📏 Distancia: ${route.distance} km\n` +
                 `📈 Dificultad: ${route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}\n` +
                 `⏱️ Tiempo estimado: ${formatTime(route.estimated_time)}\n\n` +
                 `📍 Punto de inicio: ${route.start_location}\n` +
                 `🏁 Punto final: ${route.end_location}\n\n` +
                 `¡Descarga la app para descubrir más rutas como esta!`,
        url: route.images?.[0]?.image_url || 'https://tuaplicacion.com/rutas',
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing route:', error);
      Alert.alert('Error', 'No se pudo compartir la ruta');
    }
  };

  const getDifficultyColor = () => {
    if (!route) return '#6B7280';
    switch (route.difficulty) {
      case 'easy': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'expert': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const openMaps = (location: string) => {
    if (location) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(location)}`);
    }
  };

  if (loading || !route) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const primaryImage = route.images?.find(img => img.is_primary) || route.images?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={handleShareRoute} 
              style={styles.shareButton}
            >
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setEditModalVisible(true)} 
              style={styles.editButton}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDeleteModalVisible(true)} 
              style={styles.deleteButton}
            >
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: primaryImage?.image_url || 'https://via.placeholder.com/500x300?text=Route' }}
            style={styles.mainImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.imageBadge}>
            <Text style={styles.routeNameText}>{route.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Estado y verificación */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              route.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={styles.statusText}>
                {route.is_active ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
            
            {route.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verificada</Text>
              </View>
            )}
            
            {route.is_loop && (
              <View style={styles.loopBadge}>
                <Flag size={14} color="#8B5CF6" />
                <Text style={styles.loopText}>Circular</Text>
              </View>
            )}
          </View>

          {/* Información básica */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distancia</Text>
              <Text style={styles.infoValue}>{route.distance} km</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dificultad</Text>
              <Text style={[styles.infoValue, { color: getDifficultyColor() }]}>
                {route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tiempo estimado</Text>
              <Text style={styles.infoValue}>
                {formatTime(route.estimated_time)}
              </Text>
            </View>
            
            {route.elevation_gain && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Elevación</Text>
                <Text style={styles.infoValue}>{route.elevation_gain} m</Text>
              </View>
            )}
          </View>

          {/* Ubicaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recorrido</Text>
            <TouchableOpacity 
              style={styles.locationItem} 
              onPress={() => openMaps(route.start_location)}
            >
              <MapPin size={16} color="#8B5CF6" />
              <Text style={styles.locationText}>
                <Text style={styles.locationLabel}>Inicio: </Text>
                {route.start_location}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.locationItem} 
              onPress={() => openMaps(route.end_location)}
            >
              <MapPin size={16} color="#EF4444" />
              <Text style={styles.locationText}>
                <Text style={styles.locationLabel}>Fin: </Text>
                {route.end_location}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {route.description || 'Esta ruta no tiene descripción disponible.'}
            </Text>
          </View>

          {/* Galería de imágenes */}
          {route.images && route.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería ({route.images.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContainer}
              >
                {route.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image.image_url }}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Edición */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Ruta</Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Nombre de la ruta"
              />
              
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Descripción detallada"
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.rowInputs}>
                <View style={styles.rowInput}>
                  <Text style={styles.inputLabel}>Distancia (km)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.distance}
                    onChangeText={(text) => setFormData({...formData, distance: text})}
                    placeholder="0.0"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.rowInput}>
                  <Text style={styles.inputLabel}>Elevación (m)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.elevation_gain}
                    onChangeText={(text) => setFormData({...formData, elevation_gain: text})}
                    placeholder="Opcional"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Dificultad</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'moderate', 'hard', 'expert'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      formData.difficulty === level && styles.selectedDifficulty,
                      { borderColor: getDifficultyColorForLevel(level) }
                    ]}
                    onPress={() => setFormData({...formData, difficulty: level})}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      { color: getDifficultyColorForLevel(level) },
                      formData.difficulty === level && styles.selectedDifficultyText
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Tiempo estimado (minutos)</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_time}
                onChangeText={(text) => setFormData({...formData, estimated_time: text})}
                placeholder="Opcional"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Ubicación de inicio</Text>
              <TextInput
                style={styles.input}
                value={formData.start_location}
                onChangeText={(text) => setFormData({...formData, start_location: text})}
                placeholder="Dirección o coordenadas"
              />
              
              <Text style={styles.inputLabel}>Ubicación de fin</Text>
              <TextInput
                style={styles.input}
                value={formData.end_location}
                onChangeText={(text) => setFormData({...formData, end_location: text})}
                placeholder="Dirección o coordenadas"
              />
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Ruta circular</Text>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    formData.is_loop && styles.switchButtonActive
                  ]}
                  onPress={() => setFormData({...formData, is_loop: !formData.is_loop})}
                >
                  <Text style={styles.switchText}>
                    {formData.is_loop ? 'Sí' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Activa</Text>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    formData.is_active && styles.switchButtonActive
                  ]}
                  onPress={() => setFormData({...formData, is_active: !formData.is_active})}
                >
                  <Text style={styles.switchText}>
                    {formData.is_active ? 'Sí' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateRoute}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Eliminación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar Ruta</Text>
            <Text style={styles.deleteText}>
              ¿Estás seguro que deseas eliminar la ruta "{route.name}"? Esta acción no se puede deshacer.
            </Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleDeleteRoute}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getDifficultyColorForLevel = (level: 'easy' | 'moderate' | 'hard' | 'expert') => {
  switch (level) {
    case 'easy': return '#10B981';
    case 'moderate': return '#F59E0B';
    case 'hard': return '#EF4444';
    case 'expert': return '#7C3AED';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  editButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  routeNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  loopText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    minWidth: '30%',
    flex: 1,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    color: '#E5E7EB',
    fontSize: 16,
  },
  locationLabel: {
    fontWeight: '600',
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
  },
  galleryContainer: {
    paddingBottom: 10,
  },
  galleryImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: '70%',
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  difficultyButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedDifficulty: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDifficultyText: {
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  switchLabel: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  switchButton: {
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  switchText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  deleteModalButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default RouteDetailScreen;