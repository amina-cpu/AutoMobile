import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

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
        setNotificationsEnabled(true);
      } else {
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

  // ✅ CRITICAL FIX: Use signOut + signIn approach instead of updateUser
  const handleChangePassword = async () => {
    setPasswordError('');

    // Validation
    if (!currentPassword.trim()) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    // ✅ Close modal immediately to prevent UI freeze
    setChangePasswordModalVisible(false);
    setSaving(true);

    try {
      console.log('🔑 [Settings] Step 1: Verifying current password...');

      // Get current user to get email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not found');
      }

      // Step 1: Verify current password by attempting sign in (don't update session)
      console.log('🔑 [Settings] Step 2: Testing current password with sign in...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        console.error('❌ [Settings] Invalid current password');
        setSaving(false);
        setTimeout(() => {
          setPasswordError('Le mot de passe actuel est incorrect');
          setChangePasswordModalVisible(true);
        }, 100);
        return;
      }

      console.log('✅ [Settings] Current password verified');

      // Step 2: Update password using updateUser
      // This will trigger USER_UPDATED event but we close the modal first
      console.log('🔑 [Settings] Step 3: Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ [Settings] Error updating password:', updateError);
        setSaving(false);
        setTimeout(() => {
          setPasswordError(updateError.message || 'Erreur lors de la mise à jour');
          setChangePasswordModalVisible(true);
        }, 100);
        return;
      }

      console.log('✅ [Settings] Password updated successfully');

      // Reset form immediately
      resetPasswordForm();
      setSaving(false);

      // Show success after a delay to ensure UI is stable
      setTimeout(() => {
        showSuccess(
          'Mot de passe changé ✓',
          'Votre mot de passe a été mis à jour avec succès. Vous resterez connecté.'
        );
      }, 400);

    } catch (error) {
      console.error('❌ [Settings] Error:', error);
      setSaving(false);
      
      setTimeout(() => {
        setPasswordError(error.message || 'Une erreur est survenue');
        setChangePasswordModalVisible(true);
      }, 100);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setCurrentPasswordFocused(false);
    setNewPasswordFocused(false);
    setConfirmPasswordFocused(false);
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

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sécurité</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => setChangePasswordModalVisible(true)}
              >
                <View style={styles.settingIconContainer}>
                  <View style={styles.lockIcon}>
                    <View style={styles.lockBody} />
                    <View style={styles.lockShackle} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Changer le mot de passe</Text>
                  <Text style={styles.settingDescription}>
                    Mettre à jour votre mot de passe
                  </Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                  <View style={styles.securityIcon}>
                    <View style={styles.shieldBody} />
                  </View>
                </View>
                
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Confidentialité</Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Change Password Modal */}
        <Modal
          visible={changePasswordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!saving) {
              setChangePasswordModalVisible(false);
              resetPasswordForm();
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Changer le mot de passe</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    if (!saving) {
                      setChangePasswordModalVisible(false);
                      resetPasswordForm();
                    }
                  }}
                  disabled={saving}
                >
                  <Text style={styles.modalCloseIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {passwordError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {passwordError}</Text>
                  </View>
                ) : null}

                {/* Current Password */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
                  <View style={[styles.passwordInputContainer, currentPasswordFocused && styles.passwordInputContainerFocused]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez votre mot de passe"
                      placeholderTextColor={COLORS.gray400}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      onFocus={() => setCurrentPasswordFocused(true)}
                      onBlur={() => setCurrentPasswordFocused(false)}
                      editable={!saving}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={saving}
                    >
                      <Text style={styles.toggleButtonText}>{showCurrentPassword ? '○' : '●'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                  <View style={[styles.passwordInputContainer, newPasswordFocused && styles.passwordInputContainerFocused]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Au moins 6 caractères"
                      placeholderTextColor={COLORS.gray400}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                      editable={!saving}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={saving}
                    >
                      <Text style={styles.toggleButtonText}>{showNewPassword ? '○' : '●'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
                  <View style={[styles.passwordInputContainer, confirmPasswordFocused && styles.passwordInputContainerFocused]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmer le nouveau mot de passe"
                      placeholderTextColor={COLORS.gray400}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      editable={!saving}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={saving}
                    >
                      <Text style={styles.toggleButtonText}>{showConfirmPassword ? '○' : '●'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.infoText}>
                  💡 Le mot de passe doit contenir au moins 6 caractères
                </Text>
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, saving && styles.cancelButtonDisabled]}
                  onPress={() => {
                    setChangePasswordModalVisible(false);
                    resetPasswordForm();
                  }}
                  disabled={saving}
                >
                  <Text style={[styles.cancelButtonText, saving && styles.cancelButtonTextDisabled]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Changement...</Text>
                    </>
                  ) : (
                    <Text style={styles.saveButtonText}>Changer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 12,
    paddingHorizontal: 16,
  },
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
  securityIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldBody: {
    width: 16,
    height: 18,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '85%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray700,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    color: COLORS.gray500,
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray500,
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    height: 56,
  },
  passwordInputContainerFocused: {
    borderColor: COLORS.darkTeal1,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray700,
    paddingVertical: 14,
  },
  toggleButton: {
    padding: 8,
    marginLeft: 12,
  },
  toggleButtonText: {
    fontSize: 18,
    color: COLORS.darkTeal1,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray200,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  cancelButtonTextDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: COLORS.darkTeal1,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});