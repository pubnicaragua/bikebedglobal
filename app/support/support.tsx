import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Headphones, Mail, Phone, MessageSquare, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

const SupportScreen = () => {
  const contactMethods = [
    {
      icon: Mail,
      title: 'Correo electrónico',
      description: 'Envíanos un email y te responderemos en 24h',
      action: () => Linking.openURL('mailto:soporte@tudominio.com'),
    },
    {
      icon: Phone,
      title: 'Llámanos',
      description: 'Disponibles 24/7 para emergencias',
      action: () => Linking.openURL('tel:+123456789'),
    },
    {
      icon: MessageSquare,
      title: 'Chat en vivo',
      description: 'Habla con un agente en tiempo real',
      action: () => console.log('Abrir chat'),
    },
  ];

  const faqs = [
    {
      question: '¿Cómo restablezco mi contraseña?',
      answer: 'Ve a tu perfil > Configuración de seguridad > "Olvidé mi contraseña". Recibirás un enlace por email.',
    },
    {
      question: '¿Dónde encuentro mis reservas?',
      answer: 'Todas tus reservas aparecen en la pestaña "Historial" de la aplicación.',
    },
    {
      question: '¿Cómo cancelo una reserva?',
      answer: 'En el detalle de tu reserva, pulsa "Cancelar reserva". Las cancelaciones están sujetas a nuestra política de reembolsos.',
    },
    {
      question: '¿Cómo cambio mi método de pago?',
      answer: 'En tu perfil, ve a "Métodos de pago" donde podrás añadir o eliminar tarjetas.',
    },
    {
      question: '¿La aplicación tiene costo?',
      answer: 'No, nuestra aplicación es completamente gratuita para los usuarios.',
    },
    {
      question: '¿Cómo contacto al anfitrión?',
      answer: 'Puedes enviar un mensaje al anfitrión desde los detalles de tu reserva.',
    },
  ];

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconHeader}>
            <Headphones size={32} color="#3B82F6" />
          </View>
          <Text style={styles.title}>Soporte al cliente</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Estamos aquí para ayudarte. Elige tu método de contacto preferido.
          </Text>

          <View style={styles.contactMethods}>
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={`contact-${index}`}
                style={styles.contactCard}
                onPress={method.action}
              >
                <View style={styles.iconContainer}>
                  <method.icon size={24} color="#3B82F6" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
            
            {faqs.map((faq, index) => (
              <View key={`faq-${index}`} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  {expandedIndex === index ? (
                    <ChevronUp size={20} color="#9CA3AF" />
                  ) : (
                    <ChevronDown size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
                
                {expandedIndex === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconHeader: {
    backgroundColor: '#1F2937',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  contactMethods: {
    marginBottom: 30,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    backgroundColor: '#1E40AF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  faqSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});

export default SupportScreen;