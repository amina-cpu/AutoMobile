import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { carService } from '../src/services/carService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    borderWidth: 2,
    borderColor: '#2563eb',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  carListingContainer: {
    padding: 16,
    paddingBottom: 80,
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
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#e5e7eb',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  carModel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  carDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#9ca3af',
  },
  carDetailText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  alertButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertText: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
    marginLeft: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
});

export default function BuyScreen() {
  const navigation = useNavigation();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState({});

  // Load cars when screen comes into focus
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

  // Search function - searches by brand, model, year, fuel type
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

  const renderCarCard = ({ item }) => {
    const firstImage = item.car_images && item.car_images.length > 0 
      ? item.car_images[0].image_url 
      : null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('product-detail', { carId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.carCard}>
          <View style={styles.carImageContainer}>
            {firstImage ? (
              <Image source={{ uri: firstImage }} style={styles.carImage} />
            ) : (
              <Text style={styles.carImagePlaceholder}>🚗</Text>
            )}
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item.id);
              }}
            >
              <Text style={{ fontSize: 20, color: liked[item.id] ? '#ef4444' : '#9ca3af' }}>
                {liked[item.id] ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{item.price} €</Text>
            </View>
          </View>
          
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {item.brand} {item.model?.split(' - ')[0]}
            </Text>
            <Text style={styles.carModel}>{item.model}</Text>
            <View style={styles.carDetails}>
              <Text style={styles.carDetailText}>{item.year}</Text>
              <Text style={styles.carDetailText}>{item.mileage} km</Text>
              <Text style={styles.carDetailText}>{item.fuel_type}</Text>
              <Text style={styles.carDetailText}>{item.transmission}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text>⚙️</Text>
          <Text style={styles.filterText}>Filtrer</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une voiture par marque, modèle"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <View style={styles.securityBadge}>
          <Text>🔒</Text>
          <Text style={styles.securityText}>Paiement sécurisé</Text>
          <Text style={styles.moreText}>Plus pertinent ›</Text>
        </View>
      </View>

      {/* Results Count */}
      {!loading && (
        <Text style={styles.resultsCount}>
          {filteredCars.length} {filteredCars.length === 1 ? 'véhicule trouvé' : 'véhicules trouvés'}
        </Text>
      )}

      {/* Car List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredCars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `Aucun véhicule trouvé pour "${searchQuery}"`
              : 'Aucun véhicule disponible'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.carListingContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <>
              <TouchableOpacity style={styles.alertButton}>
                <Text>🔔</Text>
                <Text style={styles.alertText}>Créer une alerte</Text>
              </TouchableOpacity>

              <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
                {filteredCars.length === cars.length 
                  ? 'Tous les véhicules affichés'
                  : 'Fin des résultats'
                }
              </Text>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}