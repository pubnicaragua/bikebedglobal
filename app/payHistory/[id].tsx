import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

// Main App component
const App = () => {
  return (
    <View style={styles.container}>
      <PaymentHistoryView />
    </View>
  );
};

// PaymentHistoryView component
const PaymentHistoryView = () => {
  const handleRefundRequest = () => {
    Alert.alert(
      'Solicitar Rembolso',
      'Funcionalidad de reembolso en desarrollo.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Pagos</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tus Transacciones Recientes</Text>
            {/* Placeholder for payment items */}
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No hay transacciones recientes para mostrar.</Text>
              <Text style={styles.placeholderText}>Tu historial de pagos aparecerá aquí.</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Refund Request Button Section */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.refundButton}
          onPress={handleRefundRequest}
        >
          <Text style={styles.refundButtonText}>Solicitar Rembolso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingTop: 40, // Adjust for status bar on mobile
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
  sectionContainer: {
    backgroundColor: '#1F2937', // A slightly lighter dark background for the section
    padding: 24,
    borderRadius: 8,
    marginTop: 16, // Add some top margin to separate from header
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  refundButton: {
    backgroundColor: '#2563EB', // Blue color for the button
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25, // More rounded corners for a button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // For Android shadow
  },
  refundButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
