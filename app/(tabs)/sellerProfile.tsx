import { useFocusEffect, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/config/supabase';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#05696F',
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
  gray600: '#6b7280',
  gray700: '#1f2937',
};

export default function SellerProfileScreen() {
  const route = useRoute();
  const [seller, setSeller] = useState(null);
  const [sellerCars, setSellerCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);

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

  useFocusEffect(
    useCallback(() => {
      const sellerId = route.params?.sellerId;
      if (sellerId) {
        loadSellerProfile(sellerId);
      } else {
        setError('Seller ID not provided');
        setLoading(false);
      }
    }, [route.params?.sellerId])
  );

  const loadSellerProfile = async (sellerId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 Fetching seller profile for ID:', sellerId);

      // Fetch seller information
      const sellerResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=*&id=eq.${sellerId}`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!sellerResponse.ok) {
        throw new Error('Failed to fetch seller information');
      }

      const sellerData = await sellerResponse.json();

      if (!sellerData || sellerData.length === 0) {
        setError('Seller not found');
        setLoading(false);
        return;
      }

      const sellerInfo = sellerData[0];
      setSeller(sellerInfo);
      console.log(`✅ Seller found: ${sellerInfo.full_name || sellerInfo.email}`);

      // Fetch seller's cars with images
      console.log('🚗 Fetching seller\'s cars...');
      const carsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&seller_id=eq.${sellerId}&order=created_at.desc`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!carsResponse.ok) {
        throw new Error('Failed to fetch cars');
      }

      const carsData = await carsResponse.json();

      if (Array.isArray(carsData) && carsData.length > 0) {
        // Process images with proper URLs
        const processedCars = carsData.map(car => ({
          ...car,
          car_images: car.car_images ? car.car_images.map(img => ({
            ...img,
            displayUrl: getImageUrl(img.image_url),
          })) : [],
        }));

        setSellerCars(processedCars);
        console.log(`✅ Found ${processedCars.length} cars from seller`);

        // Calculate seller stats
        setSellerStats({
          totalListings: processedCars.length,
          rating: 4.8,
          reviews: 142,
          siret: '92752127800014',
          lastActivity: 'il y a 1 minute',
          responseTime: 'Généralement dans l\'heure',
        });
      } else {
        setSellerCars([]);
        setSellerStats({
          totalListings: 0,
          rating: 5.0,
          reviews: 0,
          siret: '92752127800014',
          lastActivity: 'Aucune activité',
          responseTime: 'N/A',
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading seller profile:', err);
      setError(err.message || 'Failed to load seller profile');
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handlePhonePress = () => {
    if (seller?.phone) {
      Alert.alert('Numéro', seller.phone, [
        { text: 'Appeler', onPress: () => Linking.openURL(`tel:${seller.phone}`) },
        { text: 'Copier', onPress: () => console.log('copy') },
        { text: 'Annuler', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Numéro non disponible', 'Ce vendeur n\'a pas de numéro de téléphone enregistré');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez les annonces de ${seller?.full_name || 'ce vendeur'} sur Automobile`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleMessage = () => {
    Alert.alert('Messages', 'Fonctionnalité de messagerie bientôt disponible');
  };

  const renderCarCard = (car) => {
    const firstImage = car.car_images && car.car_images.length > 0
      ? car.car_images[0].displayUrl
      : null;

    return (
      <TouchableOpacity
        key={car.id}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/product-detail',
            params: { carId: car.id },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.carCard}>
          <View style={styles.carImageContainer}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={styles.carImage}
                onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.carImagePlaceholder}>🚗</Text>
              </View>
            )}

            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{car.price} €</Text>
            </View>
          </View>

          <View style={styles.carInfo}>
            <Text style={styles.carName} numberOfLines={1}>
              {car.brand} {car.model?.split(' - ')[0]}
            </Text>

            <Text style={styles.carSubtitle} numberOfLines={1}>
              {car.year} · {car.mileage} km · {car.fuel_type}
            </Text>

            <View style={styles.carDetailsRow}>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{car.year}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{car.mileage} km</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{car.fuel_type}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{car.transmission}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.fullContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </View>
    );
  }

  if (error || !seller) {
    return (
      <View style={styles.fullContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oups!</Text>
          <Text style={styles.errorText}>{error || 'Vendeur non trouvé'}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profil Vendeur</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>↗</Text>
        </TouchableOpacity>
      </View>

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Seller Card */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarContainer}>
              <View style={styles.sellerAvatar}>
                {seller.avatar_url ? (
                  <Image
                    source={{ uri: getImageUrl(seller.avatar_url) }}
                    style={styles.sellerAvatarImage}
                  />
                ) : (
                  <Text style={styles.sellerAvatarText}>
                    {getInitials(seller.full_name || seller.email)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.sellerNameSection}>
              <Text style={styles.sellerName}>
                {seller.full_name || 'Utilisateur'}
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sellerStats?.totalListings}</Text>
                <Text style={styles.statLabel}>Annonces</Text>
              </View>
              <View style={styles.statDivider} />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Informations de Contact</Text>

            {seller.email && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📧</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{seller.email}</Text>
                </View>
              </View>
            )}

            {seller.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📱</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{seller.phone}</Text>
                </View>
              </View>
            )}

            {seller.city && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Localisation</Text>
                  <Text style={styles.infoValue}>{seller.city}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Seller Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Détails Vendeur</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Temps de réponse</Text>
              <Text style={styles.detailValue}>{sellerStats?.responseTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dernière activité</Text>
              <Text style={styles.detailValue}>{sellerStats?.lastActivity}</Text>
            </View>

            {seller.bio && (
              <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={styles.detailLabel}>À propos</Text>
                <Text style={styles.bioText}>{seller.bio}</Text>
              </View>
            )}
          </View>

          {/* Cars Section */}
          {sellerCars.length > 0 ? (
            <View style={styles.carsSection}>
              <View style={styles.carsSectionHeader}>
                <Text style={styles.sectionTitle}>
                  Annonces de ce vendeur 
                </Text>
              </View>

              {sellerCars.map((car) => renderCarCard(car))}
            </View>
          ) : (
            <View style={styles.noCarsContainer}>
              <Text style={styles.noCarsIcon}>🚗</Text>
              <Text style={styles.noCarsText}>
                Ce vendeur n'a pas d'annonces actives
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={handlePhonePress}
          >
            <Text style={styles.phoneButtonText}>📞 Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessage}
          >
            <Text style={styles.messageButtonText}>💬 Message</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.darkTeal1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerBackButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerBackText: { 
    fontSize: 28,
    color: COLORS.white, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  header: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.darkTeal1,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Seller Card */
  sellerCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerAvatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.darkTeal1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '700',
  },
  sellerNameSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sellerName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkTeal1,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 14,
    color: '#f59e0b',
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkTeal1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray300,
  },

  /* Info Section */
  infoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 12,
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.gray700,
    fontWeight: '600',
  },

  /* Details Section */
  detailsSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.gray700,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 20,
    marginTop: 8,
  },

  /* Cars Section */
  carsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  carsSectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkTeal1,
  },

  /* Car Card */
  carCard: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carImageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  carImagePlaceholder: {
    fontSize: 60,
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
  },
  priceTagText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  carInfo: {
    padding: 12,
  },
  carName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkTeal1,
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 11,
    color: COLORS.gray600,
    marginBottom: 10,
  },
  carDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  specItem: {
    backgroundColor: COLORS.darkTeal1 + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.darkGreen,
  },
  specText: {
    fontSize: 10,
    color: COLORS.darkTeal1,
    fontWeight: '600',
  },

  /* No Cars */
  noCarsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noCarsIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  noCarsText: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
  },

  /* Bottom Buttons */
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  phoneButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.darkTeal1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneButtonText: {
    fontSize: 14,
    color: COLORS.darkTeal1,
    fontWeight: '700',
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.darkTeal1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
  },
});