import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: width - 48,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carImageContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: '#f3f4f6',
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
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftNavButton: {
    left: 0,
  },
  rightNavButton: {
    right: 0,
  },
  navArrowText: {
    fontSize: 80,
    fontWeight: '200',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  carInfo: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  carHeader: {
    marginBottom: 12,
  },
  carBrand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  carModel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  carDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  carSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  carSpecItem: {
    fontSize: 13,
    color: '#64748b',
  },
  carSpecSeparator: {
    fontSize: 13,
    color: '#cbd5e1',
    marginHorizontal: 2,
  },
  carPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'right',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1085a8ff',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    width: 20,
    height: 14,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#1f2937',
    borderRadius: 2,
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
    borderColor: '#1f2937',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    marginLeft: 2,
  },
  bellBottom: {
    width: 20,
    height: 4,
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  bellClapper: {
    width: 4,
    height: 4,
    backgroundColor: '#1f2937',
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
  homePadding: {
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaButtonContainer: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  ctaButton: {
    backgroundColor: '#fff',
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
    color: '#1f2937',
  },
  heroSection: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 20,
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
    backgroundColor: '#10b981',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenu: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  menuHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 32,
    marginTop: 12,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuItemText: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesSection: {
    marginVertical: 32,
    marginBottom: 20,
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
  },
  latestCarsSectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  latestCarsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 24,
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [latestCars, setLatestCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const [currentCarIndex, setCurrentCarIndex] = useState(0);

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

  const navigateTo = (screen) => {
    setMenuVisible(false);
    navigation.navigate(screen);
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
      <View style={styles.carouselContainer}>
        <TouchableOpacity 
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
              
              <TouchableOpacity 
                style={styles.likeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleLike(item.id);
                }}
              >
                <Text style={{ fontSize: 24, color: liked[item.id] ? '#ef4444' : '#cbd5e1' }}>
                  {liked[item.id] ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>

              {/* Left Navigation Arrow */}
              {currentCarIndex > 0 && (
                <TouchableOpacity 
                  style={[styles.navigationButton, styles.leftNavButton]}
                  onPress={handlePrevCar}
                >
                  <Text style={styles.navArrowText}>‹</Text>
                </TouchableOpacity>
              )}

              {/* Right Navigation Arrow */}
              {currentCarIndex < latestCars.length - 1 && (
                <TouchableOpacity 
                  style={[styles.navigationButton, styles.rightNavButton]}
                  onPress={handleNextCar}
                >
                  <Text style={styles.navArrowText}>›</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.carInfo}>
              <View style={styles.carHeader}>
                <Text style={styles.carBrand}>
                  {item.brand} {item.model?.split(' - ')[0]}
                </Text>
                <Text style={styles.carModel}>{item.model}</Text>
              </View>

              <View style={styles.carDetailsRow}>
                <View style={styles.carSpecs}>
                  <Text style={styles.carSpecItem}>{item.year}</Text>
                  <Text style={styles.carSpecSeparator}>|</Text>
                  <Text style={styles.carSpecItem}>{item.mileage} km</Text>
                  <Text style={styles.carSpecSeparator}>|</Text>
                  <Text style={styles.carSpecItem}>{item.fuel_type}</Text>
                  <Text style={styles.carSpecSeparator}>|</Text>
                  <Text style={styles.carSpecItem}>{item.transmission}</Text>
                </View>
              </View>

              <Text style={styles.carPrice}>{item.price} €</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Pagination Dots */}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
        >
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.logo}>AutoMobile</Text>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
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
            source={require('../../assets/images/background.png')}
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
            <Text style={styles.latestCarsTitle}>
              Nos dernières voitures
            </Text>
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

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideMenu}>
            <Text style={styles.menuHeader}>Menu</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('index')}
            >
              <Text style={styles.menuItemText}>🏠 Accueil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('explore')}
            >
              <Text style={styles.menuItemText}>🔍 Acheter un véhicule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>❤️ Mes favoris</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>👤 Mon profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}