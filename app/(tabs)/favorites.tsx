import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../src/config/supabase';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

interface FavoriteCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  car_images: Array<{ image_url: string; displayUrl?: string }>;
}

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Helper function to get image URL - SAME AS EXPLORE SCREEN
  const getImageUrl = (imagePath: string) => {
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
      console.log('🔄 FavoritesScreen focused - loading favorites');
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ [FavoritesScreen] No user logged in:', userError);
        setFavorites([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      console.log('👤 [FavoritesScreen] Loading favorites for user:', user.id);

      // Fetch favorites with car details
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${user.id}&select=car_id,cars(*,car_images(*))`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FavoritesScreen] Fetch failed:', response.status, errorText);
        setFavorites([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📦 [FavoritesScreen] Favorites data:', Array.isArray(data) ? `${data.length} items` : typeof data);

      if (!Array.isArray(data)) {
        console.error('❌ [FavoritesScreen] Data is not an array:', data);
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Extract cars from favorites and process images
      const favoriteCars = data
        .map((fav: any) => fav.cars)
        .filter(Boolean)
        .map((car: any) => ({
          ...car,
          car_images: car.car_images ? car.car_images.map((img: any) => ({
            ...img,
            displayUrl: getImageUrl(img.image_url),
          })) : [],
        }));

      setFavorites(favoriteCars);
      console.log(`✅ [FavoritesScreen] Loaded ${favoriteCars.length} favorite cars`);
    } catch (error) {
      console.error('❌ [FavoritesScreen] Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (carId: string) => {
    try {
      if (!userId) return;

      console.log('🗑️ [FavoritesScreen] Removing favorite:', carId);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&car_id=eq.${carId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FavoritesScreen] Delete failed:', response.status, errorText);
        return;
      }

      // Remove from local state
      setFavorites(prev => prev.filter(car => car.id !== carId));
      console.log('✅ [FavoritesScreen] Favorite removed');
    } catch (error) {
      console.error('❌ [FavoritesScreen] Error removing favorite:', error);
    }
  };

  const renderCarCard = (car: FavoriteCar) => {
    const firstImage = car.car_images && car.car_images.length > 0
      ? car.car_images[0].displayUrl
      : null;

    return (
      <TouchableOpacity
        key={car.id}
        onPress={() => navigation.navigate('product-detail' as never, { carId: car.id } as never)}
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

            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{car.price} €</Text>
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                removeFavorite(car.id);
              }}
            >
              <Text style={styles.removeIcon}>❤️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {car.brand} {car.model?.split(' - ')[0]}
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1085a8ff" />
          <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
          <Text style={styles.emptyText}>
            Explorez nos véhicules et ajoutez-les à vos favoris
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('explore' as never)}
          >
            <Text style={styles.exploreButtonText}>Voir les voitures</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.carListingContainer}>
            {favorites.map((car) => renderCarCard(car))}
          </View>
        </ScrollView>
      )}
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
    paddingTop: 80,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#fff',
    marginBottom:10,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
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
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  carListingContainer: {
    paddingBottom: 100,
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
  priceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  removeButton: {
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
  removeIcon: {
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