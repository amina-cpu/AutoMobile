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
        console.log(' Fetching similar cars...');
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
        <ActivityIndicator size="large" color={COLORS.darkTeal1} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorText}>{error || 'Voiture non trouvée'}</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      {/* Floating Header with absolute position */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()}>
          <Text style={styles.headerIconText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          {/* <TouchableOpacity style={styles.headerIconButton} onPress={handleShare}>
            <Text style={styles.headerIconText}>⤴</Text>
          </TouchableOpacity> */}
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={handleLikeToggle}
          >
            <Text style={styles.headerIconText}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Full Width Image Gallery */}
        <View style={styles.imageGallery}>
          {carImages.length > 0 ? (
            <Image 
              source={{ uri: carImages[currentImageIndex].displayUrl }} 
              style={styles.carImage}
              onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>🚗</Text>
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

              {/* Image Counter */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{carImages.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Title and Price Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleContent}>
                <Text style={styles.carBrand}>{car.brand}</Text>
                <Text style={styles.carModel}>{car.model}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Prix</Text>
                <Text style={styles.price}>{car.price.toLocaleString('fr-FR')} €</Text>
              </View>
            </View>
            
            {/* Quick Specs Pills */}
            <View style={styles.quickSpecs}>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}> {car.year}</Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}> {car.mileage.toLocaleString('fr-FR')} km</Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specPillText}> {car.fuel_type}</Text>
              </View>
            </View>
          </View>

          {/* Owner Actions */}
          {isOwner && (
            <View style={styles.ownerActionsContainer}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEditProduct}
                disabled={deleting}
              >
                <Text style={styles.editButtonIcon}></Text>
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
                onPress={handleDeleteProduct}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.deleteButtonIcon}></Text>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Description Section */}
          {car.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}> Description</Text>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          )}

          {/* Seller Section */}
          {seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}> Vendu par</Text>
              <TouchableOpacity 
                style={styles.sellerCard}
                onPress={handleSellerProfileClick}
                activeOpacity={0.7}
              >
                <View style={styles.sellerAvatar}>
                  {sellerAvatarUrl ? (
                    <Image 
                      source={{ uri: sellerAvatarUrl }} 
                      style={styles.sellerAvatarImage}
                      onError={(e) => console.error('❌ Seller avatar load error:', e.nativeEvent.error)}
                    />
                  ) : (
                    <Text style={styles.sellerAvatarText}>{getInitials(seller.full_name || seller.email)}</Text>
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{seller.full_name || 'Utilisateur'}</Text>
                  <View style={styles.sellerRating}>
                    {/* <Text style={styles.star}></Text>
                    <Text style={styles.ratingText}>{sellerStats?.rating} ({sellerStats?.reviews} avis)</Text> */}
                  </View>
                  <Text style={styles.sellerEmail}>{seller.email}</Text>
                </View>
                <View style={styles.sellerArrow}>
                  <Text style={styles.arrowText}></Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Specifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}> Caractéristiques</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Marque</Text>
                  <Text style={styles.specValue}>{car.brand}</Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Modèle</Text>
                  <Text style={styles.specValue}>{car.model}</Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Année</Text>
                  <Text style={styles.specValue}>{car.year}</Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Kilométrage</Text>
                  <Text style={styles.specValue}>{car.mileage.toLocaleString('fr-FR')} km</Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Énergie</Text>
                  <Text style={styles.specValue}>{car.fuel_type}</Text>
                </View>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specIcon}></Text>
                <View style={styles.specContent}>
                  <Text style={styles.specLabel}>Transmission</Text>
                  <Text style={styles.specValue}>{car.transmission}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recommended Cars Section */}
          {recommendedCars.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}> Annonces similaires</Text>
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
                      <View style={styles.recommendedImageContainer}>
                        {firstImageUrl ? (
                          <Image
                            source={{ uri: firstImageUrl }}
                            style={styles.recommendedImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.recommendedImagePlaceholder}>
                            <Text style={styles.recommendedImagePlaceholderIcon}>🚗</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.recommendedContent}>
                        <Text style={styles.recommendedTitle} numberOfLines={1}>
                          {item.brand} {item.model}
                        </Text>
                        <Text style={styles.recommendedSubtitle} numberOfLines={1}>
                          {item.year} • {item.mileage.toLocaleString('fr-FR')} km
                        </Text>
                        <Text style={styles.recommendedPrice}>
                          {item.price.toLocaleString('fr-FR')} €
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedList}
              />
            </View>
          )}

          <View style={{ height: 20 }} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      {!isOwner && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.phoneButton} onPress={handlePhonePress}>
            <Text style={styles.phoneButtonIcon}></Text>
            <Text style={styles.phoneButtonText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.messageButtonIcon}></Text>
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
            <Text style={styles.deleteModalIcon}>🗑️</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.gray100 
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: { 
    fontSize: 18, 
    color: COLORS.gray700, 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 26,
  },
  errorButton: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Floating Header
  floatingHeader: { 
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  headerIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  
  // Image Gallery
  imageGallery: { 
    height: 380, 
    backgroundColor: COLORS.black,
    position: 'relative',
  },
  carImage: { 
    width: '100%', 
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray200,
  },
  imagePlaceholderIcon: {
    fontSize: 100,
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
    marginTop: -22,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonLeft: { left: 16 },
  navButtonRight: { right: 16 },
  navButtonText: { 
    fontSize: 24, 
    color: COLORS.gray700, 
    fontWeight: 'bold',
  },
  imageCounter: { 
    position: 'absolute', 
    bottom: 20, 
    right: 16, 
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
  },
  imageCounterText: { 
    color: COLORS.white, 
    fontSize: 13, 
    fontWeight: '700',
  },
  
  // Main Content Card
  contentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  
  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContent: {
    flex: 1,
  },
  carBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 4,
  },
  carModel: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.gray700,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 2,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.darkTeal1,
  },
  quickSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specPill: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  specPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  
  // Owner Actions
  ownerActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.darkTeal1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.darkTeal1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonIcon: {
    fontSize: 16,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonIcon: {
    fontSize: 16,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  
  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray700,
    marginBottom: 16,
  },
  
  // Description
  descriptionText: {
    fontSize: 15,
    color: COLORS.gray600,
    lineHeight: 24,
  },
  
  // Seller Card
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.darkTeal1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
    marginBottom: 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  star: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  sellerEmail: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  sellerArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.gray400,
    fontWeight: 'bold',
  },
  
  // Specifications Grid
  specsGrid: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  specIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 2,
  },
  specValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  
  // Recommended Cars
  recommendedList: {
    paddingRight: 20,
  },
  recommendedCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendedImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.gray200,
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  recommendedImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedImagePlaceholderIcon: {
    fontSize: 48,
  },
  recommendedContent: {
    padding: 12,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
    marginBottom: 4,
  },
  recommendedSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  recommendedPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkTeal1,
  },
  
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  phoneButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.darkTeal1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  phoneButtonIcon: {
    fontSize: 18,
  },
  phoneButtonText: {
    fontSize: 15,
    color: COLORS.darkTeal1,
    fontWeight: '700',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: COLORS.darkTeal1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.darkTeal1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageButtonIcon: {
    fontSize: 18,
  },
  messageButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '700',
  },
  
  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  deleteModalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray700,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 15,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: COLORS.gray200,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  confirmDeleteButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});