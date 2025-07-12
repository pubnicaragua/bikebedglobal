// app/chat/[id].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// --- Definiciones de tipos ---
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
  image_url?: string | null; // Esta propiedad es la que usaremos para mostrar la imagen
}

// Nota: La interfaz Profile no se usa directamente en este componente, pero la mantengo si la usas en otro lugar.
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export default function ChatScreen() {
  const { id: conversationId, otherUserId, otherUserName } = useLocalSearchParams<{ id: string; otherUserId: string; otherUserName: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const flatListRef = useRef<FlatList<Message>>(null);

  // --- Lógica para obtener el ID del usuario actual ---
  useEffect(() => {
    async function getUserSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        if (session) {
          setCurrentUserId(session.user.id);
        } else {
          setError("Debes iniciar sesión para ver los mensajes.");
          setLoading(false);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error al obtener la sesión del usuario:", e.message);
          setError(`Error al cargar la sesión del usuario: ${e.message}`);
        } else {
          console.error("Error desconocido al obtener la sesión del usuario.");
          setError("Error desconocido al cargar la sesión del usuario.");
        }
        setLoading(false);
      }
    }
    getUserSession();
  }, []);

  // --- Lógica para cargar los mensajes iniciales ---
  useEffect(() => {
    async function fetchMessages() {
      if (!currentUserId || !otherUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Selecciona mensajes y une con chat_images para obtener image_url
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select('*, chat_images(image_url)') // Esto ya hace el join y trae la URL
          .eq('sender_id', currentUserId)
          .eq('recipient_id', otherUserId);

        if (sentError) throw sentError;

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('*, chat_images(image_url)') // Y aquí también
          .eq('sender_id', otherUserId)
          .eq('recipient_id', currentUserId);

        if (receivedError) throw receivedError;

        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
        allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Mapea los mensajes para asegurar que 'image_url' esté en la raíz del objeto Message
        const formattedMessages = allMessages.map(msg => ({
          ...msg,
          // Si chat_images existe y tiene image_url, la asigna; de lo contrario, null
          image_url: msg.chat_images && Array.isArray(msg.chat_images) && msg.chat_images.length > 0
            ? msg.chat_images[0].image_url // Acceder al primer elemento del array
            : null
        })) as Message[];

        setMessages(formattedMessages);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error al cargar los mensajes:", e.message);
          setError(`No se pudieron cargar los mensajes: ${e.message}.`);
        } else {
          console.error("Error desconocido al cargar los mensajes.");
          setError("No se pudieron cargar los mensajes.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();

    // --- Suscripción a cambios en tiempo real (Ajuste clave aquí) ---
    // Aseguramos que currentUserId y otherUserId estén definidos antes de suscribir
    if (currentUserId && otherUserId) {
        const channel = supabase
        .channel(`chat_messages_${currentUserId}_${otherUserId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `(sender_id=eq.${currentUserId}&recipient_id=eq.${otherUserId})||\
                     (sender_id=eq.${otherUserId}&recipient_id=eq.${currentUserId})`,
        }, async (payload) => {
            console.log('Nuevo mensaje en tiempo real recibido:', payload.new);
            const newMessagePayload = payload.new as Message;

            let imageUrl: string | null = null;

            // Si el mensaje tiene un ID (lo cual debería ser el caso para inserts)
            // entonces buscamos la URL de la imagen en la tabla chat_images
            // usando el message_id (el ID del mensaje recién insertado)
            if (newMessagePayload.id) {
                // Hay un pequeño retraso entre la inserción de 'messages' y 'chat_images'.
                // Podríamos necesitar un pequeño retardo o reintento si la imagen no aparece inmediatamente.
                // Para simplificar, asumimos que chat_images se insertará muy rápidamente.
                const { data: imageData, error: imageError } = await supabase
                    .from('chat_images')
                    .select('image_url')
                    .eq('message_id', newMessagePayload.id) // Buscamos por el message_id
                    .single();

                if (imageError && imageError.code !== 'PGRST116') { // PGRST116 es "no rows found"
                    console.error("Error fetching image URL for new real-time message:", imageError);
                } else if (imageData) {
                    imageUrl = imageData.image_url;
                }
            }

            setMessages((prevMessages) => {
                // Formateamos el nuevo mensaje con la URL de la imagen (si se encontró)
                const formattedNewMessage = { ...newMessagePayload, image_url: imageUrl };

                // Evita duplicados en caso de que el mensaje ya haya sido insertado localmente
                if (!prevMessages.some(msg => msg.id === formattedNewMessage.id)) {
                    const updatedMessages = [...prevMessages, formattedNewMessage];
                    updatedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    return updatedMessages;
                }
                return prevMessages;
            });
            flatListRef.current?.scrollToEnd({ animated: true });
        })
        .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [conversationId, currentUserId, otherUserId]); // Dependencias para re-ejecutar si cambian los IDs de usuario

  useEffect(() => {
    // Desplazarse al final cuando los mensajes se cargan o actualizan
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // --- Función para enviar un nuevo mensaje de texto ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId) {
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: otherUserId,
          content: newMessage.trim(),
          is_read: false,
        });

      if (insertError) {
        throw insertError;
      }

      setNewMessage('');
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("Error al enviar el mensaje:", e.message);
        setError(`No se pudo enviar el mensaje: ${e.message}`);
      } else {
        console.error("Error desconocido al enviar el mensaje.");
        setError("No se pudo enviar el mensaje.");
      }
    }
  };

  // --- Función para reportar al otro usuario ---
  const handleReportUser = () => {
    if (!otherUserId || !otherUserName || !currentUserId) {
      Alert.alert("Error", "No se puede reportar al usuario en este momento.");
      return;
    }
    Alert.alert(
      "Reportar Usuario",
      `¿Estás seguro de que quieres reportar a ${otherUserName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Reportar",
          onPress: async () => {
            console.log(`Reportando al usuario: ${otherUserName} (ID: ${otherUserId})`);
            Alert.alert("Reporte Enviado", `${otherUserName} ha sido reportado. Gracias por tu ayuda.`);
          }
        }
      ]
    );
  };

  // --- Función para subir imágenes ---
  const handleUploadImage = async () => {
    if (!currentUserId || !otherUserId) {
      Alert.alert("Error", "No se puede subir imagen. Usuario no identificado.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Necesitamos permiso para acceder a tu galería de fotos para subir imágenes.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Corregido: Usar MediaType.Images
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const fileExtension = mimeType.split('/')[1] || 'jpeg';

      try {
        const fileName = `${currentUserId}/${uuidv4()}.${fileExtension}`;
        const bucketName = 'chat-images';

        const fileToUpload = {
          uri: imageUri,
          name: fileName,
          type: mimeType,
        };

        // 1. Subir la imagen al Storage de Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileToUpload as any, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        // 2. Insertar un nuevo mensaje en la tabla 'messages'
        // 'content' será null si hiciste la columna nulable en Supabase.
        // Si no, debería ser una cadena vacía ''.
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUserId,
            recipient_id: otherUserId,
            content: null, // Asumiendo que la columna 'content' en 'messages' es NULABLE
            is_read: false,
          })
          .select('*') // Necesitamos el ID del mensaje para referenciarlo en 'chat_images'
          .single();

        if (messageError) {
          throw messageError;
        }

        const messageId = messageData.id; // Obtener el ID del mensaje recién creado

        // 3. Insertar la referencia de la imagen en la tabla 'chat_images'
        // Aquí es donde 'message_id' de chat_images se enlaza con el ID del mensaje.
        const { data: chatImageData, error: chatImageError } = await supabase
          .from('chat_images')
          .insert({
            sender_id: currentUserId,
            image_url: imageUrl,
            message_id: messageId, // Referencia al mensaje recién creado
          })
          .select('id')
          .single();

        if (chatImageError) {
          throw chatImageError;
        }

        // NO necesitas insertar el mensaje aquí de nuevo, la suscripción en tiempo real lo hará
        // o la recarga inicial se encargará de ello si te mueves de pantalla.
        // Alert.alert("Imagen Enviada", "La imagen se ha enviado exitosamente.");
        // Opcional: Puedes forzar una actualización del estado localmente para una respuesta más rápida,
        // pero la suscripción a Supabase debería manejarlo idealmente.
        setMessages((prevMessages) => {
            const tempMessage: Message = {
                id: messageId, // Usamos el ID del mensaje recién creado
                sender_id: currentUserId,
                recipient_id: otherUserId,
                content: null,
                is_read: false,
                created_at: new Date().toISOString(), // Fecha actual para mostrar inmediatamente
                image_url: imageUrl, // Aquí adjuntamos la URL de la imagen
            };
            const updatedMessages = [...prevMessages, tempMessage];
            updatedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return updatedMessages;
        });
        flatListRef.current?.scrollToEnd({ animated: true });


      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error al subir la imagen:", e.message);
          Alert.alert("Error al subir imagen", `No se pudo subir la imagen: ${e.message}`);
        } else {
          console.error("Error desconocido al subir la imagen.", e);
          Alert.alert("Error al subir imagen", "Ocurrió un error desconocido al subir la imagen.");
        }
      }
    } else {
      console.log("Selección de imagen cancelada.");
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    return (
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.myMessage : styles.otherMessage,
      ]}>
        {/* Solo muestra el contenido de texto si existe */}
        {item.content && <Text style={styles.messageContent}>{item.content}</Text>}
        {/* Muestra la imagen si image_url existe */}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.chatImage} />
        ) : null}
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: otherUserName || 'Chat',
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#FFFFFF',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleReportUser} style={styles.headerRightButton}>
              <Ionicons name="flag" size={24} color="#EF4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Cargando mensajes...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.noMessagesText}>No hay mensajes en esta conversación. ¡Sé el primero en saludar!</Text>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={styles.messagesListContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        <View style={styles.messageInputContainer}>
          <TouchableOpacity onPress={handleUploadImage} style={styles.imageUploadButton}>
            <Ionicons name="image-outline" size={26} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={24} color={newMessage.trim() ? '#4F46E5' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
  },
  noMessagesText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  messagesListContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'column',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderBottomLeftRadius: 2,
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  messageTime: {
    color: '#D1D5DB',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  chatImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    resizeMode: 'cover',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#374151',
  },
  imageUploadButton: {
    padding: 8,
    marginRight: 5,
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#2D3748',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    marginLeft: 5,
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  headerRightButton: {
    marginRight: 10,
    padding: 5,
  }
});