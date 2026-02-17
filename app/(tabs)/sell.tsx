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

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  darkTeal3: '#05696F',
  primaryGreen: '#05696F',
  darkGreen: '#268865',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#f5f5f5',
  gray100: '#f8fafc',
  gray200: '#f1f5f9',
  gray300: '#e2e8f0',
  gray400: '#cbd5e1',
  gray500: '#64748b',
  gray700: '#1f2937',
  red: '#ef4444',
};

const brands = ['AUDI', 'BMW', 'CITROEN', 'FIAT', 'FORD', 'MERCEDES-BENZ', 'OPEL', 'PEUGEOT', 'RENAULT', 'VOLKSWAGEN', 'TOYOTA', 'HONDA'];
const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Hybride Rechargeable', 'Électrique', 'GPL', 'Autre'];
const transmissions = ['Manuelle', 'Automatique'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

export default function SellScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Updated: photos is now an array of URIs, supporting up to 50 images
  const [photos, setPhotos] = useState([]);
  const MAX_PHOTOS = 50;
  
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        console.log('✅ Current user:', user.email);
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

  // Updated: Add photo to array
  const pickImage = async () => {
    try {
      if (photos.length >= MAX_PHOTOS) {
        Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu'à ${MAX_PHOTOS} photos`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Updated: Remove photo from array by index
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Upload single image to Supabase Storage using ArrayBuffer
  const uploadImageToStorage = async (imageUri, carId, index) => {
    try {
      console.log(`📤 Uploading image ${index + 1} to storage...`);
      console.log(`🔗 Image URI: ${imageUri}`);
      
      // Create unique filename
      const fileName = `${carId}_${index}_${Date.now()}.jpg`;
      const filePath = `cars/${carId}/${fileName}`;

      console.log(`📁 File path: ${filePath}`);

      // Fetch the image and convert to ArrayBuffer (works in React Native)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log(`📦 ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

      // Upload to Supabase Storage using ArrayBuffer
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error(`❌ Storage upload error for image ${index + 1}:`, uploadError);
        throw uploadError;
      }

      console.log(`✅ Image ${index + 1} uploaded to storage:`, uploadData.path);

      // Return just the file path (for database storage)
      return filePath;
    } catch (error) {
      console.error(`❌ Error uploading image ${index + 1}:`, error);
      throw error;
    }
  };

  // Save image record to database
  const saveImageToDatabase = async (carId, imagePath, displayOrder, accessToken) => {
    try {
      console.log(`💾 Saving image ${displayOrder + 1} path to database...`);
      console.log('🔗 Image path:', imagePath);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/car_images`,
        {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            car_id: carId,
            image_url: imagePath,
            display_order: displayOrder,
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Database save error:', error);
        throw new Error('Failed to save image to database');
      }

      const data = await response.json();
      console.log(`✅ Image ${displayOrder + 1} saved to database:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      throw error;
    }
  };

  // Upload all images
  const uploadImages = async (carId, accessToken) => {
    console.log('📸 Starting image upload process...');
    
    if (photos.length === 0) {
      console.log('⚠️ No images to upload');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < photos.length; i++) {
      try {
        const imageUri = photos[i];
        
        // Step 1: Upload to Supabase Storage (returns file path)
        const filePath = await uploadImageToStorage(imageUri, carId, i);
        
        // Step 2: Save file path to database
        await saveImageToDatabase(carId, filePath, i, accessToken);
        
        successCount++;
        console.log(`✅ Successfully processed image ${i + 1} (${successCount}/${photos.length})`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to process image ${i + 1}:`, error);
      }
    }

    console.log(`📊 Upload complete: ${successCount} succeeded, ${failCount} failed`);
    
    if (failCount > 0) {
      Alert.alert(
        'Attention',
        `${successCount} image(s) uploadée(s), ${failCount} échouée(s). Votre annonce a été créée.`
      );
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return photos.length > 0; // At least 1 photo required
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

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        return;
      }

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

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Create failed:', errorText);
        throw new Error(`Échec de création: ${createResponse.status}`);
      }

      const responseData = await createResponse.json();
      const newCar = Array.isArray(responseData) ? responseData[0] : responseData;

      if (!newCar || !newCar.id) {
        throw new Error('ID de voiture non reçu');
      }

      console.log('✅ Car created with ID:', newCar.id);

      // Upload images to storage
      if (photos.length > 0) {
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
              setPhotos([]); // Reset to empty array
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
      console.error('❌ Error:', error);
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
              Ajoutez jusqu'à {MAX_PHOTOS} photos pour augmenter le nombre de contacts ({photos.length}/{MAX_PHOTOS})
            </Text>

            <Text style={styles.sectionLabel}>
              Vos photos <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.photoGrid}>
              {/* Display existing photos */}
              {photos.map((photoUri, index) => (
                <View key={index} style={styles.photoBox}>
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>Photo {index + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add photo button (show if under limit) */}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={styles.addPhotoBox}
                  onPress={pickImage}
                >
                  <View style={styles.photoIconContainer}>
                    <Text style={styles.addPhotoIcon}>+</Text>
                    <Text style={styles.addPhotoText}>Ajouter une photo</Text>
                  </View>
                </TouchableOpacity>
              )}
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
                <Text style={styles.pickerArrow}>›</Text>
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
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Plus d'informations</Text>

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
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Boîte de vitesse <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => openModal('transmission', transmissions)}
              >
                <Text style={[styles.pickerButtonText, !formData.transmission && styles.pickerPlaceholder]}>
                  {formData.transmission || 'Choisissez'}
                </Text>
                <Text style={styles.pickerArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Prix et description</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Prix (€) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="15000"
                value={formData.price}
                onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Décrivez l'état, les équipements, l'historique..."
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
            <ActivityIndicator color={COLORS.white} />
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
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'brand' && 'Marque'}
                {modalType === 'year' && 'Année'}
                {modalType === 'fuel_type' && 'Énergie'}
                {modalType === 'transmission' && 'Boîte de vitesse'}
              </Text>
            </View>

            {(modalType === 'brand' || modalType === 'year') && (
              <View style={styles.modalSearchContainer}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
            )}

            <ScrollView 
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.gray300, 
    marginTop: 40 
  },
  backButton: { 
    padding: 8 
  },
  backIcon: { 
    fontSize: 24, 
    color: COLORS.darkTeal1,
    fontWeight: 'bold'
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.darkTeal1, 
    marginLeft: 16 
  },
  progressBar: { 
    height: 4, 
    backgroundColor: COLORS.gray300 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: COLORS.primaryGreen 
  },
  content: { 
    flex: 1 
  },
  stepContainer: { 
    padding: 20 
  },
  stepTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.darkTeal1, 
    marginBottom: 8 
  },
  stepSubtitle: { 
    fontSize: 15, 
    color: COLORS.gray500, 
    marginBottom: 24, 
    lineHeight: 22 
  },
  sectionLabel: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.darkTeal1, 
    marginBottom: 16 
  },
  required: { 
    color: COLORS.red 
  },
  photoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 20 
  },
  photoBox: { 
    width: (width - 52) / 2, 
    aspectRatio: 1, 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    borderWidth: 3, 
    borderColor: COLORS.primaryGreen, 
    overflow: 'hidden' 
  },
  addPhotoBox: { 
    width: (width - 52) / 2, 
    aspectRatio: 1, 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: COLORS.darkTeal1, 
    borderStyle: 'dashed',
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  photoImage: { 
    width: '100%', 
    height: '100%' 
  },
  photoLabel: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    right: 12, 
    backgroundColor: COLORS.darkTeal1, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  photoLabelText: { 
    color: COLORS.white, 
    fontSize: 12, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  photoIconContainer: { 
    alignItems: 'center', 
    padding: 16 
  },
  addPhotoIcon: {
    fontSize: 50,
    color: COLORS.darkTeal1,
    fontWeight: '300',
  },
  addPhotoText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.darkTeal1, 
    textAlign: 'center', 
    marginTop: 8, 
    lineHeight: 16 
  },
  removePhotoButton: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.red, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removePhotoText: { 
    color: COLORS.white, 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  fieldContainer: { 
    marginBottom: 30 
  },
  fieldLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.darkTeal1, 
    marginBottom: 20 
  },
  pickerButton: { 
    backgroundColor: COLORS.gray100, 
    borderWidth: 2, 
    borderColor: COLORS.gray300, 
    borderRadius: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  pickerButtonText: { 
    fontSize: 16, 
    color: COLORS.gray700 
  },
  pickerPlaceholder: { 
    color: COLORS.gray400 
  },
  pickerArrow: { 
    fontSize: 20, 
    color: COLORS.darkTeal1,
    fontWeight: 'bold'
  },
  input: { 
    backgroundColor: COLORS.gray100, 
    borderWidth: 2, 
    borderColor: COLORS.gray300, 
    borderRadius: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    color: COLORS.gray700 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '80%' 
  },
  modalListContent: {
    paddingBottom: 40
  },
  modalHandle: { 
    width: 40, 
    height: 4, 
    backgroundColor: COLORS.gray300, 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginTop: 12, 
    marginBottom: 8 
  },
  modalHeader: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.gray300 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.darkTeal1, 
    textAlign: 'center' 
  },
  modalSearchContainer: { 
    padding: 16 
  },
  modalSearchInput: { 
    backgroundColor: COLORS.gray200, 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    borderWidth: 2, 
    borderColor: COLORS.gray300 
  },
  modalList: { 
    maxHeight: 400 
  },
  modalOption: { 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.gray200 
  },
  modalOptionText: { 
    fontSize: 16, 
    color: COLORS.gray700 
  },
  modalOptionSelected: { 
    backgroundColor: COLORS.darkTeal1 + '15'
  },
  modalOptionTextSelected: { 
    color: COLORS.darkTeal1, 
    fontWeight: '600' 
  },
  bottomContainer: { 
    padding: 20, 
    backgroundColor: COLORS.white, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.gray300 
  },
  continueButton: { 
    backgroundColor: COLORS.darkTeal1, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  continueButtonDisabled: { 
    backgroundColor: COLORS.gray400 
  },
  continueButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: COLORS.white 
  },
});