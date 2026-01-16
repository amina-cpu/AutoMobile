import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImageText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
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
});

export default function BuyScreen() {
  return (
    <View style={styles.container}>
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
          />
        </View>

        <View style={styles.securityBadge}>
          <Text>🔒</Text>
          <Text style={styles.securityText}>Paiement sécurisé</Text>
          <Text style={styles.moreText}>Plus pertinent ›</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.carListingContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carCard}>
          <View style={styles.carImageContainer}>
            <Text style={styles.carImageText}>[Car Image]</Text>
            <TouchableOpacity style={styles.likeButton}>
              <Text style={{ fontSize: 20 }}>♡</Text>
            </TouchableOpacity>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>11590 €</Text>
            </View>
          </View>
          <View style={styles.carInfo}>
            <Text style={styles.carName}>Opel Grandland X</Text>
            <Text style={styles.carModel}>Ultimate - 1.6 CDTI 120</Text>
            <View style={styles.carDetails}>
              <Text>2018</Text>
              <Text>138262 km</Text>
              <Text>Diesel</Text>
              <Text>Manuelle</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.alertButton}>
          <Text>🔔</Text>
          <Text style={styles.alertText}>Créer une alerte</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          Plus de véhicules à découvrir...
        </Text>
      </ScrollView>
    </View>
  );
}