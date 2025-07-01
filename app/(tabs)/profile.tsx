import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Globe, History, Heart, LogOut, Settings } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { t, language, changeLanguage } = useI18n();

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOut'),
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    changeLanguage(newLanguage);
  };

  const switchToTestUser = () => {
    Alert.alert(
      'Cambiar Usuario',
      'Selecciona el tipo de usuario para probar:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Usuario Normal',
          onPress: async () => {
            await signOut();
            // Auto-login as test user
            setTimeout(() => {
              Alert.alert(
                'Usuario de Prueba',
                'Usa estas credenciales:\nEmail: user@bikeandbed.com\nPassword: 123456'
              );
              router.replace('/auth');
            }, 500);
          },
        },
        {
          text: 'Anfitrión',
          onPress: async () => {
            await signOut();
            setTimeout(() => {
              Alert.alert(
                'Anfitrión de Prueba',
                'Usa estas credenciales:\nEmail: host@bikeandbed.com\nPassword: 123456'
              );
              router.replace('/auth');
            }, 500);
          },
        },
        {
          text: 'Administrador',
          onPress: async () => {
            await signOut();
            setTimeout(() => {
              Alert.alert(
                'Admin de Prueba',
                'Usa estas credenciales:\nEmail: admin@bikeandbed.com\nPassword: 123456'
              );
              router.replace('/auth');
            }, 500);
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: Globe,
      title: t('profile.language'),
      subtitle: language === 'es' ? 'Español' : 'English',
      onPress: toggleLanguage,
    },
    {
      icon: History,
      title: t('profile.history'),
      onPress: () => console.log('History'),
    },
    {
      icon: Heart,
      title: t('profile.favorites'),
      onPress: () => router.push('/(tabs)/favorites'),
    },
    {
      icon: Settings,
      title: 'Cambiar Usuario (Demo)',
      subtitle: 'Probar diferentes roles',
      onPress: switchToTestUser,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#9CA3AF" />
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
          
          {/* Role Badge */}
          <View style={[
            styles.roleBadge,
            {
              backgroundColor: profile?.role === 'admin' ? '#EF4444' :
                              profile?.role === 'host' ? '#F59E0B' : '#4ADE80'
            }
          ]}>
            <Text style={styles.roleText}>
              {profile?.role === 'admin' ? 'Administrador' :
               profile?.role === 'host' ? 'Anfitrión' : 'Usuario'}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <item.icon size={20} color="#9CA3AF" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 24,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});