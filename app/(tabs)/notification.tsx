import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/config/supabase';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  darkTeal3: '#05696F',
  primaryGreen: '#41B975',
  darkGreen: '#268865',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#f5f5f5',
  gray100: '#f8fafc',
  gray200: '#f1f5f9',
  gray300: '#e2e8f0',
  gray400: '#cbd5e1',
  gray500: '#64748b',
  gray700: '#1f2937',
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(imagePath);
    
    return data?.publicUrl || null;
  };

  // Reload notifications every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [Notifications] Screen focused, reloading...');
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ [Notifications] No user logged in:', userError);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      console.log('👤 [Notifications] Loading notifications for user:', user.id);

      // Check if notifications are enabled for this user
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        console.error('❌ [Notifications] Error fetching user settings:', userDataError);
        // Default to enabled if we can't fetch the setting
        setNotificationsEnabled(true);
      } else {
        const enabled = userData?.notifications_enabled !== false;
        setNotificationsEnabled(enabled);
        console.log('🔔 [Notifications] Notifications enabled:', enabled);

        // If notifications are disabled, don't load them
        if (!enabled) {
          console.log('⚠️ [Notifications] Notifications disabled by user');
          setNotifications([]);
          setLoading(false);
          return;
        }
      }

      // Get user's cars
      const { data: userCars, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq('seller_id', user.id);

      if (carsError) {
        console.error('❌ [Notifications] Error fetching user cars:', carsError);
        setNotifications([]);
        setLoading(false);
        return;
      }

      if (!userCars || userCars.length === 0) {
        console.log('⚠️ [Notifications] User has no cars listed');
        setNotifications([]);
        setLoading(false);
        return;
      }

      const carIds = userCars.map(car => car.id);
      console.log('🚗 [Notifications] User has', carIds.length, 'cars');

      // Get favorites on user's cars with user info and car details
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?car_id=in.(${carIds.join(',')})&select=*,users!favorites_user_id_fkey(full_name,avatar_url),cars(brand,model,car_images(image_url))&order=created_at.desc`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Notifications] Fetch failed:', response.status, errorText);
        setNotifications([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📦 [Notifications] Favorites data:', Array.isArray(data) ? `${data.length} items` : typeof data);

      if (!Array.isArray(data)) {
        console.error('❌ [Notifications] Data is not an array:', data);
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Process notifications
      const processedNotifications = data.map(fav => ({
        id: fav.id,
        userId: fav.user_id, // Add user ID for profile navigation
        userName: fav.users?.full_name || 'Un utilisateur',
        userAvatar: fav.users?.avatar_url,
        carBrand: fav.cars?.brand,
        carModel: fav.cars?.model,
        carImage: fav.cars?.car_images?.[0]?.image_url 
          ? getImageUrl(fav.cars.car_images[0].image_url)
          : null,
        carId: fav.car_id,
        createdAt: fav.created_at,
        isRead: false,
      }));

      setNotifications(processedNotifications);
      console.log(`✅ [Notifications] Loaded ${processedNotifications.length} notifications`);
    } catch (error) {
      console.error('❌ [Notifications] Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderNotification = (notification) => (
    <View
      key={notification.id}
      style={styles.notificationCard}
    >
      <View style={styles.notificationContent}>
        {/* User Avatar - Clickable */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('sellerProfile', { sellerId: notification.userId })}
          activeOpacity={0.7}
        >
          {notification.userAvatar ? (
            <Image 
              source={{ uri: notification.userAvatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {notification.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.heartBadge}>
            <Text style={styles.heartIcon}>❤️</Text>
          </View>
        </TouchableOpacity>

        {/* Notification Text - Clickable to car */}
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => navigation.navigate('product-detail', { carId: notification.carId })}
          activeOpacity={0.7}
        >
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{notification.userName}</Text>
            {' aime votre '}
            <Text style={styles.carName}>
              {notification.carBrand} {notification.carModel?.split(' - ')[0]}
            </Text>
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(notification.createdAt)}</Text>
        </TouchableOpacity>

        {/* Car Image - Clickable to car */}
        {notification.carImage && (
          <TouchableOpacity
            onPress={() => navigation.navigate('product-detail', { carId: notification.carId })}
            activeOpacity={0.7}
          >
            <View style={styles.carImageContainer}>
              <Image 
                source={{ uri: notification.carImage }} 
                style={styles.carImage}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            <Text style={styles.loadingText}>Chargement des notifications...</Text>
          </View>
        ) : !notificationsEnabled ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyTitle}>Notifications désactivées</Text>
            <Text style={styles.emptyText}>
              Activez les notifications dans les paramètres pour recevoir des alertes lorsque quelqu'un aime vos véhicules
            </Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('settings')}
            >
              <Text style={styles.settingsButtonText}>Aller aux paramètres</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vous recevrez des notifications lorsque quelqu'un aime vos véhicules
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.notificationsContainer}>
              {notifications.map((notification) => renderNotification(notification))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.darkTeal1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  headerBackButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerBackText: { 
    fontSize: 28,
    color: COLORS.white, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  headerContainer: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
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
    color: COLORS.gray500,
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
    color: COLORS.darkTeal1,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  settingsButton: {
    backgroundColor: COLORS.darkTeal1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  settingsButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  notificationsContainer: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray300,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.darkTeal1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  heartIcon: {
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 20,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: COLORS.darkTeal1,
  },
  carName: {
    fontWeight: '600',
    color: COLORS.darkTeal1,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  carImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});