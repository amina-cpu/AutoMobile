import { useFocusEffect, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Dimensions, FlatList, Image, Linking,
  Modal, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import { supabase } from '../src/config/supabase';

const { width } = Dimensions.get('window');

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  darkTeal3: '#05696F',
  primaryGreen: '#41B975',
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
};

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

export default function ProductDetailScreen() {
  const route = useRoute();
  const { alertConfig, showSuccess, showError, showWarning, dismiss } = useAlert();
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
  const [likeCount, setLikeCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState(null);

  // Helper function to get image URL
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

  // Helper function to get user avatar URL (from 'user' bucket)
  const getUserAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    
    const { data } = supabase.storage
      .from('user')
      .getPublicUrl(avatarPath);
    
    return data?.publicUrl || null;
  };

  useFocusEffect(
    useCallback(() => {
      const carId = route.params?.carId;
      if (carId) {
        loadCarDetailsWithUser(carId);
      } else {
        setError('Car ID not provided');
        showError('Erreur', 'ID de voiture manquant');
        setLoading(false);
      }
    }, [route.params?.carId])
  );

  const loadCarDetailsWithUser = async (carId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👤 Fetching current user...');
      let authUser = null;
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.log('⚠️ Could not fetch user:', userError);
        } else if (user) {
          authUser = user;
          setCurrentUser(user);
          console.log('✅ Current user authenticated:', user.id);
        } else {
          console.log('⚠️ No authenticated user');
          setCurrentUser(null);
        }
      } catch (err) {
        console.log('❌ Error getting user:', err);
      }

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
        showError('Erreur', 'Voiture non trouvée');
        setLoading(false);
        return;
      }

      const carInfo = carData[0];
      setCar(carInfo);
      console.log(`✅ Car found: ${carInfo.brand} ${carInfo.model}`);
      console.log('🔍 Car seller_id:', carInfo.seller_id);
      console.log('🔍 Current user id:', authUser?.id);

      if (authUser && carInfo.seller_id === authUser.id) {
        setIsOwner(true);
        console.log('✅✅✅ USER IS OWNER - SHOWING EDIT/DELETE BUTTONS');
      } else {
        setIsOwner(false);
        console.log('❌❌❌ USER IS NOT OWNER - HIDING EDIT/DELETE BUTTONS');
      }

      // Load favorites count and check if current user liked this car
      await loadLikesData(carId, authUser?.id);

      // Fetch seller info
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
            const sellerInfo = sellerData[0];
            setSeller(sellerInfo);
            console.log(`✅ Seller found: ${sellerInfo.full_name || sellerInfo.email}`);

            // Set seller avatar URL
            if (sellerInfo.avatar_url) {
              console.log('🖼️ Seller avatar URL:', sellerInfo.avatar_url);
              setSellerAvatarUrl(sellerInfo.avatar_url);
            }

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

      // Fetch similar cars (same seller)
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

      // Fetch recommended cars (same brand)
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

      // Set car images with proper URLs
      if (carInfo.car_images && carInfo.car_images.length > 0) {
        const imagesWithUrls = carInfo.car_images.map(img => ({
          ...img,
          displayUrl: getImageUrl(img.image_url)
        }));
        setCarImages(imagesWithUrls);
        console.log(`✅ Found ${imagesWithUrls.length} images`);
      }

    } catch (err) {
      console.error('❌ Error loading car details:', err);
      setError(err.message || 'Failed to load car details');
      showError('Erreur', 'Impossible de charger les détails du véhicule');
    } finally {
      setLoading(false);
    }
  };

  const loadLikesData = async (carId, userId) => {
    try {
      console.log('❤️ Loading likes data for car:', carId);

      const countResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?car_id=eq.${carId}&select=id`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const countData = await countResponse.json();
      const totalLikes = Array.isArray(countData) ? countData.length : 0;
      setLikeCount(totalLikes);
      console.log(`✅ Total likes: ${totalLikes}`);

      if (userId) {
        const userLikeResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&car_id=eq.${carId}`,
          {
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        const userLikeData = await userLikeResponse.json();
        const hasLiked = Array.isArray(userLikeData) && userLikeData.length > 0;
        setLiked(hasLiked);
        console.log(`✅ User has liked: ${hasLiked}`);
      } else {
        setLiked(false);
      }
    } catch (err) {
      console.error('❌ Error loading likes data:', err);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      showWarning('Connexion requise', 'Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    if (!car) return;

    try {
      console.log('❤️ Toggling like for car:', car.id);

      if (liked) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${currentUser.id}&car_id=eq.${car.id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to remove like');
        }

        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        console.log('✅ Like removed');
      } else {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/favorites`,
          {
            method: 'POST',
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: currentUser.id,
              car_id: car.id
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to add like:', errorText);
          throw new Error('Failed to add like');
        }

        setLiked(true);
        setLikeCount(prev => prev + 1);
        console.log('✅ Like added');
      }
    } catch (err) {
      console.error('❌ Error toggling like:', err);
      showError('Erreur', 'Impossible de mettre à jour les favoris');
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
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteModalVisible(false);
    await deleteProduct();
  };

  const deleteProduct = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ Deleting car and images...');

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
      showSuccess('Supprimée', 'Annonce supprimée avec succès');
      
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      console.error('❌ Delete error:', err);
      showError('Erreur', 'Impossible de supprimer l\'annonce');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  
  const handlePhonePress = () => {
    if (seller?.phone) {
      Linking.openURL(`tel:${seller.phone}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${car.brand} ${car.model} - ${car.price}€` });
      showSuccess('Partagée', 'Annonce partagée avec succès');
    } catch (error) {
      console.error('Error:', error);
      showError('Erreur', 'Impossible de partager l\'annonce');
    }
  };

  const handleSellerProfileClick = () => {
    if (seller?.id) {
      console.log('👤 Navigating to seller profile:', seller.id);
      
      if (isOwner && currentUser?.id === seller.id) {
        console.log('✅ Navigating to own profile tab');
        router.push('/(tabs)/profile');
      } else {
        console.log('✅ Navigating to seller profile screen');
        router.push({
          pathname: '/sellerProfile',
          params: { sellerId: seller.id }
        });
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={{ marginTop: 12, color: COLORS.gray500 }}>Chargement...</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Car not found'}</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ marginTop: 20, backgroundColor: COLORS.darkTeal1, padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      <View style={styles.themeHeader}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleLikeToggle}
          >
            <Text style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {carImages.length > 0 ? (
            <Image 
              source={{ uri: carImages[currentImageIndex].displayUrl }} 
              style={styles.carImage}
              onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
            />
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
              <Image 
                source={{ uri: carImages[0].displayUrl }} 
                style={styles.carImageThumb} 
              />
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
                <ActivityIndicator size="small" color={COLORS.white} />
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
                <Text style={{ fontSize: 18, color: COLORS.gray400 }}>›</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={recommendedCars}
              renderItem={({ item }) => {
                const firstImageUrl = item.car_images && item.car_images.length > 0 
                  ? getImageUrl(item.car_images[0].image_url)
                  : null;

                return (
                  <TouchableOpacity 
                    style={styles.recommendedCard}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/product-detail',
                        params: { carId: item.id }
                      });
                    }}
                  >
                    {firstImageUrl ? (
                      <View style={styles.recommendedImage}>
                        <Image
                          source={{ uri: firstImageUrl }}
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
                );
              }}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            />
          </View>
        )}

        {seller && (
          <TouchableOpacity 
            style={styles.sellerSection}
            onPress={handleSellerProfileClick}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Vendu par</Text>
            <View style={{ height: 12 }} />
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  {sellerAvatarUrl ? (
                    <Image 
                      source={{ uri: sellerAvatarUrl }} 
                      style={styles.sellerAvatarImage}
                      onError={(e) => {
                        console.error('❌ Seller avatar load error:', e.nativeEvent.error);
                        console.log('🔗 Tried loading:', sellerAvatarUrl);
                      }}
                      onLoad={() => console.log('✅ Seller avatar loaded')}
                    />
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
              <View style={styles.profileArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteTitle}>Supprimer l'annonce</Text>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
            </Text>

            <View style={styles.deleteButtonContainer}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelDeleteText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={dismiss}
        duration={alertConfig.duration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 18, color: '#ef4444', textAlign: 'center', marginBottom: 20 },
  themeHeader: { backgroundColor: COLORS.darkTeal1, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50 },
  headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerBackText: { fontSize: 24, color: COLORS.white, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  likeCount: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  imageContainer: { height: 300, backgroundColor: COLORS.black, position: 'relative', overflow: 'hidden', marginTop: 0 },
  carImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  navButton: { position: 'absolute', top: '50%', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', marginTop: -20, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  navButtonLeft: { left: 12 },
  navButtonRight: { right: 12 },
  navButtonText: { fontSize: 20, color: COLORS.black, fontWeight: 'bold' },
  carInfoCard: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray300, marginHorizontal: 20, marginTop: 20, borderRadius: 12 },
  carInfoRow: { flexDirection: 'row', gap: 12 },
  carImageThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.gray200 },
  carInfoContent: { flex: 1, justifyContent: 'space-between' },
  carTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginBottom: 4 },
  carSubtitle: { fontSize: 12, color: COLORS.gray500, marginBottom: 8, lineHeight: 18 },
  price: { fontSize: 20, fontWeight: '700', color: COLORS.primaryGreen },
  ownerActionsContainer: { paddingHorizontal: 20, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  editButton: { flex: 1, backgroundColor: COLORS.darkTeal1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  recommendedSection: { backgroundColor: COLORS.white, marginBottom: 12, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray300 },
  sectionHeader: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray700 },
  sectionTitleWithArrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horizontalScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  recommendedCard: { width: 240, marginRight: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gray300, backgroundColor: COLORS.white, overflow: 'hidden' },
  recommendedImage: { width: '100%', height: 140, backgroundColor: COLORS.gray200, position: 'relative' },
  recommendedContent: { padding: 10 },
  recommendedTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray700, marginBottom: 4 },
  recommendedSubtitle: { fontSize: 11, color: COLORS.gray500, marginBottom: 8 },
  recommendedPrice: { fontSize: 15, fontWeight: '700', color: COLORS.primaryGreen, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  sellerSection: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray300, marginBottom: 12 },
  sellerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sellerInfo: { flexDirection: 'row', flex: 1, gap: 12 },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.darkTeal1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sellerAvatarImage: { width: '100%', height: '100%' },
  sellerAvatarText: { fontSize: 18, color: COLORS.white, fontWeight: '700' },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 13, fontWeight: '700', color: COLORS.gray700, marginBottom: 4 },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  star: { fontSize: 12, color: '#f59e0b' },
  ratingText: { fontSize: 11, color: COLORS.gray500 },
  sellerMeta: { fontSize: 10, color: COLORS.gray500, lineHeight: 14 },
  profileArrow: { justifyContent: 'center', alignItems: 'center', paddingLeft: 12 },
  arrowText: { fontSize: 16, color: COLORS.gray400, fontWeight: 'bold' },
  infoSection: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray300, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 12, color: COLORS.gray500, fontWeight: '500' },
  infoValue: { fontSize: 12, color: COLORS.gray700, fontWeight: '700' },
  descriptionSection: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray300, marginBottom: 12 },
  descriptionText: { fontSize: 13, color: COLORS.gray500, lineHeight: 20 },
  bottomButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray300, shadowColor: COLORS.black, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  phoneButton: { flex: 1, paddingVertical: 14, borderWidth: 2, borderColor: COLORS.darkTeal1, borderRadius: 8, alignItems: 'center' },
  phoneButtonText: { fontSize: 14, color: COLORS.darkTeal1, fontWeight: '700' },
  messageButton: { flex: 1, paddingVertical: 14, backgroundColor: COLORS.darkTeal1, borderRadius: 8, alignItems: 'center' },
  messageButtonText: { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  
  // Delete Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '80%', alignItems: 'center' },
  deleteTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray700, marginBottom: 8, textAlign: 'center' },
  deleteMessage: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  deleteButtonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  deleteModalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelDeleteButton: { backgroundColor: COLORS.gray200 },
  confirmDeleteButton: { backgroundColor: '#ef4444' },
  cancelDeleteText: { fontSize: 14, fontWeight: '600', color: COLORS.gray500 },
  confirmDeleteText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});