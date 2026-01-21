import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState({});
  const [location, setLocation] = useState('Chargement...');
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandsLoading, setBrandsLoading] = useState(true);

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
      console.log('🔄 ExploreScreen focused - loading data');
      loadCars();
      loadBrands();
    }, [])
  );

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

      // Check if data is an array
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

      // Extract unique brands and filter out null/undefined
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

      // Check if data is an array
      if (!Array.isArray(data)) {
        console.error('❌ Cars data is not an array:', data);
        setCars([]);
        setFilteredCars([]);
        setLoading(false);
        return;
      }

      setCars(data);
      setFilteredCars(data);
      console.log(`✅ Loaded ${data.length} cars`);
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
    // If clicking "Tous", deselect all brands
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
    // Ensure cars is always an array
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

  const toggleLike = (carId) => {
    setLiked(prev => ({
      ...prev,
      [carId]: !prev[carId]
    }));
  };

  const renderCarCard = ({ item }) => {
    const firstImage = item.car_images && item.car_images.length > 0 
      ? item.car_images[0].image_url 
      : null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('product-detail', { carId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.carCard}>
          <View style={styles.carImageContainer}>
            {firstImage ? (
              <Image source={{ uri: firstImage }} style={styles.carImage} />
            ) : (
              <Text style={styles.carImagePlaceholder}>🚗</Text>
            )}
            
            <View style={styles.dealBadge}>
              <Text style={styles.dealBadgeText}>TRÈS BONNE AFFAIRE</Text>
            </View>

            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{item.price} DA</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Blue Header with Rounded Bottom */}
      <View style={styles.headerContainer}>
        <View style={styles.locationRow}>
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
        {/* Brands Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Marques</Text>
        </View>

        {brandsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1085a8ff" />
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

        {/* Popular Car Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voitures Populaire</Text>
        </View>

        {/* Car List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1085a8ff" />
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
    paddingTop: 20,
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
  locationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  brandsScrollContainer: {
    marginBottom: 16,
  },
  brandsScroll: {
    paddingHorizontal: 20,
  },
  brandCard: {
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1085a8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  brandCardActive: {
    backgroundColor: '#1085a8ff',
  },
  brandName: {
    fontSize: 13,
    color: '#1085a8ff',
    fontWeight: '600',
    textAlign: 'center',
  },
  brandNameActive: {
    color: '#fff',
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
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    resizeMode: 'contain',
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
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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