import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import { supabase } from '../../services/supabase'; // Asegúrate de que la ruta a supabase sea correcta

type NotificationType = 'booking' | 'message' | 'system' | 'payment' | 'info' | 'warning' | 'alert' | 'maintenance' | 'update';

// Interfaz para un perfil simplificado
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  // onSubmit ahora podría ser asíncrono si la inserción se maneja fuera
  onSubmit: (notification: any) => Promise<void>; 
  isGlobal?: boolean;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isGlobal = false
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('info');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false); // Renombrado para claridad
  const [error, setError] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  // 'manager' no está en tu esquema de profiles, pero lo mantengo si lo usas en alguna parte.
  const availableRoles = ['admin', 'user', 'host']; // Ajustado a roles de tu esquema profiles

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Renombrado para claridad
  const [usersError, setUsersError] = useState('');

  // Efecto para cargar los usuarios cuando el modal se hace visible
  useEffect(() => {
    if (visible && !isGlobal) {
      fetchUsers();
    } else if (visible && isGlobal) {
      // Si es global, reiniciamos el estado de usuario, ya que no se selecciona uno
      setUserId(null); 
    }
  }, [visible, isGlobal]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setUsers(data);
        // Si hay usuarios y ninguno está seleccionado (o el seleccionado ya no existe), selecciona el primero
        if (data.length > 0 && (!userId || !data.some(u => u.id === userId))) {
          setUserId(data[0].id);
        }
      }
    } catch (e: any) {
      console.error('Error cargando usuarios:', e.message);
      setUsersError('Error al cargar usuarios: ' + e.message);
      Alert.alert('Error', 'No se pudieron cargar los usuarios: ' + e.message); // Alerta al usuario
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setNotificationType('info');
    setUserId(users.length > 0 ? users[0].id : null);
    setError('');
    setTargetRoles([]);
    setIsLoadingSubmit(false); // Resetea el estado de envío
  };

  const handleSubmit = async () => { // Hacemos la función asíncrona
    setError(''); // Limpia errores previos
    if (!title || !message) {
      setError('El título y el mensaje son obligatorios.');
      return;
    }

    // Validación para notificaciones individuales: userId es obligatorio y debe ser válido
    if (!isGlobal && (!userId || users.length === 0)) {
      setError('Debe seleccionar un usuario para notificaciones individuales.');
      return;
    }
    
    // Si es global y no hay roles seleccionados, quizás quieras una validación o enviar a todos
    if (isGlobal && targetRoles.length === 0) {
      // Opción 1: Considerar error
      setError('Para notificaciones globales, debe seleccionar al menos un rol destino.');
      return;
      // Opción 2: Omitir target_roles si está vacío, enviando potencialmente a todos si la lógica lo interpreta así.
      // Puedes adaptar esto según tu necesidad.
    }


    setIsLoadingSubmit(true); // Usamos el nuevo estado de carga

    // *** BLOQUE DE DIAGNÓSTICO CRUCIAL ***
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error al obtener la sesión ANTES de enviar:", sessionError);
        setError("Error de sesión antes de enviar: " + sessionError.message);
        setIsLoadingSubmit(false);
        return;
      }
      if (!session || !session.user) {
        console.error("No hay sesión activa ANTES de enviar. Sesión:", session);
        setError("Debes iniciar sesión para crear notificaciones.");
        setIsLoadingSubmit(false);
        return;
      }
      console.log("Sesión activa ANTES de enviar. User ID:", session.user.id);
      console.log("Token de acceso ANTES de enviar (últimos 10 caracteres):", session.access_token ? session.access_token.slice(-10) : 'No token');
    } catch (e: any) {
      console.error("Excepción al verificar sesión ANTES de enviar:", e.message);
      setError("Error interno al verificar sesión.");
      setIsLoadingSubmit(false);
      return;
    }
    // *** FIN DEL BLOQUE DE DIAGNÓSTICO ***

    const notificationData = {
      title,
      message,
      notification_type: notificationType,
      ...(isGlobal ? {
        // Asegúrate de que esta columna exista en tu DB (TEXT[])
        target_roles: targetRoles.length > 0 ? targetRoles : null
      } : {
        user_id: userId // Enviamos el userId seleccionado del Picker
      })
    };

    try {
      await onSubmit(notificationData); // onSubmit ahora debe ser asíncrono y manejar la inserción
      resetForm(); // Resetea el formulario solo si el envío fue exitoso
      onClose();   // Cierra el modal solo si el envío fue exitoso
    } catch (submitError: any) {
      console.error("Error al enviar notificación desde el modal:", submitError.message);
      setError("Error al enviar notificación: " + submitError.message);
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  const toggleRole = (role: string) => {
    setTargetRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        onClose();
        resetForm();
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Notificación</Text>
              <TouchableOpacity onPress={() => {
                onClose();
                resetForm();
              }}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {usersError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{usersError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Notificación</Text>
              <ScrollView horizontal style={styles.typeScroll}>
                {/* Tipos de notificación ajustados a tu necesidad, por ejemplo, 'info', 'warning', 'alert' para globales */}
                {(isGlobal ? ['info', 'warning', 'alert'] : ['booking', 'message', 'system', 'payment', 'info', 'warning', 'alert', 'maintenance', 'update']).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeButton, notificationType === type && styles.activeType]}
                      onPress={() => setNotificationType(type as NotificationType)}
                    >
                      <Text style={notificationType === type ? styles.activeTypeText : styles.typeButtonText}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {!isGlobal && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Seleccionar Usuario</Text>
                {isLoadingUsers ? (
                  <ActivityIndicator size="small" color="#4ADE80" />
                ) : users.length === 0 ? (
                  <Text style={styles.emptyUsersText}>No se encontraron usuarios.</Text>
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={userId}
                      onValueChange={(itemValue: string | null) => setUserId(itemValue)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {users.map((u) => (
                        <Picker.Item
                          key={u.id}
                          label={`${u.first_name || ''} ${u.last_name || ''} (${u.email})`.trim()}
                          value={u.id}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Título de la notificación"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensaje</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Mensaje de la notificación"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            {isGlobal && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Roles Destino (seleccione uno o más)</Text>
                <View style={styles.rolesContainer}>
                  {availableRoles.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleButton, targetRoles.includes(role) && styles.activeRole]}
                      onPress={() => toggleRole(role)}
                    >
                      <Text style={targetRoles.includes(role) ? styles.activeRoleText : styles.roleText}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  onClose();
                  resetForm();
                }}
                disabled={isLoadingSubmit} // Usa el nuevo estado de carga
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, (isLoadingSubmit || isLoadingUsers) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isLoadingSubmit || isLoadingUsers} // Deshabilita si se está enviando o cargando usuarios
              >
                <Text style={styles.buttonText}>
                  {isLoadingSubmit ? 'Enviando...' : 'Enviar Notificación'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#111827',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  submitButton: {
    backgroundColor: '#4ADE80',
  },
  disabledButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  typeScroll: {
    marginBottom: 10,
  },
  typeButton: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  activeType: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  typeButtonText: {
    color: '#FFFFFF',
  },
  activeTypeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  roleButton: {
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  activeRole: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  roleText: {
    color: '#FFFFFF',
  },
  activeRoleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 5,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#FFFFFF',
  },
  pickerItem: {
    color: '#FFFFFF',
    backgroundColor: '#1F2937',
  },
  emptyUsersText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default NotificationModal;