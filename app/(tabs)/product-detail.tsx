import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../src/config/supabase';
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  breadcrumb: {
    flex: 1,
    marginHorizontal: 12,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748b',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageCarousel: {
    height: 300,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carImagePlaceholder: {
    fontSize: 120,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  leftButton: {
    left: 16,
  },
  rightButton: {
    right: 16,
  },
  navButtonText: {
    fontSize: 28,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  imageCounterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainContent: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  carBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  carName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  carModel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  specChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  feesText: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  statusText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionCard: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748b',
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  picker: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  pickerItemTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  // Image management styles
  imageSection: {
    marginBottom: 24,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d5e0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  imageBoxFilled: {
    borderStyle: 'solid',
    borderColor: '#3b82f6',
  },
  editImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [car, setCar] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const fuelTypes = ['Essence', 'Diesel', 'Hybrid', 'Électrique'];
  const transmissions = ['Manuelle', 'Automatique'];
  const conditions = ['Excellent', 'Bon', 'Acceptable'];

  useFocusEffect(
    useCallback(() => {
      const carId = route.params?.carId;
      if (carId) {
        loadCarDetails(carId);
      } else {
        setError('Car ID not provided');
        setLoading(false);
      }
    }, [route.params?.carId])
  );

  const loadCarDetails = async (carId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await carService.getCarById(carId);
      
      if (!data) {
        setError('Car not found');
        return;
      }
      
      setCar(data);
      setEditFormData({
        brand: data.brand || '',
        model: data.model || '',
        year: data.year?.toString() || '',
        price: data.price?.toString() || '',
        fuel_type: data.fuel_type || 'Essence',
        transmission: data.transmission || 'Manuelle',
        mileage: data.mileage?.toString() || '',
        description: data.description || '',
        condition: data.condition || 'Bon',
      });

      if (data.car_images && data.car_images.length > 0) {
        setCarImages(data.car_images);
        setEditImages(data.car_images);
      } else {
        setCarImages([]);
        setEditImages([]);
      }
      setNewImages([]);
    } catch (err) {
      console.error('Error loading car details:', err);
      setError(err.message || 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setNewImages(prev => [...prev, imageUri]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeExistingImage = async (imageId, index) => {
    Alert.alert(
      'Supprimer l\'image',
      'Voulez-vous vraiment supprimer cette image?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from database
              const { error } = await supabase
                .from('car_images')
                .delete()
                .eq('id', imageId);

              if (error) throw error;

              // Remove from state
              setEditImages(prev => prev.filter((_, i) => i !== index));
              Alert.alert('Succès', 'Image supprimée');
            } catch (error) {
              console.error('Error deleting image:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'image');
            }
          },
        },
      ]
    );
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (carId) => {
  const uploadedImages = [];

  for (let i = 0; i < newImages.length; i++) {
    try {
      const imageUri = newImages[i];
      const fileName = `car-${carId}-${Date.now()}-${i}.jpg`;
      const imagePath = `cars/${carId}/${fileName}`;

      // Convert URI to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }

      // Upload to storage with explicit options
      const { data, error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(imagePath, bytes, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(imagePath);

      console.log('Uploaded image URL:', publicUrl);

      // Save image metadata to database
      const displayOrder = editImages.length + i;
      const { error: dbError } = await supabase
        .from('car_images')
        .insert([{
          car_id: carId,
          image_url: publicUrl,
          display_order: displayOrder,
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      uploadedImages.push(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  return uploadedImages;
};

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);

      const updateData = {
        brand: editFormData.brand,
        model: editFormData.model,
        year: parseInt(editFormData.year),
        price: parseFloat(editFormData.price),
        fuel_type: editFormData.fuel_type,
        transmission: editFormData.transmission,
        mileage: parseInt(editFormData.mileage),
        description: editFormData.description,
        condition: editFormData.condition,
      };

      await carService.updateCar(car.id, updateData);

      // Upload new images if any
      if (newImages.length > 0) {
        await uploadNewImages(car.id);
      }

      Alert.alert('Succès', 'Voiture mise à jour avec succès!');
      setEditModalVisible(false);
      loadCarDetails(car.id);
    } catch (error) {
      console.error('Error updating car:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Car not found'}</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: '#3b82f6', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>
            Toutes nos voitures › {car.brand} › {car.model?.split(' - ')[0]}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {carImages.length > 0 ? (
            <Image 
              source={{ uri: carImages[currentImageIndex].image_url }} 
              style={styles.carImage} 
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.carImagePlaceholder}>🚗</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setLiked(!liked)}
            >
              <Text style={{ fontSize: 20, color: liked ? '#ef4444' : '#64748b' }}>
                {liked ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={{ fontSize: 18 }}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Buttons */}
          {carImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.leftButton]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.rightButton]}
                onPress={() => setCurrentImageIndex(Math.min(carImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === carImages.length - 1}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>

              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {carImages.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.carBrand}>{car.brand}</Text>
          <Text style={styles.carName}>{car.model?.split(' - ')[0] || car.model}</Text>
          <Text style={styles.carModel}>{car.model}</Text>

          {/* Specs */}
          <View style={styles.specsRow}>
            <View style={styles.specChip}>
              <Text style={styles.specText}>{car.year}</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specText}>{car.mileage} km</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specText}>{car.fuel_type}</Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specText}>{car.transmission}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Prix</Text>
            <Text style={styles.price}>{car.price} €</Text>
            <Text style={styles.feesText}>+ 299 € de frais de dossier</Text>
          </View>

          {/* Status Badge */}
          {(car.status === 'reserved' || car.status === 'sold') && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {car.status === 'reserved' ? '🔒 Véhicule réservé' : '✓ Véhicule vendu'}
              </Text>
            </View>
          )}

          {/* Description */}
          {car.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          )}

          {/* Key Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations clés</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marque</Text>
                <Text style={styles.infoValue}>{car.brand}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kilométrage</Text>
                <Text style={styles.infoValue}>{car.mileage} km</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Année</Text>
                <Text style={styles.infoValue}>{car.year}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Carburant</Text>
                <Text style={styles.infoValue}>{car.fuel_type}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Transmission</Text>
                <Text style={styles.infoValue}>{car.transmission}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la voiture</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.label}>Marque</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.brand}
                  onChangeText={(value) => handleEditInputChange('brand', value)}
                  editable={!editLoading}
                />

                <Text style={styles.label}>Modèle</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.model}
                  onChangeText={(value) => handleEditInputChange('model', value)}
                  editable={!editLoading}
                />

                <View style={styles.row}>
                  <View style={styles.rowInput}>
                    <Text style={styles.label}>Année</Text>
                    <TextInput
                      style={styles.input}
                      value={editFormData.year}
                      onChangeText={(value) => handleEditInputChange('year', value)}
                      keyboardType="numeric"
                      editable={!editLoading}
                    />
                  </View>
                  <View style={styles.rowInput}>
                    <Text style={styles.label}>Prix (€)</Text>
                    <TextInput
                      style={styles.input}
                      value={editFormData.price}
                      onChangeText={(value) => handleEditInputChange('price', value)}
                      keyboardType="decimal-pad"
                      editable={!editLoading}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Kilométrage (km)</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.mileage}
                  onChangeText={(value) => handleEditInputChange('mileage', value)}
                  keyboardType="numeric"
                  editable={!editLoading}
                />

                <Text style={styles.label}>Carburant</Text>
                <View style={styles.picker}>
                  {fuelTypes.map((fuel) => (
                    <TouchableOpacity
                      key={fuel}
                      style={[
                        styles.pickerItem,
                        editFormData.fuel_type === fuel && styles.pickerItemSelected
                      ]}
                      onPress={() => handleEditInputChange('fuel_type', fuel)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        editFormData.fuel_type === fuel && styles.pickerItemTextSelected
                      ]}>
                        {fuel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Transmission</Text>
                <View style={styles.picker}>
                  {transmissions.map((trans) => (
                    <TouchableOpacity
                      key={trans}
                      style={[
                        styles.pickerItem,
                        editFormData.transmission === trans && styles.pickerItemSelected
                      ]}
                      onPress={() => handleEditInputChange('transmission', trans)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        editFormData.transmission === trans && styles.pickerItemTextSelected
                      ]}>
                        {trans}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={editFormData.description}
                  onChangeText={(value) => handleEditInputChange('description', value)}
                  multiline
                  editable={!editLoading}
                />
              </View>

              {/* Images Section */}
              <View style={styles.imageSection}>
                <Text style={styles.imageSectionTitle}>
                  Images actuelles ({editImages.length})
                </Text>

                <View style={styles.imageGrid}>
                  {/* Existing images */}
                  {editImages.map((image, index) => (
                    <View key={`existing-${image.id}`} style={[styles.imageBox, styles.imageBoxFilled]}>
                      <Image source={{ uri: image.image_url }} style={styles.editImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeExistingImage(image.id, index)}
                        disabled={editLoading}
                      >
                        <Text style={styles.removeImageButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* New images */}
                  {newImages.map((imageUri, index) => (
                    <View key={`new-${index}`} style={[styles.imageBox, styles.imageBoxFilled]}>
                      <Image source={{ uri: imageUri }} style={styles.editImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeNewImage(index)}
                        disabled={editLoading}
                      >
                        <Text style={styles.removeImageButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add image button */}
                  {(editImages.length + newImages.length) < 10 && (
                    <View style={styles.imageBox}>
                      <TouchableOpacity
                        onPress={pickEditImage}
                        disabled={editLoading}
                        style={{ justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 32, color: '#3b82f6' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {(editImages.length + newImages.length) < 10 && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickEditImage}
                    disabled={editLoading}
                  >
                    <Text style={styles.addImageButtonText}>+ Ajouter une photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, editLoading && styles.saveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={editLoading}
            >
              {editLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}