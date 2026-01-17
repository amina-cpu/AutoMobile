import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../src/config/supabase';
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

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
  locationLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTextRow: {
    flexDirection: 'row',
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userProfileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userProfileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userProfileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1085a8ff',
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
    borderColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    marginLeft: 2,
  },
  bellBottom: {
    width: 20,
    height: 4,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  bellClapper: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
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
  homePadding: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  ctaButtonContainer: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  ctaButton: {
    backgroundColor: '#1085a8ff',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 5,
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  heroSection: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1085a8ff',
    overflow: 'hidden',
    backgroundColor: '#ffff',
    position: 'relative',
    height: 250,
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: 'center',
  },
  heroImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '50%',
    height: '100%',
    resizeMode: 'contain',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    maxWidth: '50%',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
    maxWidth: '50%',
  },
  heroButton: {
    backgroundColor: '#1085a8ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  categoriesSection: {
    marginVertical: 32,
  },
  categoriesTitleContainer: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  categoriesTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  categoriesSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  categoriesScroll: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  latestCarsSection: {
    marginVertical: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  latestCarsSectionTitle: {
    marginBottom: 24,
  },
  latestCarsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const [scaleValue] = React.useState(new Animated.Value(1));
  const [latestCars, setLatestCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [location, setLocation] = useState('Chargement...');
  const [userName, setUserName] = useState('User');
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    getUserLocation();
    getUserInfo();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation('Blida, Algérie');
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
        setLocation('Blida');
      }
    } catch (error) {
      console.error('Erreur de localisation:', error);
      setLocation('Blida');
    }
  };

  const getUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const displayName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'User';
        
        const profileImage = user.user_metadata?.avatar_url || 
                           user.user_metadata?.picture || 
                           null;
        
        setUserName(displayName);
        setUserImage(profileImage);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserName('User');
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
      const data = await carService.getLatestCars(10);
      setLatestCars(data);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (carId) => {
    setLiked(prev => ({
      ...prev,
      [carId]: !prev[carId]
    }));
  };

  const categories = [
    { id: 1, name: 'Citadine' },
    { id: 2, name: '4x4 et SUV' },
    { id: 3, name: 'Berline compacte' },
    { id: 4, name: 'Berline' },
    { id: 5, name: 'Monospace' },
    { id: 6, name: 'Break' },
    { id: 7, name: 'Utilitaire' },
  ];

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePrevCar = () => {
    if (currentCarIndex > 0) {
      setCurrentCarIndex(currentCarIndex - 1);
    }
  };

  const handleNextCar = () => {
    if (currentCarIndex < latestCars.length - 1) {
      setCurrentCarIndex(currentCarIndex + 1);
    }
  };

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.7}>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCurrentCar = () => {
    if (loading || latestCars.length === 0) return null;

    const item = latestCars[currentCarIndex];
    const firstImage = item.car_images && item.car_images.length > 0 
      ? item.car_images[0].image_url 
      : null;

    return (
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('product-detail', { carId: item.id })}
            activeOpacity={0.95}
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

          <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingLeft: 12 }}>
            <TouchableOpacity 
              onPress={handlePrevCar}
              disabled={currentCarIndex === 0}
              style={{ opacity: currentCarIndex === 0 ? 0.3 : 1 }}
            >
              <Text style={{ fontSize: 28, color: '#1085a8ff', fontWeight: 'bold' }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleNextCar}
              disabled={currentCarIndex === latestCars.length - 1}
              style={{ opacity: currentCarIndex === latestCars.length - 1 ? 0.3 : 1, marginTop: 8 }}
            >
              <Text style={{ fontSize: 28, color: '#1085a8ff', fontWeight: 'bold' }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paginationDots}>
          {latestCars.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.dot,
                index === currentCarIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1085a8ff" translucent={true} />
      
      <View style={styles.headerContainer}>
        <Text style={styles.locationLabel}></Text>
        <View style={styles.locationRow}>
          <View style={styles.locationTextRow}>
            <Text style={styles.locationText}> {location} ▼</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
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

        <View style={styles.greetingRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Bonjour, {userName}! 👋</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.homePadding}>
          <Text style={styles.mainTitle}>Trouvez votre prochaine voiture chez nous !</Text>

          <TouchableOpacity
            style={styles.ctaButtonContainer}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              handlePressOut();
              navigation.navigate('explore');
            }}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.ctaButton,
                { transform: [{ scale: scaleValue }] },
              ]}
            >
              <Text style={styles.ctaText}>Acheter un véhicule</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Image 
            source={require('../../assets/images/last.png')}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Vous souhaitez vendre votre voiture ?
            </Text>
            <Text style={styles.heroSubtitle}>
              Pas de problème on est là !
            </Text>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => navigation.navigate('sell')}
              activeOpacity={0.8}
            > 
              <Text style={styles.heroButtonText}>Vendre ma voiture</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <View style={styles.categoriesTitleContainer}>
            <Text style={styles.categoriesTitle}>Nos catégories</Text>
            <Text style={styles.categoriesSubtitle}>
              les plus recherchées
            </Text>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.categoriesScroll}
          />
        </View>

        <View style={styles.latestCarsSection}>
          <View style={styles.latestCarsSectionTitle}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.latestCarsTitle}>
                Nos dernières voitures
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('explore')}>
                <Text style={{ fontSize: 28, color: '#1085a8ff', fontWeight: 'bold' }}>»</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            renderCurrentCar()
          )}
        </View>
      </ScrollView>
    </View>
  );
}