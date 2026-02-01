import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/config/supabase';

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
};

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState({});
  const [location, setLocation] = useState('Chargement...');
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

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
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        console.log('✅ [ExploreScreen] User:', user.id);
      }
    } catch (error) {
      console.error('❌ [ExploreScreen] Error getting user:', error);
    }
  };

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
      console.log('🔄 ExploreScreen focused - loading data');
      loadCars();
      loadBrands();
      loadUserFavorites();
    }, [])
  );

  const loadUserFavorites = async () => {
    try {
      if (!userId) return;

      console.log('💾 [ExploreScreen] Loading user favorites for:', userId);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('❌ [ExploreScreen] Failed to load favorites');
        return;
      }

      const data = await response.json();
      const favoritedCarIds = {};
      
      if (Array.isArray(data)) {
        data.forEach(fav => {
          favoritedCarIds[fav.car_id] = true;
        });
      }

      setLiked(favoritedCarIds);
      console.log('✅ [ExploreScreen] Loaded favorites:', Object.keys(favoritedCarIds).length);
    } catch (error) {
      console.error('❌ [ExploreScreen] Error loading favorites:', error);
    }
  };

  const loadBrands = async () => {
    try {
      console.log('🏷️ Loading brands...');
      setBrandsLoading(true);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?select=brand`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Brands fetch failed:', response.status, errorText);
        setBrands(['Tous']);
        setBrandsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📦 Brands data received:', Array.isArray(data) ? `${data.length} items` : typeof data);

      if (!Array.isArray(data)) {
        console.error('❌ Brands data is not an array:', data);
        setBrands(['Tous']);
        setBrandsLoading(false);
        return;
      }

      if (data.length === 0) {
        console.log('⚠️ No brands found in database');
        setBrands(['Tous']);
        setBrandsLoading(false);
        return;
      }

      const uniqueBrands = [...new Set(data.map(car => car.brand))].filter(Boolean);
      setBrands(['Tous', ...uniqueBrands.sort()]);
      console.log(`✅ Loaded ${uniqueBrands.length} unique brands:`, uniqueBrands);
    } catch (error) {
      console.error('❌ Error loading brands:', error);
      setBrands(['Tous']);
    } finally {
      setBrandsLoading(false);
    }
  };

  const loadCars = async () => {
    try {
      console.log('🚗 Loading all cars...');
      setLoading(true);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/cars?select=*,car_images(*)&order=created_at.desc`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cars fetch failed:', response.status, errorText);
        setCars([]);
        setFilteredCars([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📦 Cars data received:', Array.isArray(data) ? `${data.length} cars` : typeof data);

      if (!Array.isArray(data)) {
        console.error('❌ Cars data is not an array:', data);
        setCars([]);
        setFilteredCars([]);
        setLoading(false);
        return;
      }

      // Process images with proper URLs
      const processedCars = data.map(car => ({
        ...car,
        car_images: car.car_images ? car.car_images.map(img => ({
          ...img,
          displayUrl: getImageUrl(img.image_url)
        })) : []
      }));

      setCars(processedCars);
      setFilteredCars(processedCars);
      console.log(`✅ Loaded ${processedCars.length} cars`);
    } catch (error) {
      console.error('❌ Error loading cars:', error);
      setCars([]);
      setFilteredCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterCars(text, selectedBrand);
  };

  const handleBrandSelect = (brand) => {
    if (brand === 'Tous') {
      setSelectedBrand(null);
      filterCars(searchQuery, null);
    } else {
      const newBrand = selectedBrand === brand ? null : brand;
      setSelectedBrand(newBrand);
      filterCars(searchQuery, newBrand);
    }
  };

  const filterCars = (query, brand) => {
    let filtered = Array.isArray(cars) ? [...cars] : [];

    if (brand && brand !== 'Tous') {
      filtered = filtered.filter(car => car.brand?.toLowerCase() === brand.toLowerCase());
    }

    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(car => {
        const brandMatch = car.brand?.toLowerCase().includes(searchLower) || false;
        const modelMatch = car.model?.toLowerCase().includes(searchLower) || false;
        const yearMatch = car.year?.toString().includes(query) || false;
        const fuelTypeMatch = car.fuel_type?.toLowerCase().includes(searchLower) || false;
        const transmissionMatch = car.transmission?.toLowerCase().includes(searchLower) || false;

        return brandMatch || modelMatch || yearMatch || fuelTypeMatch || transmissionMatch;
      });
    }

    setFilteredCars(filtered);
  };

  const toggleLike = async (carId) => {
    try {
      if (!userId) {
        console.warn('⚠️ [ExploreScreen] No user logged in');
        return;
      }

      const isCurrentlyLiked = liked[carId];

      if (isCurrentlyLiked) {
        // Remove from favorites
        console.log('🗑️ [ExploreScreen] Removing favorite:', carId);
        
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&car_id=eq.${carId}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('❌ [ExploreScreen] Failed to remove favorite');
          return;
        }

        console.log('✅ [ExploreScreen] Favorite removed');
      } else {
        // Add to favorites
        console.log('💾 [ExploreScreen] Adding favorite:', carId);
        
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/favorites`,
          {
            method: 'POST',
            headers: {
              'apikey': API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              car_id: carId
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [ExploreScreen] Failed to add favorite:', errorText);
          return;
        }

        console.log('✅ [ExploreScreen] Favorite added');
      }

      // Update local state
      setLiked(prev => ({
        ...prev,
        [carId]: !prev[carId]
      }));
    } catch (error) {
      console.error('❌ [ExploreScreen] Error toggling favorite:', error);
    }
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
              style={styles.likeButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item.id);
              }}
            >
              <Text style={styles.likeIcon}>
                {liked[item.id] ? '❤️' : '🤍'}
              </Text>
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

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      {/* Header extends into status bar area */}
      <View style={styles.headerContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationTextRow}>
            <Text style={styles.locationText}>{location} ▼</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notification')}
          >
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

      {/* Content area with safe area for bottom */}
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Marques</Text>
          </View>

          {brandsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.darkTeal1} />
            </View>
          ) : brands.length > 0 ? (
            <View style={styles.brandsScrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsScroll}
              >
                {brands.map((brand, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.brandCard,
                      (selectedBrand === brand || (brand === 'Tous' && selectedBrand === null)) && styles.brandCardActive
                    ]}
                    onPress={() => handleBrandSelect(brand)}
                  >
                    <Text style={[
                      styles.brandName,
                      (selectedBrand === brand || (brand === 'Tous' && selectedBrand === null)) && styles.brandNameActive
                    ]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune marque disponible</Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voitures Populaire</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.darkTeal1} />
              <Text style={styles.loadingText}>Chargement des voitures...</Text>
            </View>
          ) : !Array.isArray(filteredCars) ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Erreur de chargement des données</Text>
            </View>
          ) : filteredCars.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedBrand 
                  ? `Aucun véhicule trouvé pour "${selectedBrand}"`
                  : searchQuery 
                    ? `Aucun véhicule trouvé pour "${searchQuery}"`
                    : 'Aucun véhicule disponible'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.carListingContainer}>
              {filteredCars.map((item) => (
                <View key={item.id}>
                  {renderCarCard({ item })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    backgroundColor: COLORS.lightGray,
  },
  headerContainer: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 20,
    paddingTop: 50, // Increased to account for status bar
    paddingBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray700,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray700,
  },
  brandsScrollContainer: {
    marginBottom: 16,
  },
  brandsScroll: {
    paddingHorizontal: 20,
  },
  brandCard: {
    height: 70,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.darkTeal1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  brandCardActive: {
    backgroundColor: COLORS.darkTeal1,
  },
  brandName: {
    fontSize: 13,
    color: COLORS.darkTeal1,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandNameActive: {
    color: COLORS.white,
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
  emptyText: {
    fontSize: 16,
    color: COLORS.gray400,
    textAlign: 'center',
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
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  likeIcon: {
    fontSize: 20,
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray700,
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
});