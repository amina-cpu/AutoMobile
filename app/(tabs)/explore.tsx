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
import { carService } from '../src/services/carService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  locationLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: '#93C5FD',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 24,
    color: '#1085a8ff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 15,
    color: '#1085a8ff',
    fontWeight: '600',
  },
  brandsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    marginLeft:50,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  brandCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 40,
    borderWidth: 2,
    marginLeft: 1,
    marginRight: 1,
    borderColor: '#1085a8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  brandLogo: {
    width: 50,
    height: 50,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 13,
    color: '#1085a8ff',
    fontWeight: '500',
  },
  carListingContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  dealBadgeIcon: {
    fontSize: 14,
  },
  dealBadgeText: {
    fontSize: 16,
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
    fontSize: 18,
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
  carType: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  carName: {
    fontSize: 18,
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
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 12,
  },
});

export default function BuyScreen() {
  const navigation = useNavigation();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState({});
  const [location, setLocation] = useState('Chargement...');

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation('error');
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
        const country = address.country || 'Algérie';
        setLocation(`${city}, ${country}`);
      } else {
        setLocation('error');
      }
    } catch (error) {
      console.error('Erreur de localisation:', error);
      setLocation('error');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [])
  );

  const loadCars = async () => {
    try {
      setLoading(true);
      const data = await carService.getAllCars();
      setCars(data);
      setFilteredCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (!text.trim()) {
      setFilteredCars(cars);
      return;
    }

    const query = text.toLowerCase();
    const filtered = cars.filter(car => {
      const brand = car.brand?.toLowerCase() || '';
      const model = car.model?.toLowerCase() || '';
      const year = car.year?.toString() || '';
      const fuelType = car.fuel_type?.toLowerCase() || '';
      const transmission = car.transmission?.toLowerCase() || '';

      return (
        brand.includes(query) ||
        model.includes(query) ||
        year.includes(query) ||
        fuelType.includes(query) ||
        transmission.includes(query)
      );
    });

    setFilteredCars(filtered);
  };

  const toggleLike = (carId) => {
    setLiked(prev => ({
      ...prev,
      [carId]: !prev[carId]
    }));
  };

  const brands = [
    { name: 'BMW', image: 'https://logo.clearbit.com/bmw.com' },
    { name: 'Toyota', image: 'https://logo.clearbit.com/toyota.com' },
    { name: 'Mercedes', image: 'https://logo.clearbit.com/mercedes-benz.com' },
    { name: 'Tesla', image: 'https://logo.clearbit.com/tesla.com' },
    { name: 'Tesla', image: 'https://logo.clearbit.com/tesla.com' },
    // { name: 'Tesla', image: 'https://logo.clearbit.com/tesla.com' },
    

  ];

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
              {/* <Text style={styles.dealBadgeIcon}>💎</Text> */}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Blue Header with Rounded Bottom */}
      <View style={styles.headerContainer}>
        <Text style={styles.locationLabel}></Text>
        <View style={styles.locationRow}>
          <View style={styles.locationTextRow}>
            <Text style={styles.locationText}>{location} ▼</Text>
          </View>
          <TouchableOpacity >
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
              placeholder="Search"
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
          {/* <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity> */}
        </View>

        <View style={styles.brandsContainer}>
          <View style={styles.brandRow}>
            {brands.map((brand, index) => (
              <TouchableOpacity key={index} style={styles.brandCard}>
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Car Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Voitures Populaire</Text>
          {/* <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity> */}
        </View>
{/* 
        {!loading && (
          <Text style={styles.resultsCount}>
            {filteredCars.length} {filteredCars.length === 1 ? 'vehicle found' : 'vehicles found'}
          </Text>
        )} */}

        {/* Car List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF" />
          </View>
        ) : filteredCars.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `No vehicles found for "${searchQuery}"`
                : 'No vehicles available'
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