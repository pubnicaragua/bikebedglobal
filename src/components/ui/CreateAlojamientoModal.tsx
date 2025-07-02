import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';

interface Alojamiento {
  name: string;
  description: string;
  location: string;
  address: string;
  pricePerNight: string;
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  hasBikeStorage: boolean;
  hasBikeRental: boolean;
  hasBikeTools: boolean;
  hasLaundry: boolean;
  hasWifi: boolean;
  hasKitchen: boolean;
  hasParking: boolean;
}

interface CreateAlojamientoModalProps {
  visible: boolean;
  onClose: () => void;
  alojamiento: Alojamiento | null;
  onAccommodationCreated:  (updatedData: Alojamiento) => void;
}

const EditAlojamientoModal: React.FC<CreateAlojamientoModalProps> = ({
  visible,
  onClose,
  alojamiento,
  onAccommodationCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [capacity, setCapacity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [hasBikeStorage, setHasBikeStorage] = useState(false);
  const [hasBikeRental, setHasBikeRental] = useState(false);
  const [hasBikeTools, setHasBikeTools] = useState(false);
  const [hasLaundry, setHasLaundry] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [hasKitchen, setHasKitchen] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar los datos cuando se abre el modal
  useEffect(() => {
    if (alojamiento) {
      setName(alojamiento.name);
      setDescription(alojamiento.description);
      setLocation(alojamiento.location);
      setAddress(alojamiento.address);
      setPricePerNight(alojamiento.pricePerNight);
      setCapacity(alojamiento.capacity);
      setBedrooms(alojamiento.bedrooms);
      setBathrooms(alojamiento.bathrooms);
      setHasBikeStorage(alojamiento.hasBikeStorage);
      setHasBikeRental(alojamiento.hasBikeRental);
      setHasBikeTools(alojamiento.hasBikeTools);
      setHasLaundry(alojamiento.hasLaundry);
      setHasWifi(alojamiento.hasWifi);
      setHasKitchen(alojamiento.hasKitchen);
      setHasParking(alojamiento.hasParking);
    }
  }, [alojamiento]);

  const handleSave = () => {
    if (
      !name ||
      !location ||
      !address ||
      !pricePerNight ||
      !capacity ||
      !bedrooms ||
      !bathrooms
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    
    const updatedAlojamiento: Alojamiento = {
      name,
      description,
      location,
      address,
      pricePerNight,
      capacity,
      bedrooms,
      bathrooms,
      hasBikeStorage,
      hasBikeRental,
      hasBikeTools,
      hasLaundry,
      hasWifi,
      hasKitchen,
      hasParking,
    };
    
    onAccommodationCreated(updatedAlojamiento);
    setLoading(false);
  };

  const ToggleButton = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.toggleContainer} onPress={onPress}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Alojamiento</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Datos básicos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos Básicos</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre del alojamiento"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe tu alojamiento..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ubicación *</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ej. Cancún, México"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Dirección *</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ej. Calle Principal 123"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio por noche (USD) *</Text>
                <TextInput
                  style={styles.input}
                  value={pricePerNight}
                  onChangeText={setPricePerNight}
                  placeholder="Ej. 100"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacidad máxima de huéspedes *</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Ej. 4"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de habitaciones *</Text>
                <TextInput
                  style={styles.input}
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  placeholder="Ej. 2"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de baños *</Text>
                <TextInput
                  style={styles.input}
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  placeholder="Ej. 1"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Servicios para ciclistas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Servicios para Ciclistas</Text>

              <ToggleButton
                label="Almacenamiento para bicicletas"
                value={hasBikeStorage}
                onPress={() => setHasBikeStorage(!hasBikeStorage)}
              />

              <ToggleButton
                label="Alquiler de bicicletas"
                value={hasBikeRental}
                onPress={() => setHasBikeRental(!hasBikeRental)}
              />

              <ToggleButton
                label="Herramientas para bicicletas"
                value={hasBikeTools}
                onPress={() => setHasBikeTools(!hasBikeTools)}
              />
            </View>

            {/* Amenidades Generales */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenidades Generales</Text>

              <ToggleButton
                label="Lavandería"
                value={hasLaundry}
                onPress={() => setHasLaundry(!hasLaundry)}
              />

              <ToggleButton
                label="WiFi"
                value={hasWifi}
                onPress={() => setHasWifi(!hasWifi)}
              />

              <ToggleButton
                label="Cocina disponible"
                value={hasKitchen}
                onPress={() => setHasKitchen(!hasKitchen)}
              />

              <ToggleButton
                label="Estacionamiento"
                value={hasParking}
                onPress={() => setHasParking(!hasParking)}
              />
            </View>

            {/* Botones de acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Estilos
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  modalContent: {
    marginHorizontal: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    borderColor: '#9CA3AF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  checkmark: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default EditAlojamientoModal;