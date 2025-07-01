import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function SplashScreen() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (user && profile) {
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
        } else {
          router.replace('/auth');
        }
      }, 2000);
    }
  }, [user, profile, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <View style={styles.triangles}>
            <View style={[styles.triangle, styles.leftTriangle]} />
            <View style={[styles.triangle, styles.rightTriangle]} />
          </View>
        </View>
        <Text style={styles.brandName}>Bike & Bed Global</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  triangles: {
    width: 60,
    height: 60,
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
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  rightTriangle: {
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4ADE80',
    top: 8,
    right: 0,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});