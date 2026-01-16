import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
  },
  imageCarousel: {
    height: 400,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carImagePlaceholder: {
    fontSize: 120,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  breadcrumb: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 20,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  leftButton: {
    left: 16,
  },
  rightButton: {
    right: 16,
  },
  navButtonText: {
    fontSize: 32,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1f2e',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  carName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  carModel: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
  },
  specsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
    flexWrap: 'wrap',
  },
  specText: {
    fontSize: 14,
    color: '#475569',
  },
  priceSection: {
    marginBottom: 20,
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  feesText: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#fef3f2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  ratingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 28,
    marginHorizontal: 2,
    color: '#fbbf24',
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  ratingCount: {
    fontSize: 13,
    color: '#64748b',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 8,
  },
});

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [car, setCar] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load car details when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const carId = route.params?.carId;
      if (carId) {
        loadCarDetails(carId);
      } else {
        setError('Car ID not provided');
        setLoading(false);
      }
    }, [route.params?.carId])
  );

  const loadCarDetails = async (carId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await carService.getCarById(carId);
      
      if (!data) {
        setError('Car not found');
        return;
      }
      
      setCar(data);

      // Fetch car images from car_images table
      try {
        const { data: images, error: imagesError } = await supabase
          .from('car_images')
          .select('*')
          .eq('car_id', carId)
          .order('display_order', { ascending: true });

        if (imagesError) {
          console.warn('Could not fetch images:', imagesError);
          setCarImages([]);
        } else {
          setCarImages(images || []);
        }
      } catch (imgErr) {
        console.warn('Error loading images:', imgErr);
        setCarImages([]);
      }
    } catch (err) {
      console.error('Error loading car details:', err);
      setError(err.message || 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Car not found'}</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: '#3b82f6', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {carImages.length > 0 ? (
            <Image 
              source={{ uri: carImages[currentImageIndex].image_url }} 
              style={styles.carImage} 
            />
          ) : car.image ? (
            <Image 
              source={{ uri: car.image }} 
              style={styles.carImage} 
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.carImagePlaceholder}>🚗</Text>
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          {/* Breadcrumb */}
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>
              Toutes nos voitures › {car.brand} › {car.model?.split(' - ')[0]}
            </Text>
          </View>

          {/* Navigation Buttons for Images */}
          {carImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.leftButton]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.rightButton]}
                onPress={() => setCurrentImageIndex(Math.min(carImages.length - 1, currentImageIndex + 1))}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>

              {/* Image Counter */}
              <View style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}>
                <Text style={{
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: 12,
                }}>
                  {currentImageIndex + 1} / {carImages.length}
                </Text>
              </View>
            </>
          )}

          {/* Bottom Bar with Title and Actions */}
          <View style={styles.bottomBar}>
            <Text style={styles.carTitle}>{car.brand} {car.model?.split(' - ')[0]}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={{ fontSize: 20 }}>▶️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={{ fontSize: 20 }}>⛶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Action Icons */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
            <TouchableOpacity 
              style={{ marginRight: 16 }}
              onPress={() => setLiked(!liked)}
            >
              <Text style={{ fontSize: 28, color: liked ? '#ef4444' : '#9ca3af' }}>
                {liked ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={{ fontSize: 24 }}>↗</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.carName}>{car.brand} {car.model?.split(' - ')[0]}</Text>
          <Text style={styles.carModel}>{car.model}</Text>

          {/* Specs */}
          <View style={styles.specsRow}>
            <Text style={styles.specText}>{car.year} | </Text>
            <Text style={styles.specText}>{car.mileage} km | </Text>
            <Text style={styles.specText}>{car.fuel_type}</Text>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{car.price} €</Text>
            <Text style={styles.feesText}>+ 299 € de frais de dossier</Text>
          </View>

          {/* Status Badge */}
          {car.status === 'reserved' && (
            <View style={styles.statusBadge}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.statusText}>Véhicule réservé</Text>
            </View>
          )}

          {car.status === 'sold' && (
            <View style={styles.statusBadge}>
              <Text style={styles.lockIcon}>✓</Text>
              <Text style={styles.statusText}>Véhicule vendu</Text>
            </View>
          )}

          {/* Description */}
          {car.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          )}

          {/* CTA Buttons */}
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Voir les voitures similaires</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Être averti à réception de voitures similaires</Text>
          </TouchableOpacity>

          {/* Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Nos clients recommandent AutoMobile :</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.star}>★</Text>
              ))}
            </View>
            <Text style={styles.ratingScore}>4.8 / 5</Text>
            <Text style={styles.ratingCount}>2216 avis clients</Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>👨‍🔧</Text>
              <Text style={styles.infoTitle}>Voitures</Text>
              <Text style={styles.infoSubtitle}>contrôlées</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>👍</Text>
              <Text style={styles.infoTitle}>Garantie</Text>
              <Text style={styles.infoSubtitle}>incluse</Text>
            </View>
          </View>

          {/* Key Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informations clés</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marque</Text>
                <Text style={styles.infoValue}>{car.brand}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kilométrage</Text>
                <Text style={styles.infoValue}>{car.mileage} km</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Année</Text>
                <Text style={styles.infoValue}>{car.year}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Carburant</Text>
                <Text style={styles.infoValue}>{car.fuel_type}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Transmission</Text>
                <Text style={styles.infoValue}>{car.transmission}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}