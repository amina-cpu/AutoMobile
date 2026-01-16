import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../src/config/supabase';
import { carService } from '../src/services/carService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1085a8ff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
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
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  imageSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
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
  },
  imageBoxFilled: {
    borderStyle: 'solid',
    borderColor: '#3b82f6',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
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
  removeButtonText: {
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
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default function SellScreen() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    fuel_type: 'Essence',
    transmission: 'Manuelle',
    mileage: '',
    description: '',
    condition: 'Bon',
    first_hand: false,
  });

  const fuelTypes = ['Essence', 'Diesel', 'Hybrid', 'Électrique'];
  const transmissions = ['Manuelle', 'Automatique'];
  const conditions = ['Excellent', 'Bon', 'Acceptable'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setImages(prev => [...prev, imageUri]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (carId) => {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const imageUri = images[i];
        const fileName = `car-${carId}-${i}-${Date.now()}.jpg`;
        const imagePath = `cars/${carId}/${fileName}`;

        // Read file as base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          fetch(imageUri)
            .then(res => res.blob())
            .then(blob => {
              reader.readAsDataURL(blob);
              reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
              };
            })
            .catch(reject);
        });

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(imagePath, decode(base64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(imagePath);

        // Save image metadata to database
        const { error: dbError } = await supabase
          .from('car_images')
          .insert([{
            car_id: carId,
            image_url: publicUrl,
            display_order: i,
          }]);

        if (dbError) throw dbError;

        uploadedImages.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }

    return uploadedImages;
  };

  // Helper function to decode base64
  const decode = (base64String) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bitmap = '';
    
    for (let i = 0; i < base64String.length; i++) {
      const char = base64String.charAt(i);
      const index = chars.indexOf(char);
      bitmap += index.toString(2).padStart(6, '0');
    }

    const bytes = [];
    for (let i = 0; i < bitmap.length; i += 8) {
      bytes.push(parseInt(bitmap.substr(i, 8), 2));
    }

    return new Uint8Array(bytes);
  };

  const validateForm = () => {
    if (!formData.brand.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer la marque');
      return false;
    }
    if (!formData.model.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le modèle');
      return false;
    }
    if (!formData.year) {
      Alert.alert('Erreur', 'Veuillez entrer l\'année');
      return false;
    }
    if (!formData.price) {
      Alert.alert('Erreur', 'Veuillez entrer le prix');
      return false;
    }
    if (!formData.mileage) {
      Alert.alert('Erreur', 'Veuillez entrer le kilométrage');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une image');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Get current user (optional - use demo user if not logged in)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000001'; // Demo user ID

      // Create car listing
      const carData = {
        seller_id: userId,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        mileage: parseInt(formData.mileage),
        description: formData.description,
        condition: formData.condition,
        first_hand: formData.first_hand,
        status: 'available',
      };

      const newCar = await carService.addCar(carData);

      // Upload images
      await uploadImages(newCar.id);

      Alert.alert('Succès', 'Voiture ajoutée avec succès!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setFormData({
              brand: '',
              model: '',
              year: '',
              price: '',
              fuel_type: 'Essence',
              transmission: 'Manuelle',
              mileage: '',
              description: '',
              condition: 'Bon',
              first_hand: false,
            });
            setImages([]);
          },
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendre votre voiture</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <Text style={styles.label}>Marque *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Toyota, BMW, Mercedes"
            value={formData.brand}
            onChangeText={(value) => handleInputChange('brand', value)}
            editable={!loading}
          />

          <Text style={styles.label}>Modèle *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: Yaris, X5, C-Class"
            value={formData.model}
            onChangeText={(value) => handleInputChange('model', value)}
            editable={!loading}
          />

          <View style={styles.row}>
            <View style={styles.rowInput}>
              <Text style={styles.label}>Année *</Text>
              <TextInput
                style={styles.input}
                placeholder="2020"
                value={formData.year}
                onChangeText={(value) => handleInputChange('year', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            <View style={styles.rowInput}>
              <Text style={styles.label}>Prix (€) *</Text>
              <TextInput
                style={styles.input}
                placeholder="15000"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Technical Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations techniques</Text>

          <Text style={styles.label}>Kilométrage (km) *</Text>
          <TextInput
            style={styles.input}
            placeholder="50000"
            value={formData.mileage}
            onChangeText={(value) => handleInputChange('mileage', value)}
            keyboardType="numeric"
            editable={!loading}
          />

          <Text style={styles.label}>Carburant</Text>
          <View style={styles.picker}>
            <FlatList
              data={fuelTypes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleInputChange('fuel_type', item)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: formData.fuel_type === item ? '#eff6ff' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      color: formData.fuel_type === item ? '#3b82f6' : '#1f2937',
                      fontWeight: formData.fuel_type === item ? '600' : '400',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />
          </View>

          <Text style={styles.label}>Transmission</Text>
          <View style={styles.picker}>
            <FlatList
              data={transmissions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleInputChange('transmission', item)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: formData.transmission === item ? '#eff6ff' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      color: formData.transmission === item ? '#3b82f6' : '#1f2937',
                      fontWeight: formData.transmission === item ? '600' : '400',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />
          </View>

          <Text style={styles.label}>État de la voiture</Text>
          <View style={styles.picker}>
            <FlatList
              data={conditions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleInputChange('condition', item)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: formData.condition === item ? '#eff6ff' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      color: formData.condition === item ? '#3b82f6' : '#1f2937',
                      fontWeight: formData.condition === item ? '600' : '400',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Décrivez l'état, les équipements, l'historique..."
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            editable={!loading}
          />
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <View style={styles.imageSection}>
            <Text style={styles.imageSectionTitle}>
              Photos ({images.length})
            </Text>

            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((imageUri, index) => (
                  <View key={index} style={[styles.imageBox, styles.imageBoxFilled]}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                      disabled={loading}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 10 && (
                  <View style={styles.imageBox}>
                    <TouchableOpacity
                      onPress={pickImage}
                      disabled={loading}
                      style={{ justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 32, color: '#3b82f6' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {images.length === 0 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={loading}
              >
                <Text style={styles.addImageButtonText}>📸 Ajouter des photos</Text>
              </TouchableOpacity>
            )}

            {images.length > 0 && images.length < 10 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={loading}
              >
                <Text style={styles.addImageButtonText}>+ Ajouter une photo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.errorText}>
              Ajoutez au moins 1 photo (maximum 10)
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.submitButtonText}>Publier l'annonce</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}