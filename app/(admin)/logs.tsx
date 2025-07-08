import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native'; // Importamos el icono de flecha
import { supabase } from '../../src/services/supabase'; // Asegúrate de que esta ruta sea correcta
import { useI18n } from '../../src/hooks/useI18n'; // Para internacionalización

// Definición de la interfaz para un log de administrador
interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string | null;
  target_table: string | null;
  target_id: string | null;
  created_at: string; // La fecha se recibe como string ISO
}

export default function AdminLogsScreen() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n(); // Hook para obtener traducciones

  // Función para formatear la fecha y hora
  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Función para obtener los logs de la base de datos
  const fetchAdminLogs = useCallback(async () => {
    setRefreshing(true); // Activar el indicador de refresco
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false }); // Ordenar por fecha de creación descendente

      if (error) {
        console.error('Error al obtener logs de administrador:', error.message);
        // Podrías mostrar una alerta o un mensaje de error en la UI
      } else {
        setLogs(data || []); // Actualizar el estado con los logs obtenidos
      }
    } catch (err) {
      console.error('Error inesperado al obtener logs:', err);
    } finally {
      setLoading(false); // Desactivar el indicador de carga inicial
      setRefreshing(false); // Desactivar el indicador de refresco
    }
  }, []); // El useCallback asegura que la función no se recree innecesariamente

  // useEffect para cargar los logs cuando el componente se monta
  useEffect(() => {
    fetchAdminLogs();
  }, [fetchAdminLogs]); // Dependencia del useCallback

  // Componente para renderizar cada tarjeta de log
  const LogCard = ({ log }: { log: AdminLog }) => (
    <View style={styles.logCard}>
      <Text style={styles.logAction}>{log.action || t('adminLogs.noAction')}</Text>
      <View style={styles.logDetailRow}>
        <Text style={styles.logLabel}>{t('adminLogs.table')}:</Text>
        <Text style={styles.logValue}>{log.target_table || t('adminLogs.na')}</Text>
      </View>
      <View style={styles.logDetailRow}>
        <Text style={styles.logLabel}>{t('adminLogs.targetId')}:</Text>
        <Text style={styles.logValue}>
          {log.target_id ? `${log.target_id.substring(0, 8)}...` : t('adminLogs.na')}
        </Text>
      </View>
      <View style={styles.logDetailRow}>
        <Text style={styles.logLabel}>{t('adminLogs.adminId')}:</Text>
        <Text style={styles.logValue}>
          {log.admin_id ? `${log.admin_id.substring(0, 8)}...` : t('adminLogs.na')}
        </Text>
      </View>
      <Text style={styles.logTimestamp}>{formatLogDate(log.created_at)}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ADE80" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('adminLogs.title')}</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogCard log={item} />}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>{t('adminLogs.noLogs')}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAdminLogs}
            tintColor="#FFFFFF" // Color del spinner de refresco
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Fondo oscuro consistente
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#111827',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1, // Para que el título ocupe el espacio restante
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logAction: {
    color: '#4ADE80', // Color para la acción principal
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 5,
  },
  logValue: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  logTimestamp: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});
