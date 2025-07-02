import { useEffect, useState } from 'react';
import { supabase, Database } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { AvatarService } from '../services/avatar.service';
import { router } from 'expo-router';

const AVATAR_BUCKET = 'user-avatars';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para manejar la sesión y cambios de autenticación
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Error al cargar sesión');
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      session?.user ? await fetchProfile(session.user.id) : setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            router.replace('/auth');
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Función para obtener el perfil del usuario
  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función para subir avatar
  const uploadAvatar = async (uri: string) => {
    if (!user?.id) throw new Error('Usuario no autenticado');
    
    try {
      const { url, error } = await AvatarService.upload(user.id, uri);
      if (error) throw error;
      return url;
    } catch (error) {
      console.error('Error en uploadAvatar:', error);
      throw error;
    }
  };

  // Función para actualizar datos del perfil
  const updateProfileData = async (updates: Partial<Profile>) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Función para actualizar avatar
  const updateAvatar = async (uri: string) => {
    setLoading(true);
    try {
      const avatarUrl = await uploadAvatar(uri);
      const updatedProfile = await updateProfileData({ avatar_url: avatarUrl });
      setProfile(updatedProfile);
      return { url: avatarUrl, error: null };
    } catch (error) {
      console.error('Error en updateAvatar:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error : new Error('Error al actualizar avatar') 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar avatar
  const removeAvatar = async () => {
    if (!user?.id || !profile?.avatar_url) {
      throw new Error('No hay avatar para eliminar');
    }

    setLoading(true);
    try {
      const { error } = await AvatarService.remove(user.id, profile.avatar_url);
      if (error) throw error;

      const updatedProfile = await updateProfileData({ avatar_url: null });
      setProfile(updatedProfile);
      return { error: null };
    } catch (error) {
      console.error('Error en removeAvatar:', error);
      return { 
        error: error instanceof Error ? error : new Error('Error al eliminar avatar') 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Error al iniciar sesión') 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar usuario (NUEVA)
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      // 1. Registrar usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se creó el usuario');

      // 2. Crear perfil en la tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          role: 'user' // Rol por defecto
        })
        .select()
        .single();

      if (profileError) throw profileError;

      setUser(authData.user);
      setProfile(profileData);
      setError(null);

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Error en signUp:', error);
      setError(error instanceof Error ? error.message : 'Error al registrarse');
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Error al registrarse') 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Error en signOut:', error);
      return { 
        error: error instanceof Error ? error : new Error('Error al cerrar sesión') 
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar cuenta
  const deleteAccount = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Eliminar avatar si existe
      if (profile?.avatar_url) {
        await AvatarService.remove(userId, profile.avatar_url);
      }

      // 2. Eliminar datos relacionados en otras tablas
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId);

      if (postsError) throw postsError;

      // 3. Eliminar el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // 4. Eliminar el usuario de autenticación
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      // 5. Cerrar sesión
      await supabase.auth.signOut();
      setProfile(null);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Retornamos TODAS las funciones y estados
  return {
    // Estados
    user,
    profile,
    loading,
    error,
    
    // Autenticación
    signIn,
    signUp,
    signOut,
    deleteAccount,
    
    // Perfil
    updateProfile: updateProfileData,
    updateAvatar,
    removeAvatar,
    
    // Utilidades
    getUserRole: () => profile?.role || 'user',
  };
};