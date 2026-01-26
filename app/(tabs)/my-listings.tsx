import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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

export default function MyListingsScreen() {
  const navigation = useNavigation();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [location, setLocation] = useState('Chargement...');

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
        setLocation('Algérie');
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
        const city = address.city || address.subregion || address.region || 'Algérie';
        setLocation(city);
      } else {
        setLocation('Algérie');
      }
    } catch (error) {
      console.error('Erreur de localisation:', error);
      setLocation('Algérie');
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
    Alert.alert(
      'Supprimer l\'annonce',
      `Êtes-vous sûr de vouloir supprimer "${listing.brand} ${listing.model}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDelete(listing.id),
        },
      ]
    );
  };

  const confirmDelete = async (listingId) => {
    try {
      console.log('🗑️ Deleting listing:', listingId);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?id=eq.${listingId}`,
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

      setListings(prev => prev.filter(item => item.id !== listingId));
      setFilteredListings(prev => prev.filter(item => item.id !== listingId));
      Alert.alert('Succès', 'Annonce supprimée avec succès');
      console.log('✅ Listing deleted');
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'annonce');
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
              <Text style={styles.editBtnIcon}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Text style={styles.deleteBtnIcon}>🗑️</Text>
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1085a8ff" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.locationRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.locationTextRow}>
            <Text style={styles.locationText}>{location} ▼</Text>
          </View>
          <TouchableOpacity>
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
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    color: '#fff',
    marginBottom:7,
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
    color: '#fff',
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
    borderColor: '#FFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    marginLeft: 2,
  },
  bellBottom: {
    width: 20,
    height: 4,
    backgroundColor: '#FFFF',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  bellClapper: {
    width: 4,
    height: 4,
    backgroundColor: '#FFFF',
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
    backgroundColor: '#ef4444',
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 22,
    color: '#1085a8ff',
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
    color: '#1f2937',
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
    color: '#666',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  carCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  carImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#1085a8ff',
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
    color: '#fff',
  },
  priceTag: {
    position: 'absolute',
    top: 170,
    right: 12,
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1085a8ff',
  },
  priceTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1085a8ff',
  },
  editBtn: {
    position: 'absolute',
    top: 12,
    right: 52,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editBtnIcon: {
    fontSize: 16,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteBtnIcon: {
    fontSize: 16,
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
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
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  specText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});