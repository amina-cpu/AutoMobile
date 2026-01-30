import { useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
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

const { width } = Dimensions.get('window');

const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

const brands = ['AUDI', 'BMW', 'CITROEN', 'FIAT', 'FORD', 'MERCEDES-BENZ', 'OPEL', 'PEUGEOT', 'RENAULT', 'VOLKSWAGEN', 'TOYOTA', 'HONDA'];
const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Hybride Rechargeable', 'Électrique', 'GPL', 'Autre'];
const transmissions = ['Manuelle', 'Automatique'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

export default function EditCarScreen() {
  const route = useRoute();
  const { carId, carData: carDataString } = route.params;
  const carData = JSON.parse(carDataString);

  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [formData, setFormData] = useState({
    brand: carData?.brand || '',
    model: carData?.model || '',
    year: carData?.year?.toString() || '',
    mileage: carData?.mileage?.toString() || '',
    fuel_type: carData?.fuel_type || '',
    transmission: carData?.transmission || '',
    price: carData?.price?.toString() || '',
    description: carData?.description || '',
    city: carData?.city || '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getCurrentUser();
    loadExistingImages();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('❌ Error getting user:', error);
    }
  };

  const loadExistingImages = async () => {
    try {
      setLoadingImages(true);
      const { data, error } = await supabase
        .from('car_images')
        .select('*')
        .eq('car_id', carId)
        .order('display_order');

      if (error) throw error;

      const imagesWithUrls = data.map(img => ({
        ...img,
        displayUrl: getImageUrl(img.image_url)
      }));

      setExistingImages(imagesWithUrls);
    } catch (error) {
      console.error('❌ Error loading images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(imagePath);
    
    return data?.publicUrl || null;
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

  const pickNewImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewImages(prev => [...prev, {
          uri: result.assets[0].uri,
          id: `new-${Date.now()}`
        }]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeNewImage = (imageId) => {
    setNewImages(prev => prev.filter(img => img.id !== imageId));
  };

  const uploadImageToStorage = async (imageUri, photoIndex) => {
    try {
      const fileName = `${carId}_${Date.now()}_${photoIndex}.jpg`;
      const filePath = `cars/${carId}/${fileName}`;

      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  };

  const saveImageToDatabase = async (imagePath, displayOrder, accessToken) => {
    try {
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
        throw new Error('Failed to save image to database');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      throw error;
    }
  };

  const deleteImagesFromStorage = async (imageIds, accessToken) => {
    for (const imageId of imageIds) {
      try {
        // Get the image URL from database
        const { data: imageData } = await supabase
          .from('car_images')
          .select('image_url')
          .eq('id', imageId)
          .single();

        if (imageData?.image_url) {
          // Delete from storage
          await supabase.storage
            .from('car-images')
            .remove([imageData.image_url]);
        }

        // Delete from database
        await supabase
          .from('car_images')
          .delete()
          .eq('id', imageId);

      } catch (error) {
        console.error(`❌ Error deleting image ${imageId}:`, error);
      }
    }
  };

  const handleUpdate = async () => {
    if (!formData.brand || !formData.model || !formData.year || !formData.price || !formData.fuel_type || !formData.transmission || !formData.mileage) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Update car details
      const { error } = await supabase
        .from('cars')
        .update({
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year),
          price: parseInt(formData.price),
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          mileage: parseInt(formData.mileage),
          description: formData.description,
          city: formData.city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', carId);

      if (error) throw error;

      // Delete marked images
      if (imagesToDelete.length > 0) {
        await deleteImagesFromStorage(imagesToDelete, session.access_token);
      }

      // Upload new images
      if (newImages.length > 0) {
        const startOrder = existingImages.length;
        for (let i = 0; i < newImages.length; i++) {
          const filePath = await uploadImageToStorage(newImages[i].uri, i);
          await saveImageToDatabase(filePath, startOrder + i, session.access_token);
        }
      }

      Alert.alert('Succès', 'Annonce mise à jour avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour l\'annonce');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredModalData = modalData.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalImages = existingImages.length + newImages.length;
  const canAddMore = totalImages < 8;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.headerBackText}>‹</Text>
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
            
            {/* Images Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.sectionSubtitle}>
                {totalImages}/8 photos • Ajoutez jusqu'à 8 photos
              </Text>

              {loadingImages ? (
                <View style={styles.loadingImages}>
                  <ActivityIndicator color="#1085a8ff" />
                </View>
              ) : (
                <View style={styles.imagesGrid}>
                  {/* Existing Images */}
                  {existingImages.map((image, index) => (
                    <View key={image.id} style={styles.imageBox}>
                      <Image source={{ uri: image.displayUrl }} style={styles.imagePreview} />
                      <View style={styles.imageLabel}>
                        <Text style={styles.imageLabelText}>Photo {index + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeExistingImage(image.id)}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* New Images */}
                  {newImages.map((image, index) => (
                    <View key={image.id} style={styles.imageBox}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <View style={[styles.imageLabel, styles.newImageLabel]}>
                        <Text style={styles.imageLabelText}>Nouvelle</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeNewImage(image.id)}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Image Button */}
                  {canAddMore && (
                    <TouchableOpacity style={styles.addImageBox} onPress={pickNewImage}>
                      <Text style={styles.addImageIcon}>+</Text>
                      <Text style={styles.addImageText}>Ajouter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Car Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Détails du véhicule</Text>

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
                  placeholder="Ex: A4"
                  value={formData.model}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, model: value }))}
                  editable={!loading}
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

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Kilométrage <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 50000"
                  value={formData.mileage}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, mileage: value }))}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Carburant <Text style={styles.required}>*</Text></Text>
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
                <Text style={styles.fieldLabel}>Transmission <Text style={styles.required}>*</Text></Text>
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

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Prix € <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 15000"
                  value={formData.price}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                  keyboardType="number-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Paris"
                  value={formData.city}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  editable={!loading}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="Décrivez votre véhicule..."
                  value={formData.description}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  multiline
                  numberOfLines={5}
                  editable={!loading}
                  textAlignVertical="top"
                />
              </View>
            </View>

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
                {modalType === 'fuel_type' && 'Carburant'}
                {modalType === 'transmission' && 'Transmission'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerBackButton: { 
  width: 40, 
  height: 40, 
  borderRadius: 18,              // ← Changed from 20
  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
  justifyContent: 'center', 
  alignItems: 'center' 
},

headerBackText: { 
  fontSize: 28,                  // ← Changed from 20
  color: '#fff', 
  fontWeight: 'bold',
  marginBottom: 10               // ← Add this line
},
  headerContainer: { backgroundColor: '#1085a8ff', paddingHorizontal: 20, paddingVertical: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 24, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  formContainer: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  loadingImages: { padding: 40, alignItems: 'center' },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageBox: { width: (width - 52) / 2, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#fff', borderWidth: 2, borderColor: '#1085a8ff' },
  imagePreview: { width: '100%', height: '100%' },
  imageLabel: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: '#1085a8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newImageLabel: { backgroundColor: '#22c55e' },
  imageLabelText: { color: '#ffffff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  removeImageButton: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  addImageBox: { width: (width - 52) / 2, aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  addImageIcon: { fontSize: 48, color: '#94a3b8', marginBottom: 8 },
  addImageText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  required: { color: '#ef4444' },
  pickerButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerButtonText: { fontSize: 16, color: '#1f2937' },
  pickerPlaceholder: { color: '#94a3b8' },
  pickerArrow: { fontSize: 20, color: '#64748b' },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1f2937' },
  descriptionInput: { height: 120, paddingTop: 14 },
  submitButton: { backgroundColor: '#1085a8ff', borderRadius: 12, paddingVertical: 16, marginTop: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  modalSearchContainer: { padding: 16 },
  modalSearchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 2, borderColor: 'transparent' },
  modalList: { maxHeight: 400 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionText: { fontSize: 16, color: '#1f2937' },
  modalOptionSelected: { backgroundColor: '#e0f2fe' },
  modalOptionTextSelected: { color: '#1085a8ff', fontWeight: '600' },
});