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
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

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
  const [photoPack, setPhotoPack] = useState(false);

  // Focus states
  const [modelFocused, setModelFocused] = useState(false);
  const [mileageFocused, setMileageFocused] = useState(false);
  const [priceFocused, setPriceFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
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

  const uploadImages = async (carId) => {
    const uploadedImages = [];
    const photoEntries = Object.entries(photos).filter(([_, uri]) => uri);

    for (let i = 0; i < photoEntries.length; i++) {
      try {
        const [photoType, imageUri] = photoEntries[i];

        const { data, error: dbError } = await supabase
          .from('car_images')
          .insert({
            car_id: carId,
            image_url: imageUri,
            display_order: i,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        uploadedImages.push(imageUri);
      } catch (error) {
        console.error(`Error saving ${photoEntries[i][0]}:`, error);
      }
    }
    
    if (uploadedImages.length === 0 && photoEntries.length > 0) {
      throw new Error('Failed to save any images to database');
    }
    
    return uploadedImages;
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

      if (!currentUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour vendre une voiture');
        return;
      }

      const carData = {
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
      };

      const newCar = await carService.addCar(carData);

      if (Object.values(photos).some(p => p)) {
        await uploadImages(newCar.id);
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
              {/* Cover Photo */}
              <TouchableOpacity
                style={[styles.photoBox, photos.cover && styles.photoBoxFilled]}
                onPress={() => pickImage('cover')}
              >
                {photos.cover ? (
                  <>
                    <Image source={{ uri: photos.cover }} style={styles.photoImage} />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText}>Photo de couverture</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto('cover')}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.photoIconContainer}>
                    <Text style={{ fontSize: 50, color: '#1085a8ff' }}>📷</Text>
                    <Text style={styles.photoText}>Photo de{'\n'}couverture</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Front Photo */}
              <TouchableOpacity
                style={[styles.photoBox, photos.front && styles.photoBoxFilled]}
                onPress={() => pickImage('front')}
              >
                {photos.front ? (
                  <>
                    <Image source={{ uri: photos.front }} style={styles.photoImage} />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText}>3/4 avant gauche</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto('front')}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.photoIconContainer}>
                    <Text style={{ fontSize: 50, color: '#1085a8ff' }}>🚗</Text>
                    <Text style={styles.photoText}>3/4 avant{'\n'}gauche</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Back Photo */}
              <TouchableOpacity
                style={[styles.photoBox, photos.back && styles.photoBoxFilled]}
                onPress={() => pickImage('back')}
              >
                {photos.back ? (
                  <>
                    <Image source={{ uri: photos.back }} style={styles.photoImage} />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText}>3/4 arrière droit</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto('back')}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.photoIconContainer}>
                    <Text style={{ fontSize: 50, color: '#1085a8ff' }}>🚗</Text>
                    <Text style={styles.photoText}>3/4 arrière{'\n'}droit</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Interior Photo */}
              <TouchableOpacity
                style={[styles.photoBox, photos.interior && styles.photoBoxFilled]}
                onPress={() => pickImage('interior')}
              >
                {photos.interior ? (
                  <>
                    <Image source={{ uri: photos.interior }} style={styles.photoImage} />
                    <View style={styles.photoLabel}>
                      <Text style={styles.photoLabelText}>Intérieur conducteur</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto('interior')}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.photoIconContainer}>
                    <Text style={{ fontSize: 50, color: '#1085a8ff' }}>🪑</Text>
                    <Text style={styles.photoText}>Intérieur{'\n'}conducteur</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Dites-nous en plus</Text>
            <Text style={styles.stepSubtitle}>
              Vérifiez et complétez les informations de votre véhicule
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Marque <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.fieldLabel}>
                Modèle <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  modelFocused && styles.inputFocused
                ]}
                placeholder="ex: A4, Golf, 308"
                value={formData.model}
                onChangeText={(value) => setFormData(prev => ({ ...prev, model: value }))}
                onFocus={() => setModelFocused(true)}
                onBlur={() => setModelFocused(false)}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Année modèle <Text style={styles.required}>*</Text>
              </Text>
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
            <Text style={styles.stepTitle}>Dites-nous en plus</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Kilométrage <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  mileageFocused && styles.inputFocused
                ]}
                placeholder="208000"
                value={formData.mileage}
                onChangeText={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                keyboardType="numeric"
                onFocus={() => setMileageFocused(true)}
                onBlur={() => setMileageFocused(false)}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Énergie <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.fieldLabel}>
                Boîte de vitesse <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.fieldLabel}>
                Prix (DA) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  priceFocused && styles.inputFocused
                ]}
                placeholder="15000"
                value={formData.price}
                onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                keyboardType="decimal-pad"
                onFocus={() => setPriceFocused(true)}
                onBlur={() => setPriceFocused(false)}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description (optionnel)</Text>
              <TextInput
                style={[
                  styles.input,
                  { height: 120, textAlignVertical: 'top' },
                  descriptionFocused && styles.inputFocused
                ]}
                placeholder="Décrivez l'état, les équipements, l'historique..."
                value={formData.description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                multiline
                numberOfLines={5}
                onFocus={() => setDescriptionFocused(true)}
                onBlur={() => setDescriptionFocused(false)}
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
        {step > 1 ? (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle}>Vendre une voiture</Text>
        <TouchableOpacity style={styles.closeButton}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
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
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'brand' && 'Marque'}
                {modalType === 'year' && 'Année modèle'}
                {modalType === 'fuel_type' && 'Énergie'}
                {modalType === 'transmission' && 'Boîte de vitesse'}
              </Text>
            </View>

            {(modalType === 'brand' || modalType === 'year') && (
              <View style={styles.modalSearchContainer}>
                <TextInput
                  style={[
                    styles.modalSearchInput,
                    searchFocused && styles.modalSearchInputFocused
                  ]}
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </View>
            )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 40,
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1f2937' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 16,
  },
  closeButton: { marginLeft: 'auto', padding: 8 },
  closeIcon: { fontSize: 24, color: '#64748b' },
  progressBar: { height: 4, backgroundColor: '#e5e7eb' },
  progressFill: { height: '100%', backgroundColor: '#1085a8ff' },
  content: { flex: 1 },
  stepContainer: { padding: 20 },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  required: { color: '#ef4444' },
  photoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12,
    marginBottom: 20,
  },
  photoBox: {
    width: (width - 52) / 2,
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1085a8ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoBoxFilled: { 
    borderStyle: 'solid', 
    borderColor: '#1085a8ff',
    borderWidth: 3,
  },
  photoImage: { width: '100%', height: '100%' },
  photoLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  photoLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  photoIconContainer: { alignItems: 'center', padding: 16 },
  photoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1085a8ff',
    textAlign: 'center',
    lineHeight: 20,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: { fontSize: 16, color: '#1f2937' },
  pickerPlaceholder: { color: '#94a3b8' },
  pickerArrow: { fontSize: 20, color: '#64748b' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputFocused: {
    borderColor: '#1085a8ff',
    backgroundColor: '#ffffff',
    shadowColor: '#1085a8ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  modalSearchContainer: { padding: 16 },
  modalSearchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalSearchInputFocused: {
    borderColor: '#1085a8ff',
    backgroundColor: '#ffffff',
    shadowColor: '#1085a8ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalList: { maxHeight: 400 },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: { fontSize: 16, color: '#1f2937' },
  modalOptionSelected: { backgroundColor: '#e0f2fe' },
  modalOptionTextSelected: { color: '#1085a8ff', fontWeight: '600' },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#1085a8ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: '#cbd5e1' },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});