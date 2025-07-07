import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

type NotificationType = 'booking' | 'message' | 'system' | 'payment' | 'info' | 'warning' | 'alert' | 'maintenance' | 'update';
// Eliminamos NotificationPriority ya que no se usará

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notification: any) => void;
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
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Eliminamos el estado 'priority'
  // Eliminamos el estado 'expiresAt' y 'showDatePicker'
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const availableRoles = ['admin', 'user', 'manager'];

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setNotificationType('info');
    setUserId('');
    setError('');
    // Eliminamos el reseteo de 'priority'
    // Eliminamos el reseteo de 'expiresAt'
    setTargetRoles([]);
  };

  const handleSubmit = () => {
    if (!title || !message) {
      setError('El título y el mensaje son obligatorios.');
      return;
    }

    if (!isGlobal && !userId) {
      setError('El ID de usuario es obligatorio para notificaciones individuales.');
      return;
    }

    setLoading(true);

    const notificationData = {
      title,
      message,
      notification_type: notificationType,
      ...(isGlobal ? {
        // Eliminamos 'priority' de los datos enviados
        // Eliminamos 'expires_at' de los datos enviados
        target_roles: targetRoles.length > 0 ? targetRoles : null
      } : {
        user_id: userId
      })
    };

    onSubmit(notificationData);
  };

  const toggleRole = (role: string) => {
    setTargetRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // Eliminamos la función 'onDateChange'

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Notificación</Text>
              <ScrollView horizontal style={styles.typeScroll}>
                {isGlobal ? (
                  <>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'info' && styles.activeType]}
                      onPress={() => setNotificationType('info')}
                    >
                      <Text style={notificationType === 'info' ? styles.activeTypeText : styles.typeButtonText}>Información</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'warning' && styles.activeType]}
                      onPress={() => setNotificationType('warning')}
                    >
                      <Text style={notificationType === 'warning' ? styles.activeTypeText : styles.typeButtonText}>Advertencia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'alert' && styles.activeType]}
                      onPress={() => setNotificationType('alert')}
                    >
                      <Text style={notificationType === 'alert' ? styles.activeTypeText : styles.typeButtonText}>Alerta</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'booking' && styles.activeType]}
                      onPress={() => setNotificationType('booking')}
                    >
                      <Text style={notificationType === 'booking' ? styles.activeTypeText : styles.typeButtonText}>Reserva</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'message' && styles.activeType]}
                      onPress={() => setNotificationType('message')}
                    >
                      <Text style={notificationType === 'message' ? styles.activeTypeText : styles.typeButtonText}>Mensaje</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, notificationType === 'system' && styles.activeType]}
                      onPress={() => setNotificationType('system')}
                    >
                      <Text style={notificationType === 'system' ? styles.activeTypeText : styles.typeButtonText}>Sistema</Text>
                    
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>

            {!isGlobal && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID de Usuario</Text>
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Ingrese el ID del usuario"
                  placeholderTextColor="#9CA3AF"
                />
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
              <>
                {/* Eliminamos el bloque de selección de prioridad */}
                {/* <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prioridad</Text>
                  <View style={styles.priorityContainer}>
                    {(['low', 'normal', 'high', 'critical'] as NotificationPriority[]).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.priorityButton, priority === p && styles.activePriority]}
                        onPress={() => setPriority(p)}
                      >
                        <Text style={priority === p ? styles.activePriorityText : styles.priorityText}>
                          {p === 'low' ? 'Baja' : p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Crítica'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View> */}

                {/* Ya habíamos eliminado la fecha de expiración */}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Roles Destino (opcional)</Text>
                  <View style={styles.rolesContainer}>
                    {availableRoles.map(role => (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleButton, targetRoles.includes(role) && styles.activeRole]}
                        onPress={() => toggleRole(role)}
                      >
                        <Text style={targetRoles.includes(role) ? styles.activeRoleText : styles.roleText}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  onClose();
                  resetForm();
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Enviando...' : 'Enviar Notificación'}
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
});

export default NotificationModal;