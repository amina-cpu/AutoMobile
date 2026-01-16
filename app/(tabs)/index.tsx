import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
    paddingHorizontal: 24,
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
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    marginBottom: 5,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 13,
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
    marginBottom: 16,
  },
  latestCarsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  latestCarsScroll: {
    paddingLeft: 24,
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  carImageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImagePlaceholder: {
    fontSize: 72,
  },
  carImage: {
    width: '100%',
    height: '100%',
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  firstHandBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  firstHandBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const [scaleValue] = React.useState(new Animated.Value(1));
  const [menuVisible, setMenuVisible] = useState(false);
  const [latestCars, setLatestCars] = useState([]);
  const [loading, setLoading] = useState(true);
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
    { id: 1, name: 'Citadine', icon: '🚗' },
    { id: 2, name: '4x4 et SUV', icon: '🚙' },
    { id: 3, name: 'Berline compacte', icon: '🚕' },
    { id: 4, name: 'Berline', icon: '🚘' },
    { id: 5, name: 'Monospace', icon: '🚐' },
    { id: 6, name: 'Break', icon: '🚗' },
    { id: 7, name: 'Utilitaire', icon: '🚚' },
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

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.7}>
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderCarCard = ({ item }) => {
    // Get first image from car_images array
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
              onPress={() => toggleLike(item.id)}
            >
              <Text style={{ fontSize: 20, color: '#ef4444' }}>
                {liked[item.id] ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{item.price} €</Text>
            </View>
            {item.first_hand && (
              <View style={styles.firstHandBadge}>
                <Text style={styles.firstHandBadgeText}>🔖 PREMIÈRE MAIN</Text>
              </View>
            )}
          </View>
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {item.brand} {item.model?.split(' - ')[0]}
            </Text>
            <Text style={styles.carModel}>{item.model}</Text>
            <View style={styles.carDetails}>
              <Text>{item.year}</Text>
              <Text>{item.mileage} km</Text>
              <Text>{item.fuel_type}</Text>
              <Text>{item.transmission}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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

      {/* Main Content */}
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

        {/* Categories Section */}
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

        {/* Latest Cars Section */}
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
            <FlatList
              data={latestCars}
              renderItem={renderCarCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.latestCarsScroll}
            />
          )}
        </View>
      </ScrollView>

      {/* Side Menu Modal */}
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