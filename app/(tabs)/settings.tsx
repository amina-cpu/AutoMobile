import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import { supabase } from '../src/config/supabase';

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
  red: '#ef4444',
  lightRed: '#fee2e2',
  lightBlue: '#e0f2fe',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { alertConfig, showSuccess, showError, dismiss } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('⚙️ [Settings] Loading settings...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ [Settings] No user logged in:', userError);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      console.log('👤 [Settings] User ID:', user.id);

      // Get user's notification settings
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ [Settings] Error fetching settings:', fetchError);
        // If column doesn't exist, default to enabled
        setNotificationsEnabled(true);
      } else {
        // If column exists but is null, default to enabled
        setNotificationsEnabled(userData?.notifications_enabled !== false);
        console.log('✅ [Settings] Notifications enabled:', userData?.notifications_enabled);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ [Settings] Error loading settings:', error);
      setLoading(false);
    }
  };

  const toggleNotifications = async (value) => {
    try {
      setSaving(true);
      console.log('🔔 [Settings] Toggling notifications to:', value);

      if (!userId) {
        showError('Erreur', 'Utilisateur non connecté');
        setSaving(false);
        return;
      }

      // Update notification setting in database
      const { error } = await supabase
        .from('users')
        .update({ notifications_enabled: value })
        .eq('id', userId);

      if (error) {
        console.error('❌ [Settings] Error updating notifications:', error);
        showError('Erreur', 'Impossible de mettre à jour les paramètres');
        setSaving(false);
        return;
      }

      setNotificationsEnabled(value);
      showSuccess(
        value ? 'Notifications activées' : 'Notifications désactivées',
        value 
          ? 'Vous recevrez des notifications pour vos annonces' 
          : 'Vous ne recevrez plus de notifications'
      );
      console.log('✅ [Settings] Notification settings updated');
      setSaving(false);
    } catch (error) {
      console.error('❌ [Settings] Error toggling notifications:', error);
      showError('Erreur', 'Une erreur est survenue');
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: confirmDeleteAccount 
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setSaving(true);
      // In a real app, you would call an edge function or backend API
      // that handles account deletion properly
      Alert.alert(
        'Non implémenté',
        'La suppression de compte nécessite une implémentation backend sécurisée.'
      );
      setSaving(false);
    } catch (error) {
      console.error('❌ [Settings] Error deleting account:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le compte');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.fullContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
        
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.headerBackText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={styles.placeholder} />
        </View>
        
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
         <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <View style={styles.bellIcon}>
                    <View style={styles.bellBody} />
                    <View style={styles.bellHandle} />
                    {notificationsEnabled && <View style={styles.bellDot} />}
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Notifications push</Text>
                  <Text style={styles.settingDescription}>
                    Recevoir des notifications lorsque quelqu'un aime vos annonces
                  </Text>
                </View>
                
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primaryGreen + '80' }}
                  thumbColor={notificationsEnabled ? COLORS.primaryGreen : COLORS.gray200}
                  ios_backgroundColor={COLORS.gray300}
                  disabled={saving}
                />
              </View>
            </View>
          </View>

          {/* Account Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => router.push('/profile')}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.userIcon}>
                    <View style={styles.userHead} />
                    <View style={styles.userBody} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Modifier le profil</Text>
                  <Text style={styles.settingDescription}>
                    Nom, email, photo de profil
                  </Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => router.push('/my-listings')}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.listIcon}>
                    <View style={styles.listLine} />
                    <View style={styles.listLine} />
                    <View style={styles.listLine} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Mes annonces</Text>
                  <Text style={styles.settingDescription}>
                    Gérer vos véhicules en vente
                  </Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => Alert.alert('Version', 'Automobile v1.0.0')}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.infoIcon}>
                    <Text style={styles.infoText}>i</Text>
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Version de l'app</Text>
                  <Text style={styles.settingDescription}>v1.0.0</Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => Alert.alert('Conditions', 'Conditions d\'utilisation')}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.docIcon}>
                    <View style={styles.docBody} />
                    <View style={styles.docLines} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Conditions d'utilisation</Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => Alert.alert('Confidentialité', 'Politique de confidentialité')}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.lockIcon}>
                    <View style={styles.lockBody} />
                    <View style={styles.lockShackle} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Confidentialité</Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zone dangereuse</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={handleDeleteAccount}
                disabled={saving}
              >
                <View style={[styles.settingIconContainer, styles.dangerIcon]}>
                  <View style={styles.trashIcon}>
                    <View style={styles.trashLid} />
                    <View style={styles.trashBody} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, styles.dangerText]}>
                    Supprimer le compte
                  </Text>
                  <Text style={styles.settingDescription}>
                    Cette action est irréversible
                  </Text>
                </View>
                
                <Text style={[styles.chevron, styles.dangerText]}>›</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          <View style={{ height: 40 }} />
        </ScrollView>

        <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onDismiss={dismiss}
          duration={alertConfig.duration}
        />
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
    paddingBottom: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray500,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.darkTeal1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkTeal1,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.gray400,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginLeft: 68,
  },
  dangerIcon: {
    backgroundColor: COLORS.lightRed,
  },
  dangerText: {
    color: COLORS.red,
  },
  // Bell Icon
  bellIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  bellBody: {
    width: 14,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomWidth: 0,
    alignSelf: 'center',
  },
  bellHandle: {
    width: 18,
    height: 4,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
    alignSelf: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },
  // User Icon
  userIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginBottom: 2,
  },
  userBody: {
    width: 14,
    height: 10,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  // List Icon
  listIcon: {
    width: 18,
    height: 18,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  listLine: {
    width: 18,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  // Info Icon
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Doc Icon
  docIcon: {
    width: 16,
    height: 20,
  },
  docBody: {
    width: 16,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 2,
  },
  docLines: {
    position: 'absolute',
    top: 6,
    left: 4,
    right: 4,
  },
  // Lock Icon
  lockIcon: {
    width: 16,
    height: 20,
  },
  lockBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 16,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 3,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    left: 3,
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  // Trash Icon
  trashIcon: {
    width: 16,
    height: 20,
  },
  trashLid: {
    width: 18,
    height: 3,
    backgroundColor: COLORS.red,
    borderRadius: 1,
    marginBottom: 1,
    alignSelf: 'center',
  },
  trashBody: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: COLORS.red,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    alignSelf: 'center',
  },
});