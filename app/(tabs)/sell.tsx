import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../src/config/supabase';

const { width } = Dimensions.get('window');

const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

const brands = ['AUDI', 'BMW', 'CITROEN', 'FIAT', 'FORD', 'MERCEDES-BENZ', 'OPEL', 'PEUGEOT', 'RENAULT', 'VOLKSWAGEN', 'TOYOTA', 'HONDA'];
const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Hybride Rechargeable', 'Électrique', 'GPL', 'Autre'];
const transmissions = ['Manuelle', 'Automatique'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

export default function SellScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [photos, setPhotos] = useState({
    cover: null,
    front: null,
    back: null,
    interior: null,
  });
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    mileage: '',
    fuel_type: '',
    transmission: '',
    price: '',
    description: '',
    condition: 'Bon',
    first_hand: false,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      console.log('👤 Getting current user from auth...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        console.log('✅ Current user:', user.email);
      } else {
        console.log('⚠️ No user logged in');
      }
    } catch (error) {
      console.error('❌ Error getting user:', error);
    }
  };

  const openModal = (type, data) => {
    setModalType(type);
    setModalData(data);
    setModalVisible(true);
    setSearchQuery('');
  };

  const selectModalOption = (value) => {
    setFormData(prev => ({ ...prev, [modalType]: value }));
    setModalVisible(false);
  };

  const pickImage = async (photoType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => ({ ...prev, [photoType]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removePhoto = (photoType) => {
    setPhotos(prev => ({ ...prev, [photoType]: null }));
  };

  const uploadImages = async (carId, accessToken) => {
    console.log('📤 Uploading images...');
    const photoEntries = Object.entries(photos).filter(([_, uri]) => uri);

    for (let i = 0; i < photoEntries.length; i++) {
      try {
        const [photoType, imageUri] = photoEntries[i];
        console.log(`Uploading ${photoType}...`);

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/car_images`,
          {
            method: 'POST',
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              car_id: carId,
              image_url: imageUri,
              display_order: i,
            })
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ Error uploading ${photoType}:`, error);
          continue;
        }

        console.log(`✅ ${photoType} uploaded`);
      } catch (error) {
        console.error(`Error saving ${photoEntries[i][0]}:`, error);
      }
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return photos.cover !== null;
      case 2:
        return formData.brand && formData.model && formData.year;
      case 3:
        return formData.mileage && formData.fuel_type && formData.transmission;
      case 4:
        return formData.price;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('📝 Submitting car listing...');

      if (!currentUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour vendre une voiture');
        return;
      }

      // Get session token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        return;
      }

      console.log('✅ Session token obtained');

      const carData = {
        owner_id: currentUser.id,
        seller_id: currentUser.id,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        mileage: parseInt(formData.mileage),
        description: formData.description || null,
        condition: formData.condition,
        first_hand: formData.first_hand,
        status: 'available',
        city: 'Blida',
      };

      console.log('🚗 Creating car listing...');
      console.log('Car data:', carData);

      const createResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/cars`,
        {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(carData)
        }
      );

      console.log('Response status:', createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Create failed:', errorText);
        throw new Error(`Failed to create car: ${createResponse.status} - ${errorText}`);
      }

      const responseData = await createResponse.json();
      console.log('Response data:', responseData);

      const newCar = Array.isArray(responseData) ? responseData[0] : responseData;

      if (!newCar || !newCar.id) {
        throw new Error('Failed to get car ID from response');
      }

      console.log('✅ Car created with ID:', newCar.id);

      // Upload images
      if (Object.values(photos).some(p => p)) {
        console.log('📸 Uploading images...');
        await uploadImages(newCar.id, session.access_token);
      }

      Alert.alert(
        'Succès', 
        'Votre voiture a été ajoutée avec succès!',
        [
          {
            text: 'OK',
            onPress: () => {
              setStep(1);
              setPhotos({ cover: null, front: null, back: null, interior: null });
              setFormData({
                brand: '',
                model: '',
                year: '',
                mileage: '',
                fuel_type: '',
                transmission: '',
                price: '',
                description: '',
                condition: 'Bon',
                first_hand: false,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error submitting:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Ajoutez des photos</Text>
            <Text style={styles.stepSubtitle}>
              Ajoutez un maximum de photos pour augmenter le nombre de contacts
            </Text>

            <Text style={styles.sectionLabel}>
              Vos photos <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.photoGrid}>
              {['cover', 'front', 'back', 'interior'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.photoBox, photos[type] && styles.photoBoxFilled]}
                  onPress={() => pickImage(type)}
                >
                  {photos[type] ? (
                    <>
                      <Image source={{ uri: photos[type] }} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(type)}
                      >
                        <Text style={styles.removePhotoText}>×</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.photoIconContainer}>
                      <Text style={{ fontSize: 50, color: '#1085a8ff' }}>📷</Text>
                      <Text style={styles.photoText}>{type}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Dites-nous en plus</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Marque <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openModal('brand', brands)}
              >
                <Text style={[styles.pickerButtonText, !formData.brand && styles.pickerPlaceholder]}>
                  {formData.brand || 'Choisissez'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Modèle <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="ex: A4, Golf, 308"
                value={formData.model}
                onChangeText={(value) => setFormData(prev => ({ ...prev, model: value }))}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Année <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openModal('year', years)}
              >
                <Text style={[styles.pickerButtonText, !formData.year && styles.pickerPlaceholder]}>
                  {formData.year || 'Choisissez'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Plus d'infos</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Kilométrage <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="208000"
                value={formData.mileage}
                onChangeText={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Énergie <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openModal('fuel_type', fuelTypes)}
              >
                <Text style={[styles.pickerButtonText, !formData.fuel_type && styles.pickerPlaceholder]}>
                  {formData.fuel_type || 'Choisissez'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Boîte <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openModal('transmission', transmissions)}
              >
                <Text style={[styles.pickerButtonText, !formData.transmission && styles.pickerPlaceholder]}>
                  {formData.transmission || 'Choisissez'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Prix et description</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Prix (DA) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="15000"
                value={formData.price}
                onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Décrivez l'état..."
                value={formData.description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const filteredModalData = modalData.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Vendre une voiture</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !validateStep() && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!validateStep() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.continueButtonText}>
              {step === totalSteps ? 'Publier l\'annonce' : 'Continuer'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            <ScrollView style={styles.modalList}>
              {filteredModalData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    formData[modalType] === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => selectModalOption(item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData[modalType] === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: 40 },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1f2937' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginLeft: 16 },
  progressBar: { height: 4, backgroundColor: '#e5e7eb' },
  progressFill: { height: '100%', backgroundColor: '#1085a8ff' },
  content: { flex: 1 },
  stepContainer: { padding: 20 },
  stepTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 22 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  required: { color: '#ef4444' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  photoBox: { width: (width - 52) / 2, aspectRatio: 1, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 2, borderColor: '#1085a8ff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoBoxFilled: { borderWidth: 3 },
  photoImage: { width: '100%', height: '100%' },
  photoIconContainer: { alignItems: 'center', padding: 16 },
  photoText: { fontSize: 14, fontWeight: '600', color: '#1085a8ff', textAlign: 'center', marginTop: 8 },
  removePhotoButton: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  removePhotoText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  pickerButton: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerButtonText: { fontSize: 16, color: '#1f2937' },
  pickerPlaceholder: { color: '#94a3b8' },
  input: { backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, fontSize: 16, color: '#1f2937' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalSearchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 2, borderColor: 'transparent', margin: 16 },
  modalList: { maxHeight: 400 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionText: { fontSize: 16, color: '#1f2937' },
  modalOptionSelected: { backgroundColor: '#e0f2fe' },
  modalOptionTextSelected: { color: '#1085a8ff', fontWeight: '600' },
  bottomContainer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  continueButton: { backgroundColor: '#1085a8ff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#cbd5e1' },
  continueButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
});