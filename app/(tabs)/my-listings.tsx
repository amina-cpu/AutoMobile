import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/config/supabase';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',      // RGB(5, 59, 67) - Darkest
  darkTeal2: '#064C53',      // RGB(6, 76, 83) - Dark
  darkTeal3: '#05696F',      // RGB(5, 105, 111) - Medium
  primaryGreen: '#41B975',   // RGB(65, 185, 117) - Primary accent
  darkGreen: '#268865',      // RGB(38, 136, 101) - Secondary accent
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
  lightBlue: '#e0f2fe',
  blue: '#0284c7',
  lightRed: '#fee2e2',
};

export default function MyListingsScreen() {
  const navigation = useNavigation();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [location, setLocation] = useState('Chargement...');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

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

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation('Location');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const city = address.city || address.subregion || address.region || 'Location';
        setLocation(city);
      } else {
        setLocation('Location');
      }
    } catch (error) {
      console.error('Erreur de localisation:', error);
      setLocation('Location');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [])
  );

  const loadListings = async () => {
    try {
      setLoading(true);
      console.log('👤 Fetching current user...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Authentication error');
        Alert.alert('Erreur', 'Vous devez être connecté');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      console.log('✅ Current user:', user.id);

      console.log('📋 Loading user listings...');
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&seller_id=eq.${user.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Load failed:', response.status, errorText);
        Alert.alert('Erreur', 'Impossible de charger vos annonces');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data?.length || 0} listings`);

      // Process images with proper URLs
      const processedListings = Array.isArray(data) ? data.map(car => ({
        ...car,
        car_images: car.car_images ? car.car_images.map(img => ({
          ...img,
          displayUrl: getImageUrl(img.image_url)
        })) : []
      })) : [];

      setListings(processedListings);
      setFilteredListings(processedListings);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredListings(listings);
    } else {
      const searchLower = text.toLowerCase();
      const filtered = listings.filter(car => {
        const brandMatch = car.brand?.toLowerCase().includes(searchLower);
        const modelMatch = car.model?.toLowerCase().includes(searchLower);
        return brandMatch || modelMatch;
      });
      setFilteredListings(filtered);
    }
  };

  const handleDelete = (listing) => {
    setListingToDelete(listing);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;

    try {
      console.log('🗑️ Deleting listing:', listingToDelete.id);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?id=eq.${listingToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setListings(prev => prev.filter(item => item.id !== listingToDelete.id));
      setFilteredListings(prev => prev.filter(item => item.id !== listingToDelete.id));
      setDeleteModalVisible(false);
      setListingToDelete(null);
      Alert.alert('Succès', 'Annonce supprimée avec succès');
      console.log('✅ Listing deleted');
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
      setDeleteModalVisible(false);
      setListingToDelete(null);
    }
  };

  const handleEditListing = (listing) => {
    router.push({
      pathname: '/EditCarScreen',
      params: { 
        carId: listing.id, 
        carData: JSON.stringify(listing) 
      }
    });
  };

  const renderCarCard = ({ item }) => {
    const firstImage = item.car_images && item.car_images.length > 0 
      ? item.car_images[0].displayUrl
      : null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('product-detail', { carId: item.id })}
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
              <Text style={styles.carImagePlaceholder}>🚗</Text>
            )}
            
            <View style={styles.dealBadge}>
              <Text style={styles.dealBadgeText}>TRÈS BONNE AFFAIRE</Text>
            </View>

            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{item.price} €</Text>
            </View>

            <TouchableOpacity 
              style={styles.editBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleEditListing(item);
              }}
            >
              <View style={styles.editIcon}>
                <View style={styles.editPencilBody} />
                <View style={styles.editPencilTip} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <View style={styles.deleteIcon}>
                <View style={styles.trashLid} />
                <View style={styles.trashBody} />
                <View style={styles.trashLine1} />
                <View style={styles.trashLine2} />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {item.brand} {item.model?.split(' - ')[0]}
            </Text>
            
            <View style={styles.carDetailsRow}>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{item.year}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{item.mileage} km</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{item.fuel_type}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specText}>{item.transmission}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Aucune annonce</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas encore publié d'annonces
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/sell')}
      >
        <Text style={styles.createButtonText}>Créer une annonce</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.fullContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      <View style={styles.headerContainer}>
        <View style={styles.locationRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerBackText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.locationTextRow}>
            <Text style={styles.locationText}>{location} ▼</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('notification')}>
            <View style={styles.notificationIconContainer}>
              <View style={styles.bellIcon}>
                <View style={styles.bellTop} />
                <View style={styles.bellBottom} />
                <View style={styles.bellClapper} />
              </View>
              <View style={styles.notificationDot} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Recherche par Marques, modele..."
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
        </View>

        {filteredListings.length > 0 ? (
          <View style={styles.carListingContainer}>
            {filteredListings.map((item) => (
              <View key={item.id}>
                {renderCarCard({ item })}
              </View>
            ))}
          </View>
        ) : searchQuery.trim() !== '' ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucune annonce trouvée pour "{searchQuery}"
            </Text>
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
      </SafeAreaView>

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
              Êtes-vous sûr de vouloir supprimer "{listingToDelete?.brand} {listingToDelete?.model}"?
            </Text>

            <View style={styles.deleteButtonContainer}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setListingToDelete(null);
                }}
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
    backgroundColor: COLORS.lightGray,
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
  headerContainer: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 7,
    fontWeight: '600',
  },
  locationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: -40,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  bellIcon: {
    width: 20,
    height: 22,
  },
  bellTop: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    marginLeft: 2,
  },
  bellBottom: {
    width: 20,
    height: 4,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  bellClapper: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
    left: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryGreen,
  },
  searchBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray700,
  },
  filterButton: {
    backgroundColor: COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 22,
    color: COLORS.darkTeal1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkTeal1,
  },
  carListingContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkTeal1,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  carCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    paddingTop: 30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  carImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carImagePlaceholder: {
    fontSize: 72,
  },
  dealBadge: {
    position: 'absolute',
    top: 160,
    left: 12,
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  priceTag: {
    position: 'absolute',
    top: 170,
    right: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
  },
  priceTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  editBtn: {
    position: 'absolute',
    top: 12,
    right: 52,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editIcon: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  editPencilBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: COLORS.blue,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  editPencilTip: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.blue,
    transform: [{ rotate: '45deg' }],
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteIcon: {
    width: 16,
    height: 20,
    position: 'relative',
  },
  trashLid: {
    position: 'absolute',
    top: 0,
    left: -1,
    width: 18,
    height: 3,
    backgroundColor: COLORS.red,
    borderRadius: 1,
  },
  trashBody: {
    position: 'absolute',
    top: 4,
    left: 1,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: COLORS.red,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  trashLine1: {
    position: 'absolute',
    top: 7,
    left: 5,
    width: 2,
    height: 8,
    backgroundColor: COLORS.red,
  },
  trashLine2: {
    position: 'absolute',
    top: 7,
    right: 5,
    width: 2,
    height: 8,
    backgroundColor: COLORS.red,
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkTeal1,
    marginBottom: 12,
  },
  carDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.darkTeal1 + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.darkGreen,
  },
  specText: {
    fontSize: 11,
    color: COLORS.darkTeal1,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkTeal1,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: COLORS.gray200,
  },
  confirmDeleteButton: {
    backgroundColor: COLORS.red,
  },
  cancelDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});