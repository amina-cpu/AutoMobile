import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from './src/config/supabase';

export default function EditCarScreen() {
  const route = useRoute();
  const { carId, carData: carDataString } = route.params;
  const carData = JSON.parse(carDataString);

  const [brand, setBrand] = useState(carData?.brand || '');
  const [model, setModel] = useState(carData?.model || '');
  const [year, setYear] = useState(carData?.year?.toString() || '');
  const [price, setPrice] = useState(carData?.price?.toString() || '');
  const [fuelType, setFuelType] = useState(carData?.fuel_type || '');
  const [transmission, setTransmission] = useState(carData?.transmission || '');
  const [mileage, setMileage] = useState(carData?.mileage?.toString() || '');
  const [description, setDescription] = useState(carData?.description || '');
  const [city, setCity] = useState(carData?.city || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!brand || !model || !year || !price || !fuelType || !transmission || !mileage) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cars')
        .update({
          brand,
          model,
          year: parseInt(year),
          price: parseInt(price),
          fuel_type: fuelType,
          transmission,
          mileage: parseInt(mileage),
          description,
          city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', carId);

      if (error) throw error;

      Alert.alert('Succès', 'Annonce mise à jour avec succès');
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour l\'annonce');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'annonce</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Marque *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: MERCEDES-BENZ"
              value={brand}
              onChangeText={setBrand}
              editable={!loading}
            />

            <Text style={styles.label}>Modèle *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: A4"
              value={model}
              onChangeText={setModel}
              editable={!loading}
            />

            <Text style={styles.label}>Année *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2022"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Kilométrage *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50000"
              value={mileage}
              onChangeText={setMileage}
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Prix €*</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 15000"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Carburant *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Diesel"
              value={fuelType}
              onChangeText={setFuelType}
              editable={!loading}
            />

            <Text style={styles.label}>Transmission *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Automatique"
              value={transmission}
              onChangeText={setTransmission}
              editable={!loading}
            />

            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Paris"
              value={city}
              onChangeText={setCity}
              editable={!loading}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Décrivez votre véhicule..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              editable={!loading}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Mettre à jour</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionInput: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#1085a8ff',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});