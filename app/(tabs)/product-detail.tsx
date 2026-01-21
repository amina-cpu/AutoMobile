import { useFocusEffect, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Linking,
  ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../src/config/supabase';

const { width } = Dimensions.get('window');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

export default function ProductDetailScreen() {
  const route = useRoute();
  const [car, setCar] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [similarCars, setSimilarCars] = useState([]);
  const [recommendedCars, setRecommendedCars] = useState([]);
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(4);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const carId = route.params?.carId;
      if (carId) {
        getCurrentUser();
        loadCarDetails(carId);
      } else {
        setError('Car ID not provided');
        setLoading(false);
      }
    }, [route.params?.carId])
  );

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (err) {
      console.log('Could not fetch current user:', err);
    }
  };

  const loadCarDetails = async (carId) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch car details with direct fetch
      console.log('🚗 Fetching car details for ID:', carId);
      const carResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&id=eq.${carId}`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const carData = await carResponse.json();
      
      if (!carData || carData.length === 0) {
        setError('Car not found');
        setLoading(false);
        return;
      }

      const carInfo = carData[0];
      setCar(carInfo);
      console.log(`✅ Car found: ${carInfo.brand} ${carInfo.model}`);

      // Check if current user is owner
      if (currentUser && carInfo.seller_id === currentUser.id) {
        setIsOwner(true);
        console.log('✅ User is owner of this car');
      }

      // Fetch seller info with direct fetch
      if (carInfo.seller_id) {
        console.log('👤 Fetching seller info...');
        try {
          const sellerResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?select=*&id=eq.${carInfo.seller_id}`,
            {
              headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          const sellerData = await sellerResponse.json();
          if (sellerData && sellerData.length > 0) {
            setSeller(sellerData[0]);
            console.log(`✅ Seller found: ${sellerData[0].full_name || sellerData[0].email}`);

            // Fetch seller's other cars
            const sellerCarsResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/cars?select=id&seller_id=eq.${carInfo.seller_id}`,
              {
                headers: {
                  'apikey': API_KEY,
                  'Content-Type': 'application/json'
                }
              }
            );

            const sellerCars = await sellerCarsResponse.json();
            setSellerStats({
              totalListings: sellerCars?.length || 0,
              rating: 4.8,
              reviews: 142,
              siret: '92752127800014',
              lastActivity: 'il y a 1 minute'
            });
          }
        } catch (err) {
          console.log('Could not fetch seller info:', err);
        }
      }

      // Fetch similar cars (same seller) - WITHOUT users join
      if (carInfo.seller_id) {
        console.log('🚗 Fetching similar cars...');
        try {
          const similarResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&seller_id=eq.${carInfo.seller_id}&id=neq.${carId}&limit=5`,
            {
              headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          const similarData = await similarResponse.json();
          if (similarData && Array.isArray(similarData) && similarData.length > 0) {
            setSimilarCars(similarData);
            console.log(`✅ Found ${similarData.length} similar cars`);
          }
        } catch (err) {
          console.log('Could not fetch similar cars:', err);
        }
      }

      // Fetch recommended cars (same brand) - WITHOUT users join
      if (carInfo.brand) {
        console.log('🚗 Fetching recommended cars...');
        try {
          const recommendedResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&brand=eq.${encodeURIComponent(carInfo.brand)}&id=neq.${carId}&limit=5`,
            {
              headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          const recommendedData = await recommendedResponse.json();
          if (recommendedData && Array.isArray(recommendedData) && recommendedData.length > 0) {
            setRecommendedCars(recommendedData);
            console.log(`✅ Found ${recommendedData.length} recommended cars`);
          }
        } catch (err) {
          console.log('Could not fetch recommended cars:', err);
        }
      }

      // Set car images
      if (carInfo.car_images && carInfo.car_images.length > 0) {
        setCarImages(carInfo.car_images);
        console.log(`✅ Found ${carInfo.car_images.length} images`);
      }

    } catch (err) {
      console.error('❌ Error loading car details:', err);
      setError(err.message || 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = () => {
    router.push({
      pathname: '/EditCarScreen',
      params: { 
        carId: car.id, 
        carData: JSON.stringify(car) 
      }
    });
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Êtes-vous sûr de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: deleteProduct
        }
      ]
    );
  };

  const deleteProduct = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ Deleting car and images...');

      // Delete car images first with direct fetch
      if (carImages.length > 0) {
        console.log('📸 Deleting car images...');
        for (const img of carImages) {
          try {
            await fetch(
              `${SUPABASE_URL}/rest/v1/car_images?id=eq.${img.id}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': API_KEY,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log(`✅ Image ${img.id} deleted`);
          } catch (err) {
            console.error(`Error deleting image ${img.id}:`, err);
          }
        }
      }

      // Delete car with direct fetch
      console.log('🚗 Deleting car...');
      const deleteResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?id=eq.${car.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete car: ${deleteResponse.status}`);
      }

      console.log('✅ Car deleted successfully');
      Alert.alert('Succès', 'Annonce supprimée avec succès', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (err) {
      console.error('❌ Delete error:', err);
      Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  
  const handlePhonePress = () => {
    if (seller?.phone) {
      Alert.alert('Numéro', seller.phone, [
        { text: 'Appeler', onPress: () => Linking.openURL(`tel:${seller.phone}`) },
        { text: 'Copier', onPress: () => console.log('copy') },
        { text: 'Annuler', style: 'cancel' }
      ]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${car.brand} ${car.model} - ${car.price}€` });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: '#666' }}>Chargement...</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Car not found'}</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ marginTop: 20, backgroundColor: '#1085a8ff', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1085a8ff" translucent />
      
      <View style={styles.themeHeader}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Text style={{ fontSize: 20 }}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              setLiked(!liked);
              setLikeCount(liked ? likeCount - 1 : likeCount + 1);
            }}
          >
            <Text style={styles.likeCount}>{likeCount}</Text>
            <Text style={{ fontSize: 16 }}>❤️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {carImages.length > 0 ? (
            <Image source={{ uri: carImages[currentImageIndex].image_url }} style={styles.carImage} />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 80 }}>🚗</Text>
            </View>
          )}

          {carImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={() => setCurrentImageIndex(Math.min(carImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === carImages.length - 1}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.carInfoCard}>
          <View style={styles.carInfoRow}>
            {carImages.length > 0 && (
              <Image source={{ uri: carImages[0].image_url }} style={styles.carImageThumb} />
            )}
            <View style={styles.carInfoContent}>
              <View>
                <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
                <Text style={styles.carSubtitle}>
                  {car.year} · {car.mileage} km · {car.fuel_type}
                </Text>
              </View>
              <Text style={styles.price}>{car.price} €</Text>
            </View>
          </View>
        </View>

        {isOwner && (
          <View style={styles.ownerActionsContainer}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEditProduct}
              disabled={deleting}
            >
              <Text style={styles.editButtonText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
              onPress={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {recommendedCars.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWithArrow}>
                <Text style={styles.sectionTitle}>Ces annonces peuvent vous intéresser</Text>
                <Text style={{ fontSize: 18, color: '#9ca3af' }}>›</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={recommendedCars}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recommendedCard}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/product-detail',
                      params: { carId: item.id }
                    });
                  }}
                >
                  {item.car_images && item.car_images.length > 0 ? (
                    <View style={styles.recommendedImage}>
                      <Image
                        source={{ uri: item.car_images[0].image_url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={[styles.recommendedImage, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 50 }}>🚗</Text>
                    </View>
                  )}
                  <View style={styles.recommendedContent}>
                    <Text style={styles.recommendedTitle}>{item.brand} {item.model}</Text>
                    <Text style={styles.recommendedSubtitle}>
                      {item.year} • {item.mileage} km • {item.fuel_type}
                    </Text>
                    <Text style={styles.recommendedPrice}>{item.price} €</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            />
          </View>
        )}

        {seller && (
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Vendu par</Text>
            <View style={{ height: 12 }} />
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  {seller.avatar_url ? (
                    <Image source={{ uri: seller.avatar_url }} style={styles.sellerAvatarImage} />
                  ) : (
                    <Text style={styles.sellerAvatarText}>{getInitials(seller.full_name || seller.email)}</Text>
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{seller.full_name || 'Utilisateur'}</Text>
                  <View style={styles.sellerRating}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingText}>{sellerStats?.rating} ({sellerStats?.reviews})</Text>
                  </View>
                  <Text style={styles.sellerMeta}>📧 {seller.email}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Les informations clés</Text>
          <View style={{ height: 8 }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏷️ Marque</Text>
            <Text style={styles.infoValue}>{car.brand}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🚙 Modèle</Text>
            <Text style={styles.infoValue}>{car.model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Année</Text>
            <Text style={styles.infoValue}>{car.year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🛣️ Kilométrage</Text>
            <Text style={styles.infoValue}>{car.mileage} km</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⚡ Énergie</Text>
            <Text style={styles.infoValue}>{car.fuel_type}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>⚙️ Boîte</Text>
            <Text style={styles.infoValue}>{car.transmission}</Text>
          </View>
        </View>

        {car.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={{ height: 8 }} />
            <Text style={styles.descriptionText}>{car.description}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {!isOwner && (
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.phoneButton} onPress={handlePhonePress}>
            <Text style={styles.phoneButtonText}>Voir le numéro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5'},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 18, color: '#ef4444', textAlign: 'center', marginBottom: 20 },
  themeHeader: { backgroundColor: '#1085a8ff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerBackText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  likeCount: { fontSize: 12, fontWeight: '700', color: '#fff' },
  imageContainer: { height: 300, backgroundColor: '#000', position: 'relative', overflow: 'hidden', marginTop: 0 },
  carImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  navButton: { position: 'absolute', top: '50%', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  navButtonLeft: { left: 12 },
  navButtonRight: { right: 12 },
  navButtonText: { fontSize: 20, color: '#000', fontWeight: 'bold' },
  carInfoCard: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginHorizontal: 20, marginTop: 20, borderRadius: 12 },
  carInfoRow: { flexDirection: 'row', gap: 12 },
  carImageThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  carInfoContent: { flex: 1, justifyContent: 'space-between' },
  carTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  carSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  price: { fontSize: 20, fontWeight: '700', color: '#1085a8ff' },
  ownerActionsContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  editButton: { flex: 1, backgroundColor: '#1085a8ff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  recommendedSection: { backgroundColor: '#ffffff', marginBottom: 12, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sectionHeader: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  sectionTitleWithArrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horizontalScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  recommendedCard: { width: 240, marginRight: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', overflow: 'hidden' },
  recommendedImage: { width: '100%', height: 140, backgroundColor: '#f1f5f9', position: 'relative' },
  recommendedContent: { padding: 10 },
  recommendedTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  recommendedSubtitle: { fontSize: 11, color: '#6b7280', marginBottom: 8 },
  recommendedPrice: { fontSize: 15, fontWeight: '700', color: '#1085a8ff', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sellerSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  sellerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sellerInfo: { flexDirection: 'row', flex: 1, gap: 12 },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sellerAvatarImage: { width: '100%', height: '100%' },
  sellerAvatarText: { fontSize: 18, color: '#ffffff', fontWeight: '700' },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  star: { fontSize: 12, color: '#f59e0b' },
  ratingText: { fontSize: 11, color: '#6b7280' },
  sellerMeta: { fontSize: 10, color: '#6b7280', lineHeight: 14 },
  infoSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 12, color: '#1f2937', fontWeight: '700' },
  descriptionSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  descriptionText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },

  bottomButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  phoneButton: { flex: 1, paddingVertical: 14, borderWidth: 2, borderColor: '#1085a8ff', borderRadius: 8, alignItems: 'center' },
  phoneButtonText: { fontSize: 14, color: '#1085a8ff', fontWeight: '700' },
  messageButton: { flex: 1, paddingVertical: 14, backgroundColor: '#1085a8ff', borderRadius: 8, alignItems: 'center' },
  messageButtonText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
});