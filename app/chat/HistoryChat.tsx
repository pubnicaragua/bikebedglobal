// app/chat/HistoryChat.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase'; // Asegúrate de que esta ruta sea correcta

// Importa los componentes de React Native Paper
import { Menu, Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons'; // Para el icono de los tres puntos

// --- Definiciones de tipos para TypeScript ---

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  otherUser: Profile | null; // El perfil del otro usuario en la conversación
}

// --- Componente HistoryChatScreen ---

export default function HistoryChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados para el menú de cada elemento de la lista
  const [visibleMenuId, setVisibleMenuId] = useState<string | null>(null); // ID de la conversación cuyo menú está visible

  const router = useRouter();

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
          setError("Debes iniciar sesión para ver el historial de chats.");
          setLoading(false);
          // Opcional: router.replace('/login');
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

  // --- Lógica para cargar las conversaciones ---
  useEffect(() => {
    async function fetchConversations() {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
          .order('last_message_at', { ascending: false });

        if (conversationsError) {
          throw conversationsError;
        }

        const conversationsWithProfiles: Conversation[] = await Promise.all(
          data.map(async (conversation: any) => {
            const otherUserId = conversation.user1_id === currentUserId
              ? conversation.user2_id
              : conversation.user1_id;

            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .eq('id', otherUserId)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Advertencia: No se pudo obtener el perfil del otro usuario:', profileError);
            }

            return { ...conversation, otherUser: profileData || null } as Conversation;
          })
        );

        setConversations(conversationsWithProfiles);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Error al cargar el historial de chats:", e.message);
          setError(`No se pudo cargar el historial de chats: ${e.message}. Inténtalo de nuevo más tarde.`);
        } else {
          console.error("Error desconocido al cargar el historial de chats.");
          setError("No se pudo cargar el historial de chats. Inténtalo de nuevo más tarde.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();

    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', {
        event: '*', // Escucha cualquier cambio (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'conversations',
      }, (payload) => {
        console.log('Cambio en conversaciones detectado:', payload);
        fetchConversations(); // Vuelve a cargar las conversaciones para reflejar los cambios
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handleConversationPress = (conversation: Conversation) => {
    // Cierra el menú si estuviera abierto para esta conversación antes de navegar
    if (visibleMenuId === conversation.id) {
        closeMenu();
    }
    router.push({
      pathname: `/chat/[id]`,
      params: {
        id: conversation.id, // ID de la conversación para la nueva pantalla
        otherUserId: conversation.otherUser?.id || '', // Pasa el ID del otro usuario
        otherUserName: conversation.otherUser ? `${conversation.otherUser.first_name || ''} ${conversation.otherUser.last_name || ''}`.trim() : 'Usuario Desconocido', // Pasa el nombre del otro usuario
      },
    });
  };

  // --- Funciones para manejar el menú ---
  const openMenu = (conversationId: string) => setVisibleMenuId(conversationId);
  const closeMenu = () => setVisibleMenuId(null);

  const handleReportConversation = (conversation: Conversation) => {
    closeMenu(); // Cierra el menú al seleccionar una opción
    Alert.alert(
      "Reportar Conversación",
      `¿Estás seguro de que quieres reportar esta conversación con ${conversation.otherUser?.first_name || 'este usuario'}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Reportar",
          onPress: async () => {
            console.log("Reportando conversación:", conversation.id);
            // TODO: Aquí integrar la lógica para enviar el reporte a Supabase o tu backend
            // Podrías tener una tabla 'reports' con conversation_id, reporter_id, reason, etc.
            // Ejemplo:
            /*
            try {
              const { error: reportError } = await supabase.from('reports').insert({
                conversation_id: conversation.id,
                reporter_id: currentUserId,
                reported_user_id: conversation.otherUser?.id,
                reason: 'Contenido inapropiado', // Puedes hacer que el usuario seleccione una razón
              });
              if (reportError) throw reportError;
              Alert.alert("Reporte Enviado", "La conversación ha sido reportada. Gracias por tu ayuda.");
            } catch (e) {
              console.error("Error al enviar el reporte:", e);
              Alert.alert("Error", "No se pudo enviar el reporte. Inténtalo de nuevo.");
            }
            */
            Alert.alert("Reporte Enviado", "La conversación ha sido reportada. Gracias por tu ayuda.");
          }
        }
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.8} // Reduce la opacidad al pulsar
    >
      {item.otherUser?.avatar_url ? (
        <Image source={{ uri: item.otherUser.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.otherUser?.first_name ? item.otherUser.first_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}
      <View style={styles.conversationDetails}>
        <Text style={styles.conversationName} numberOfLines={1}>
          {item.otherUser
            ? `${item.otherUser.first_name || ''} ${item.otherUser.last_name || ''}`.trim() || 'Usuario desconocido'
            : 'Usuario desconocido'}
        </Text>
        <Text style={styles.lastMessageTime}>
          Último mensaje: {new Date(item.last_message_at).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>

      {/* Botón de menú a la derecha */}
      <View style={styles.menuContainer}>
        <Menu
          visible={visibleMenuId === item.id}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation(); // Evita que se dispare handleConversationPress
              openMenu(item.id);
            }} style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => handleReportConversation(item)} title="Reportar Conversación" />
          {/* Puedes añadir más opciones aquí si las necesitas */}
        </Menu>
      </View>
    </TouchableOpacity>
  );

  return (
    // PaperProvider debe envolver tu aplicación o la parte de la aplicación que usa componentes de Paper
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{
          title: "Historial de Chats", // Título en el encabezado
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#FFFFFF',
          headerShown: true, // Asegúrate de que el encabezado sea visible si lo deseas
        }} />

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Cargando chats...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : conversations.length === 0 ? (
            <Text style={styles.subtitle}>Aún no tienes conversaciones. ¡Comienza una nueva!</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Fondo oscuro para que coincida con el tema
  },
  content: {
    flex: 1,
    padding: 16,
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
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937', // Fondo ligeramente más claro para los elementos
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000', // Sombra para un efecto elevado
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#4B5563', // Fondo de fallback por si la imagen no carga
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B5563',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  conversationDetails: {
    flex: 1, // Permite que los detalles de la conversación ocupen el espacio restante
  },
  conversationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  lastMessageTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  menuContainer: {
    marginLeft: 10, // Espacio entre el texto y el menú
    justifyContent: 'center', // Centra verticalmente el botón del menú
  },
  menuButton: {
    padding: 5, // Área táctil para el icono
  }
});