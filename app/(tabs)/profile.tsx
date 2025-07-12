import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Globe,
  History,
  Heart,
  LogOut,
  AlertTriangle,
  Shield,
  Headphones,
  BellRing,
  Search,
} from 'lucide-react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import EditProfileModal from '../../src/components/ui/EditProfileModal';
import DeleteAccountModal from '../../src/components/ui/DeleteAcountModal';

export default function ProfileScreen() {
  const {
    user,
    profile,
    signOut,
    deleteAccount,
    loading: authLoading,
  } = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const getImageUrl = () => {
    if (!profile?.avatar_url) return null;

    if (profile.avatar_url.startsWith('https://')) {
      return profile.avatar_url;
    }

    return `https://[TU-ID-DE-SUPABASE].supabase.co/storage/v1/object/public/avatars/${profile.avatar_url}`;
  };

  const handleSignOut = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirmation'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      if (!user?.id) throw new Error(t('profile.noUserId'));

      const { error } = await deleteAccount(user.id);

      if (error) throw new Error(error);

      Alert.alert(
        t('profile.accountDeleted'),
        t('profile.accountDeletedMessage')
      );

      router.replace('/auth');
    } catch (error) {
      Alert.alert(
        t('profile.deleteError'),
        error instanceof Error ? error.message : t('profile.unknownError')
      );
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    changeLanguage(newLanguage);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
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
      onPress: () => router.push('/chat/HistoryChat'), // <--- CAMBIO AQUÍ
    },
    {
      icon: Heart,
      title: t('profile.favorites'),
      onPress: () => router.push('/(tabs)/favorites'),
    },
    {
      icon: Shield,
      title: t('profile.checkPrivacity'),
      onPress: () => console.log('Comprobar seguridad'),
    },
    {
      icon: Headphones,
      title: t('profile.contactSupport'),
      onPress: () => router.push('/support/support'),
    },
    {
      icon: Search,
      title: 'Consultar historial de pago',
      onPress: () => router.push('/payHistory/[id]'),
    },
    {
      icon: AlertTriangle,
      title: t('profile.deleteAccount'),
      titleStyle: styles.menuTitleDanger,
      onPress: () => setDeleteModalVisible(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {getImageUrl() ? (
                <>
                  {imageLoading && (
                    <View style={styles.avatarLoading}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                  <Image
                    source={{ uri: getImageUrl()! }}
                    style={styles.avatar}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color="#9CA3AF" />
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.name}>
                {profile?.first_name || t('profile.defaultFirstName')}
              </Text>
              <Text style={styles.lastName}>
                {profile?.last_name || t('profile.defaultLastName')}
              </Text>
            </View>

            <Text style={styles.email}>{profile?.email}</Text>

            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    profile?.role === 'admin'
                      ? '#EF4444'
                      : profile?.role === 'host'
                      ? '#F59E0B'
                      : '#4ADE80',
                },
              ]}
            >
              <Text style={styles.roleText}>
                {profile?.role === 'admin'
                  ? 'Admin'
                  : profile?.role === 'host'
                  ? 'Host'
                  : 'User'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                disabled={authLoading}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIcon,
                      item.titleStyle ? { backgroundColor: 'transparent' } : {},
                    ]}
                  >
                    <item.icon
                      size={20}
                      color={item.titleStyle ? '#EF4444' : '#9CA3AF'}
                    />
                  </View>
                  <View>
                    <Text style={[styles.menuTitle, item.titleStyle]}>
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        profile={{
          avatar_url: getImageUrl() || null,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          phone: profile?.phone || '',
        }}
      />

      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
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
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarLoading: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginRight: 4,
  },
  lastName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 24,
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
  menuTitleDanger: {
    color: '#EF4444',
  },
  menuSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});