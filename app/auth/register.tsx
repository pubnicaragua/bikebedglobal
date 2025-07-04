import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuth } from '../../src/hooks/useAuth';
import { useI18n } from '../../src/hooks/useI18n';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useI18n();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', t('auth.errors.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', t('auth.errors.passwordsNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', t('auth.errors.passwordLength'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', t('auth.register.success'), [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Información', `Opción de ${provider} seleccionada`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('auth.register.title')}</Text>

        <View style={styles.form}>
          <Input
            label={t('auth.register.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <Input
            label={t('auth.register.lastName')}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <Input
            label={t('auth.register.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={t('auth.register.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label={t('auth.register.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={t('auth.register.signUp')}
            onPress={handleSignUp}
            loading={loading}
            style={styles.signUpButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botones de redes sociales */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleSocialLogin('Google')}
            >
              <Image
                source={require('assets/images/icons8-logo-de-google-48.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>
                {t('auth.social.google')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Image
                source={require('assets/images/icons8-facebook-nuevo-48.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>
                {t('auth.social.facebook')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.register.hasAccount')}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.signInText}>{t('auth.register.signIn')}</Text>
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
  backButton: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#3B5998',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: 'contain',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  signInText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
});