import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'user-avatars';

interface AvatarResponse {
  url: string | null;
  error: Error | null;
}

export const AvatarService = {
  upload: async (userId: string, uri: string): Promise<AvatarResponse> => {
    try {
      // Validar tipo de archivo
      const fileExt = uri.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      if (!fileExt || !validExtensions.includes(fileExt)) {
        throw new Error('Solo se permiten imágenes JPG, PNG o WEBP');
      }

      // Verificar tamaño del archivo
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!fileInfo.exists || (fileInfo.size && fileInfo.size > maxSize)) {
        throw new Error('La imagen debe ser menor a 5MB');
      }

      // Convertir a base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Subir a Supabase Storage con estructura de carpetas por usuario
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error en AvatarService.upload:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error : new Error('Error al subir el avatar') 
      };
    }
  },

  remove: async (userId: string, url: string): Promise<{ error: Error | null }> => {
    try {
      // Extraer el nombre del archivo de la URL
      const fileName = url.split('/').pop();
      if (!fileName) throw new Error('URL de avatar inválida');

      // Verificar que el archivo pertenece al usuario antes de eliminar
      if (!fileName.startsWith(userId)) {
        throw new Error('No tienes permisos para eliminar este archivo');
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      return { error: error || null };
    } catch (error) {
      console.error('Error en AvatarService.remove:', error);
      return { 
        error: error instanceof Error ? error : new Error('Error al eliminar el avatar') 
      };
    }
  },
};