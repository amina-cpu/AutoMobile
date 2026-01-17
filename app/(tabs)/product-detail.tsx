import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator, Alert, Dimensions, FlatList, Image, Linking,
    ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../src/config/supabase';
import { carService } from '../src/services/carService';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [car, setCar] = useState(null);
  const [seller, setSeller] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [similarCars, setSimilarCars] = useState([]);
  const [recommendedCars, setRecommendedCars] = useState([]);
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(4);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      if (!data) { setError('Car not found'); return; }
      setCar(data);

      if (data.seller_id) {
        try {
          const { data: sellerData } = await supabase.from('users').select('*').eq('id', data.seller_id).single();
          if (sellerData) {
            setSeller(sellerData);
            const { data: sellerCars } = await supabase.from('cars').select('id').eq('seller_id', data.seller_id);
            setSellerStats({
              totalListings: sellerCars?.length || 0,
              rating: 4.8,
              reviews: 142,
              siret: '92752127800014',
              lastActivity: 'il y a 1 minute'
            });
          }
        } catch (err) { console.log('Could not fetch seller info:', err); }
      }

      try {
        const { data: similarData } = await supabase.from('cars')
          .select('id, brand, model, price, year, mileage, fuel_type, seller_id, users(full_name), car_images(*)')
          .eq('seller_id', data.seller_id).neq('id', carId).limit(5);
        if (similarData) setSimilarCars(similarData);
      } catch (err) { console.log('Could not fetch similar cars:', err); }

      try {
        const { data: recommendedData } = await supabase.from('cars')
          .select('id, brand, model, price, year, mileage, fuel_type, city, seller_id, users(full_name), car_images(*)')
          .eq('brand', data.brand).neq('id', carId).limit(5);
        if (recommendedData) setRecommendedCars(recommendedData);
      } catch (err) { console.log('Could not fetch recommended cars:', err); }

      if (data.car_images && data.car_images.length > 0) {
        setCarImages(data.car_images);
      } else {
        setCarImages([]);
      }
    } catch (err) {
      console.error('Error loading car details:', err);
      setError(err.message || 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  
  const handlePhonePress = () => {
    if (seller?.phone) {
      Alert.alert('Numéro', seller.phone, [
        { text: 'Appeler', onPress: () => Linking.openURL(`tel:${seller.phone}`) },
        { text: 'Copier', onPress: () => console.log('copy') },
        { text: 'Annuler', style: 'cancel' }
      ]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${car.brand} ${car.model} - ${car.price}€` });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Car not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3b82f6' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* IMAGE CAROUSEL */}
        <View style={styles.imageContainer}>
          {carImages.length > 0 ? (
            <Image source={{ uri: carImages[currentImageIndex].image_url }} style={styles.carImage} />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 80 }}>🚗</Text>
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.topRightButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={{ fontSize: 18 }}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => {
                setLiked(!liked);
                setLikeCount(liked ? likeCount - 1 : likeCount + 1);
              }}
            >
              <Text style={styles.likeButtonText}>{likeCount}</Text>
              <Text style={styles.likeHeart}>♥</Text>
            </TouchableOpacity>
          </View>

          {carImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={() => setCurrentImageIndex(Math.min(carImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === carImages.length - 1}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>

              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{carImages.length}
                </Text>
              </View>
            </>
          )}

          <View style={styles.similarBadge}>
            <Text style={styles.similarBadgeText}>📷 Annonces similaires</Text>
            <View style={styles.similarBadgeCounter}>
              <Text style={[styles.similarBadgeText, { fontSize: 11 }]}>1/40</Text>
            </View>
          </View>
        </View>

        {/* CAR INFO CARD */}
        <View style={styles.carInfoCard}>
          <View style={styles.carInfoRow}>
            {carImages.length > 0 && (
              <Image source={{ uri: carImages[0].image_url }} style={styles.carImageThumb} />
            )}
            <View style={styles.carInfoContent}>
              <View>
                <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
                <Text style={styles.carSubtitle}>
                  {car.city} · {car.year} · {car.mileage} km · {car.fuel_type} · Rapport d'historique disponible
                </Text>
              </View>
              <Text style={styles.price}>{car.price} €</Text>
              <Text style={styles.postedTime}>hier à 21:02</Text>
            </View>
          </View>
        </View>

        {/* LOCATION CHIPS */}
        <View style={styles.locationChips}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.locationChip}>
              <Text style={styles.chipText}>{car.city} {car.postal_code || '77230'}</Text>
            </View>
            <View style={styles.locationChip}>
              <Text style={styles.chipText}>{car.city} {car.postal_code || '77230'}</Text>
            </View>
            <View style={styles.locationChip}>
              <Text style={styles.chipText}>{car.city} {car.postal_code || '77230'}</Text>
            </View>
          </ScrollView>
        </View>

        {/* REPORT AD */}
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>🚩</Text>
          <Text style={styles.actionText}>Signaler l'annonce</Text>
        </View>

        {/* RIGHTS AND OBLIGATIONS */}
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>ⓘ</Text>
          <Text style={styles.actionText}>Vos droits et obligations</Text>
        </View>

        {/* RECOMMENDED ADS */}
        {recommendedCars.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWithArrow}>
                <Text style={styles.sectionTitle}>Ces annonces peuvent vous intéresser</Text>
                <Text style={{ fontSize: 18, color: '#9ca3af' }}>›</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={recommendedCars}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recommendedCard}
                  onPress={() => navigation.push('ProductDetail', { carId: item.id })}
                >
                  {item.car_images && item.car_images.length > 0 ? (
                    <View style={styles.recommendedImage}>
                      <Image
                        source={{ uri: item.car_images[0].image_url }}
                        style={{ width: '100%', height: '100%' }}
                      />
                      <TouchableOpacity style={styles.cardLikeButton}>
                        <Text style={{ fontSize: 14 }}>♡</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.recommendedImage, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 50 }}>🚗</Text>
                    </View>
                  )}
                  <View style={styles.recommendedContent}>
                    <Text style={styles.recommendedTitle}>{item.brand} {item.model}</Text>
                    <Text style={styles.recommendedSubtitle}>
                      {item.year} • {item.mileage} km • {item.fuel_type}
                    </Text>
                    <Text style={styles.recommendedPrice}>{item.price} €</Text>
                    <Text style={styles.recommendedMeta}>Pack Sérénité</Text>
                    <Text style={styles.recommendedMeta}>{item.city || 'Orly'} 94310</Text>
                    <Text style={styles.recommendedMeta}>lundi dernier à 17:16</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            />
          </View>
        )}

        {/* SELLER SECTION */}
        {seller && (
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Vendu par</Text>
            <View style={{ height: 12 }} />
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  {seller.avatar_url ? (
                    <Image source={{ uri: seller.avatar_url }} style={styles.sellerAvatarImage} />
                  ) : (
                    <Text style={styles.sellerAvatarText}>{getInitials(seller.full_name)}</Text>
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{seller.full_name}</Text>
                  <View style={styles.sellerRating}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.ratingText}>{sellerStats?.rating} ({sellerStats?.reviews})</Text>
                  </View>
                  <View style={styles.sellerBadgeRow}>
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>Pro</Text>
                    </View>
                    <Text style={styles.sellerMeta}>N° SIRET: {sellerStats?.siret}</Text>
                  </View>
                  <Text style={styles.sellerMeta}>📧 {seller.email}</Text>
                  <Text style={styles.sellerMeta}>🕐 Dernière activité {sellerStats?.lastActivity}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Suivre</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SELLER'S OTHER LISTINGS */}
        {similarCars.length > 0 && (
          <View style={styles.sellerListingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Les annonces de ce pro</Text>
            </View>
            <FlatList
              horizontal
              data={similarCars}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recommendedCard}
                  onPress={() => navigation.push('ProductDetail', { carId: item.id })}
                >
                  {item.car_images && item.car_images.length > 0 ? (
                    <View style={styles.recommendedImage}>
                      <Image
                        source={{ uri: item.car_images[0].image_url }}
                        style={{ width: '100%', height: '100%' }}
                      />
                      <TouchableOpacity style={styles.cardLikeButton}>
                        <Text style={{ fontSize: 14 }}>♡</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.recommendedImage, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 50 }}>🚗</Text>
                    </View>
                  )}
                  <View style={styles.recommendedContent}>
                    <Text style={styles.recommendedTitle}>{item.brand} {item.model}</Text>
                    <Text style={styles.recommendedSubtitle}>
                      {item.year} • {item.mileage} km • {item.fuel_type}
                    </Text>
                    <Text style={styles.recommendedPrice}>{item.price} €</Text>
                    <Text style={styles.recommendedMeta}>Pack Sérénité</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            />
            <View style={styles.sellerCardCompact}>
              <View style={styles.sellerAvatarCompact}>
                <Text style={styles.sellerAvatarTextCompact}>{getInitials(seller?.full_name || '')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{seller?.full_name}</Text>
                <View style={styles.sellerRating}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>{sellerStats?.rating} ({sellerStats?.reviews})</Text>
                </View>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
                <Text style={styles.sellerMeta}>{sellerStats?.totalListings} annonces</Text>
              </View>
            </View>
          </View>
        )}

        {/* ADVANTAGES */}
        <View style={styles.advantagesSection}>
          <Text style={styles.sectionTitle}>Les + de cette annonce</Text>
          <View style={{ height: 16 }} />
          <View style={styles.advantagesGrid}>
            <View style={styles.advantageItem}>
              <View style={styles.advantageIcon}><Text style={{ fontSize: 20 }}>🕐</Text></View>
              <Text style={styles.advantageText}>Annonce{'\n'}récente</Text>
            </View>
            <View style={styles.advantageItem}>
              <View style={styles.advantageIcon}><Text style={{ fontSize: 20 }}>🅿️</Text></View>
              <Text style={styles.advantageText}>Aide au{'\n'}stationnement</Text>
            </View>
            <View style={styles.advantageItem}>
              <View style={styles.advantageIcon}><Text style={{ fontSize: 20 }}>⏱️</Text></View>
              <Text style={styles.advantageText}>Régulateur{'\n'}de vitesse</Text>
            </View>
            <View style={styles.advantageItem}>
              <View style={styles.advantageIcon}><Text style={{ fontSize: 20 }}>📱</Text></View>
              <Text style={styles.advantageText}>Bluetooth</Text>
            </View>
          </View>
        </View>

        {/* AD PLACEHOLDER */}
        <View style={styles.adPlaceholder}>
          <View style={styles.adBox}>
            <Text style={styles.adText}>leboncoin</Text>
            <Text style={styles.adLabel}>Publicité</Text>
          </View>
        </View>

        {/* FINANCE SECTION */}
        <View style={styles.financeSection}>
          <Text style={styles.sectionTitle}>Financer mon véhicule</Text>
          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Crédit classique</Text>
            <Text style={styles.financeLabel}>Apport personnel</Text>
            <Text style={styles.financeInput}>2198 €</Text>
            <Text style={styles.financeHint}>20% du prix total recommandé.</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.financeLabel}>Durée du financement</Text>
              <Text style={styles.sliderValue}>48 mois</Text>
            </View>
            <Text style={styles.financeHint}>12 mois ━━━━━━━━━●━ 60 mois</Text>
            <View style={styles.financePrompt}>
              <Text style={styles.financePromptTitle}>Vous souhaitez financer votre achat ?</Text>
              <Text style={styles.financePromptText}>
                N'hésitez pas à contacter le vendeur pour avoir une simulation plus détaillée.
              </Text>
              <TouchableOpacity style={styles.contactButton}>
                <Text style={styles.contactButtonText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* KEY INFORMATION */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Les informations clés</Text>
          <View style={{ height: 8 }} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📋 Marque</Text>
            <Text style={styles.infoValue}>{car.brand}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🚗 Modèle</Text>
            <Text style={styles.infoValue}>A4</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Année modèle</Text>
            <Text style={styles.infoValue}>{car.year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🔧 Kilométrage</Text>
            <Text style={styles.infoValue}>{car.mileage} km</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⛽ Énergie</Text>
            <Text style={styles.infoValue}>{car.fuel_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⚙️ Boîte de vitesse</Text>
            <Text style={styles.infoValue}>{car.transmission}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📋 Finition Constructeur</Text>
            <Text style={styles.infoValue}>S line</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>📋 Version Constructeur</Text>
            <Text style={styles.infoValue}>A4 2.0 TDI 143ch... +</Text>
          </View>
          <TouchableOpacity style={styles.expandButton}>
            <Text style={styles.expandButtonText}>Voir les 7 critères supplémentaires</Text>
          </TouchableOpacity>
        </View>

        {/* EQUIPMENT */}
        <View style={styles.equipmentSection}>
          <View style={styles.equipmentLeft}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
            <Text style={styles.sectionTitle}>Équipements</Text>
          </View>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>Voir</Text>
          </TouchableOpacity>
        </View>

        {/* VEHICLE HISTORY */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Historique du véhicule Autoviza ®</Text>
          <View style={{ height: 8 }} />
          {car.description && (
            <Text style={styles.descriptionText}>{car.description}</Text>
          )}
        </View>

        {/* AD PLACEHOLDER 2 */}
        <View style={styles.adPlaceholder}>
          <View style={styles.adBox}>
            <Text style={styles.adText}>leboncoin</Text>
            <Text style={styles.adLabel}>Publicité</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM BUTTONS */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.phoneButton} onPress={handlePhonePress}>
          <Text style={styles.phoneButtonText}>Voir le numéro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 18, color: '#ef4444', textAlign: 'center' },
  imageContainer: { height: 380, backgroundColor: '#000', position: 'relative', overflow: 'hidden' },
  carImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { position: 'absolute', top: 16, left: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  backButtonText: { fontSize: 24, color: '#000' },
  topRightButtons: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 },
  shareButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  likeButton: { height: 48, paddingHorizontal: 16, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  likeButtonText: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  likeHeart: { fontSize: 16, color: '#ef4444' },
  navButton: { position: 'absolute', top: '50%', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  navButtonLeft: { left: 12 },
  navButtonRight: { right: 12 },
  navButtonText: { fontSize: 20, color: '#000', fontWeight: 'bold' },
  imageCounter: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  imageCounterText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  similarBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#003d7a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  similarBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  similarBadgeCounter: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  carInfoCard: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  carInfoRow: { flexDirection: 'row', gap: 12 },
  carImageThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  carInfoContent: { flex: 1, justifyContent: 'space-between' },
  carTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  carSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  price: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  postedTime: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  locationChips: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locationChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 16, marginRight: 8 },
  chipText: { fontSize: 12, color: '#4b5563' },
  actionRow: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 13, color: '#1f2937' },
  sectionHeader: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  sectionTitleWithArrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendedSection: { backgroundColor: '#ffffff', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  horizontalScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  recommendedCard: { width: 240, marginRight: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', overflow: 'hidden' },
  recommendedImage: { width: '100%', height: 140, backgroundColor: '#f1f5f9', position: 'relative' },
  cardLikeButton: { position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  recommendedContent: { padding: 10 },
  recommendedTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  recommendedSubtitle: { fontSize: 11, color: '#6b7280', marginBottom: 8 },
  recommendedPrice: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  recommendedMeta: { fontSize: 10, color: '#6b7280', lineHeight: 14 },
  sellerSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  sellerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sellerInfo: { flexDirection: 'row', flex: 1, gap: 12 },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sellerAvatarImage: { width: '100%', height: '100%' },
  sellerAvatarText: { fontSize: 18, color: '#ffffff', fontWeight: '700' },
  sellerDetails: { flex: 1 },
  sellerName: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  star: { fontSize: 12, color: '#f59e0b' },
  ratingText: { fontSize: 11, color: '#6b7280' },
  sellerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 4 },
  proBadgeText: { fontSize: 9, color: '#3b82f6', fontWeight: '700' },
  sellerMeta: { fontSize: 10, color: '#6b7280', lineHeight: 14 },
  followButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 8 },
  followButtonText: { fontSize: 11, color: '#3b82f6', fontWeight: '700' },
  sellerListingsSection: { backgroundColor: '#ffffff', marginBottom: 12 },
  sellerCardCompact: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f9fafb', marginHorizontal: 16, borderRadius: 8, marginBottom: 12, gap: 12 },
  sellerAvatarCompact: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  sellerAvatarTextCompact: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  advantagesSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  advantagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  advantageItem: { width: (width - 32 - 36) / 4, alignItems: 'center', gap: 8 },
  advantageIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  advantageText: { fontSize: 10, color: '#4b5563', textAlign: 'center', lineHeight: 13 },
  adPlaceholder: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12 },
  adBox: { height: 120, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  adText: { fontSize: 20, fontWeight: '700', color: '#9ca3af', marginBottom: 4 },
  adLabel: { fontSize: 11, color: '#9ca3af' },
  financeSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12 },
  financeCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, marginTop: 12 },
  financeTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  financeLabel: { fontSize: 13, color: '#1f2937', marginBottom: 8 },
  financeInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  financeHint: { fontSize: 11, color: '#6b7280', marginBottom: 16 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderValue: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  financePrompt: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, marginTop: 16 },
  financePromptTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  financePromptText: { fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 16 },
  contactButton: { backgroundColor: '#003d7a', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  contactButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  infoSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 12, color: '#1f2937', fontWeight: '700' },
  expandButton: { paddingTop: 12 },
  expandButtonText: { fontSize: 12, color: '#3b82f6', textDecorationLine: 'underline' },
  equipmentSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  equipmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 8 },
  viewButtonText: { fontSize: 12, color: '#3b82f6', fontWeight: '700' },
  descriptionSection: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  descriptionText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  bottomButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  phoneButton: { flex: 1, paddingVertical: 14, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 8, alignItems: 'center' },
  phoneButtonText: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
  messageButton: { flex: 1, paddingVertical: 14, backgroundColor: '#003d7a', borderRadius: 8, alignItems: 'center' },
  messageButtonText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
});