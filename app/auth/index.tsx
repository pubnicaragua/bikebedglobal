import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';
import { supabase } from '../../src/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t, changeLanguage, language } = useI18n();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await signIn(email, password);
    
    if (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    if (data.user) {
      try {
        // Fetch user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        setLoading(false);

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          router.replace('/(tabs)');
          return;
        }

        // Redirect based on user role
        switch (profile.role) {
          case 'admin':
            router.replace('/(admin)');
            break;
          case 'host':
            router.replace('/(host)');
            break;
          default:
            router.replace('/(tabs)');
            break;
        }
      } catch (error) {
        setLoading(false);
        console.error('Error during role check:', error);
        router.replace('/(tabs)');
      }
    } else {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    changeLanguage(newLanguage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={toggleLanguage}
          >
            <Text style={styles.languageText}>
              {language === 'es' ? 'EN' : 'ES'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.triangles}>
              <View style={[styles.triangle, styles.leftTriangle]} />
              <View style={[styles.triangle, styles.rightTriangle]} />
            </View>
          </View>
          <Text style={styles.brandName}>Bike & Bed Global</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.login.title')}</Text>

          <Input
            label={t('auth.login.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={t('auth.login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPassword}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <Button
            title={t('auth.login.signIn')}
            onPress={handleSignIn}
            loading={loading}
            style={styles.signInButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerText}>
                {t('auth.login.register')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  languageButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  triangles: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  leftTriangle: {
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  rightTriangle: {
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4ADE80',
    top: 6,
    right: 0,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  forgotPassword: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    marginBottom: 24,
  },
  divider: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#374151',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  registerText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
});