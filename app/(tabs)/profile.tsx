import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
  lightBlue: '#e0f2f7',
  darkBlue: '#0d6978',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { alertConfig, showSuccess, dismiss } = useAlert();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    gender: '',
    phone: '',
    email: '',
    account_type: null,
    garage_name: '',
    siret: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('👤 Chargement du profil...');

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Erreur d\'authentification:', userError);
        setLoading(false);
        return;
      }

      if (!authUser) {
        console.log('⚠️ Non connecté');
        setLoading(false);
        return;
      }

      setUser(authUser);
      console.log('✅ Utilisateur authentifié:', authUser.email);

      console.log('📥 Récupération du profil depuis la base de données...');
      const { data: profileData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erreur de récupération:', fetchError);
        throw fetchError;
      }

      console.log('📊 Réponse du profil:', profileData);

      if (profileData) {
        console.log('✅ Profil trouvé');
        setProfile(profileData);
        
        // Set avatar URL from database
        if (profileData.avatar_url) {
          console.log('🖼️ Avatar URL from DB:', profileData.avatar_url);
          setAvatarUrl(profileData.avatar_url);
        }
        
        setFormData({
          full_name: profileData.full_name || '',
          username: profileData.username || authUser.email?.split('@')[0] || '',
          gender: profileData.gender || '',
          phone: profileData.phone || '',
          email: authUser.email || '',
          account_type: profileData.account_type || null,
          garage_name: profileData.garage_name || '',
          siret: profileData.siret || '',
          address: profileData.address || '',
        });
      } else {
        console.log('⚠️ Profil non trouvé dans la base de données');
        setProfile(null);
        setAvatarUrl(null);
        setFormData({
          full_name: '',
          username: authUser.email?.split('@')[0] || '',
          gender: '',
          phone: '',
          email: authUser.email || '',
          account_type: null,
          garage_name: '',
          siret: '',
          address: '',
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur du chargement du profil:', error);
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de charger le profil: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image: ' + error.message);
    }
  };

  const uploadAvatar = async (imageUri) => {
    try {
      setUpdating(true);
      console.log('📤 Téléchargement de l\'avatar...');

      if (!user?.id) {
        throw new Error('User ID not found');
      }

      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📁 File path:', filePath);

      // Fetch image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      console.log('📦 Blob size:', blob.size, 'bytes');
      console.log('📦 Blob type:', blob.type);

      // Upload using Supabase client library
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL generated:', publicUrl);

      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('✅ Database updated:', data);

      // Update local state with new avatar URL
      setAvatarUrl(publicUrl);
      if (data && data.length > 0) {
        setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      }

      showSuccess('Avatar mis à jour', 'Votre avatar a été changé avec succès');
    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      Alert.alert(
        'Erreur',
        'Impossible de télécharger l\'avatar: ' + error.message
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUpdating(true);
      console.log('💾 Sauvegarde du profil...');

      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const updateData = {};
      
      // ✅ Check all fields for changes
      if (formData.full_name !== (profile?.full_name || '')) {
        updateData.full_name = formData.full_name || null;
      }
      if (formData.username !== (profile?.username || '')) {
        updateData.username = formData.username || null;
      }
      if (formData.gender !== (profile?.gender || '')) {
        updateData.gender = formData.gender || null;
      }
      if (formData.phone !== (profile?.phone || '')) {
        updateData.phone = formData.phone || null;
      }
      if (formData.account_type !== (profile?.account_type || null)) {
        updateData.account_type = formData.account_type || null;
      }
      if (formData.garage_name !== (profile?.garage_name || '')) {
        updateData.garage_name = formData.garage_name || null;
      }
      if (formData.siret !== (profile?.siret || '')) {
        updateData.siret = formData.siret || null;
      }
      if (formData.address !== (profile?.address || '')) {
        updateData.address = formData.address || null;
      }

      if (Object.keys(updateData).length === 0) {
        console.log('⚠️ Aucun changement détecté');
        setEditModalVisible(false);
        setUpdating(false);
        return;
      }

      console.log('📝 Données à mettre à jour:', updateData);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(`Erreur de mise à jour: ${error.message}`);
      }

      console.log('✅ Données de réponse:', data);

      if (data && data.length > 0) {
        setProfile(prev => ({ ...prev, ...data[0] }));
      }

      setEditModalVisible(false);
      showSuccess('Profil mis à jour', 'Vos modifications ont été sauvegardées');
      console.log('✅ Profil sauvegardé avec succès');
    } catch (error) {
      console.error('❌ Erreur de mise à jour du profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setDisconnectModalVisible(true);
  };

  const confirmDisconnect = async () => {
    try {
      setDisconnectModalVisible(false);
      await supabase.auth.signOut();
      showSuccess('Déconnecté', 'Vous avez été déconnecté avec succès');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.darkTeal1} />
        <Text style={{ marginTop: 12, color: COLORS.gray500 }}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkTeal1} translucent={true} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profil</Text>
{/*           
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity> */}
        </View>
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatarImage}
                onError={(e) => {
                  console.error('❌ Avatar load error:', e.nativeEvent.error);
                  console.log('🔗 Tried URL:', avatarUrl);
                  // Silently handle error - don't show to user
                  setAvatarUrl(null);
                }}
                onLoad={() => console.log('✅ Avatar image loaded successfully')}
              />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={pickAvatar}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.editAvatarIcon}>✏️</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileSection}>
            <Text style={styles.userName}>
              {formData.full_name || formData.username || 'UTILISATEUR'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setEditModalVisible(true)}
            >
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20}}>
                  <View style={{position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderWidth: 2, borderColor: COLORS.white, borderRadius: 2}} />
                  <View style={{position: 'absolute', top: 0, right: 0, width: 8, height: 8, backgroundColor: COLORS.white, transform: [{rotate: '45deg'}]}} />
                </View>
              </View>
              <Text style={styles.menuText}>Modifier le profil</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

           <TouchableOpacity 
             style={styles.menuItem}
             onPress={() => router.push('/(tabs)/my-listings')}
           >
             <View style={styles.menuIconContainer}>
               <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
                 <View style={{width: 16, height: 14, borderWidth: 2, borderColor: COLORS.white, borderRadius: 3}} />
                 <View style={{position: 'absolute', top: 4, width: 10, height: 2, backgroundColor: COLORS.white}} />
                 <View style={{position: 'absolute', top: 8, width: 10, height: 2, backgroundColor: COLORS.white}} />
               </View>
             </View>
             <Text style={styles.menuText}>Mes annonces</Text>
             <Text style={styles.menuArrow}>›</Text>
           </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/settings')}
            >
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
                  <View style={{position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.white}} />
                  <View style={{position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.white}} />
                  <View style={{position: 'absolute', top: -2, width: 2, height: 6, backgroundColor: COLORS.white}} />
                  <View style={{position: 'absolute', bottom: -2, width: 2, height: 6, backgroundColor: COLORS.white}} />
                  <View style={{position: 'absolute', left: -2, width: 6, height: 2, backgroundColor: COLORS.white}} />
                  <View style={{position: 'absolute', right: -2, width: 6, height: 2, backgroundColor: COLORS.white}} />
                </View>
              </View>
              <Text style={styles.menuText}>Paramètres</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <View style={styles.signOutIconContainer}>
            <View style={{width: 18, height: 18}}>
              <View style={{position: 'absolute', left: 0, top: 3, width: 10, height: 12, borderWidth: 2, borderColor: COLORS.white, borderRightWidth: 0, borderTopLeftRadius: 3, borderBottomLeftRadius: 3}} />
              <View style={{position: 'absolute', right: 0, top: 7, width: 8, height: 2, backgroundColor: COLORS.white}} />
              <View style={{position: 'absolute', right: 0, top: 4, width: 5, height: 5, borderRightWidth: 2, borderTopWidth: 2, borderColor: COLORS.white, transform: [{rotate: '45deg'}]}} />
            </View>
          </View>
          <Text style={styles.signOutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* ✅ Basic Information Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informations Personnelles</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Albert Florest"
                  value={formData.full_name}
                  onChangeText={(value) => handleInputChange('full_name', value)}
                  editable={!updating}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nom d'utilisateur</Text>
                <TextInput
                  style={styles.input}
                  placeholder="albertflorest"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  editable={!updating}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Genre</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'homme' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('gender', 'homme')}
                    disabled={updating}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === 'homme' && styles.genderOptionTextSelected
                    ]}>
                      Homme
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'femme' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('gender', 'femme')}
                    disabled={updating}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === 'femme' && styles.genderOptionTextSelected
                    ]}>
                      Femme
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+213 555 0000"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  editable={!updating}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={[styles.input, { color: COLORS.gray400 }]}
                  value={formData.email}
                  editable={false}
                />
              </View>

              {/* ✅ Account Type Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Type de Compte</Text>
              </View>

              <View style={styles.accountTypeSection}>
                <TouchableOpacity
                  style={[
                    styles.accountTypeButton,
                    formData.account_type === 'buyer' && styles.accountTypeButtonActive,
                  ]}
                  onPress={() => handleInputChange('account_type', 'buyer')}
                  disabled={updating}
                >
                  <View style={styles.accountTypeContent}>
                    <Text style={styles.accountTypeIcon}>🛒</Text>
                    <View style={styles.accountTypeTextContainer}>
                      <Text
                        style={[
                          styles.accountTypeTitle,
                          formData.account_type === 'buyer' && styles.accountTypeTextActive,
                        ]}
                      >
                        Acheteur
                      </Text>
                      <Text
                        style={[
                          styles.accountTypeDescription,
                          formData.account_type === 'buyer' && styles.accountTypeDescriptionActive,
                        ]}
                      >
                        Je veux acheter
                      </Text>
                    </View>
                    {formData.account_type === 'buyer' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.accountTypeButton,
                    formData.account_type === 'seller' && styles.accountTypeButtonActive,
                  ]}
                  onPress={() => handleInputChange('account_type', 'seller')}
                  disabled={updating}
                >
                  <View style={styles.accountTypeContent}>
                    <Text style={styles.accountTypeIcon}>🚗</Text>
                    <View style={styles.accountTypeTextContainer}>
                      <Text
                        style={[
                          styles.accountTypeTitle,
                          formData.account_type === 'seller' && styles.accountTypeTextActive,
                        ]}
                      >
                        Vendeur
                      </Text>
                      <Text
                        style={[
                          styles.accountTypeDescription,
                          formData.account_type === 'seller' && styles.accountTypeDescriptionActive,
                        ]}
                      >
                        Je veux vendre
                      </Text>
                    </View>
                    {formData.account_type === 'seller' && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* ✅ Seller Information Section */}
              {formData.account_type === 'seller' && (
                <View style={styles.sellerSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Informations du Garage</Text>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Nom du Garage</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Mon Garage"
                      value={formData.garage_name}
                      onChangeText={(value) => handleInputChange('garage_name', value)}
                      editable={!updating}
                      placeholderTextColor={COLORS.gray400}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Numéro de SIRET</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12345678901234"
                      value={formData.siret}
                      onChangeText={(value) => handleInputChange('siret', value)}
                      editable={!updating}
                      placeholderTextColor={COLORS.gray400}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Adresse du Garage</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123 Rue de la Paix, Algiers"
                      value={formData.address}
                      onChangeText={(value) => handleInputChange('address', value)}
                      editable={!updating}
                      placeholderTextColor={COLORS.gray400}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={disconnectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisconnectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.disconnectModalContent}>
            <Text style={styles.disconnectTitle}>Déconnexion</Text>
            <Text style={styles.disconnectMessage}>
              Êtes-vous sûr de vouloir vous déconnecter?
            </Text>

            <View style={styles.disconnectButtonContainer}>
              <TouchableOpacity
                style={[styles.disconnectButton, styles.cancelDisconnectButton]}
                onPress={() => setDisconnectModalVisible(false)}
              >
                <Text style={styles.cancelDisconnectText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.disconnectButton, styles.confirmDisconnectButton]}
                onPress={confirmDisconnect}
              >
                <Text style={styles.confirmDisconnectText}>Déconnexion</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { backgroundColor: COLORS.darkTeal1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100, position: 'relative' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: COLORS.white },
  headerTitle: { fontSize: 24, fontWeight: '600', color: COLORS.white, paddingRight:145 },
  menuButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  menuDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.white, marginVertical: 2 },
  content: { flex: 1 },
  profileCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginTop: 10, borderRadius: 16, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  profileSection: { paddingTop: 60, paddingBottom: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  avatarContainer: { position: 'absolute', bottom: -50, alignSelf: 'center', zIndex: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.gray200, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.white, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40 },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primaryGreen, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white, zIndex: 11 },
  editAvatarIcon: { fontSize: 16 },
  userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  userEmail: { fontSize: 13, color: COLORS.gray500, marginBottom: 8 },
  menuSection: { paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.darkTeal1, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.gray700 },
  menuArrow: { fontSize: 20, color: COLORS.gray400 },
  signOutButton: { backgroundColor: COLORS.darkTeal1, marginTop: 12, marginHorizontal: 20, marginBottom: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e5e5' },
  signOutIconContainer: { width: 24, height: 24, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.lightGray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '85%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray700 },
  modalCloseButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray200, justifyContent: 'center', alignItems: 'center' },
  modalCloseIcon: { fontSize: 20, color: COLORS.gray500 },
  modalScrollView: { maxHeight: 500 },
  sectionHeader: { marginBottom: 20, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.darkTeal1, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray500, marginBottom: 8 },
  input: { backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.gray700, borderWidth: 1, borderColor: COLORS.gray300 },
  modalButtonContainer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: COLORS.gray200 },
  saveButton: { backgroundColor: COLORS.darkTeal1 },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.gray500 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  genderOptions: { flexDirection: 'row', gap: 12 },
  genderOption: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.gray300, alignItems: 'center' },
  genderOptionSelected: { borderColor: COLORS.darkTeal1, backgroundColor: COLORS.darkTeal3 + '30' },
  genderOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.gray500 },
  genderOptionTextSelected: { color: COLORS.darkTeal1 },
  accountTypeSection: { marginTop: 8, marginBottom: 24 },
  accountTypeButton: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  accountTypeButtonActive: { backgroundColor: COLORS.lightBlue, borderColor: COLORS.darkTeal1 },
  accountTypeContent: { flexDirection: 'row', alignItems: 'center' },
  accountTypeIcon: { fontSize: 32, marginRight: 16 },
  accountTypeTextContainer: { flex: 1 },
  accountTypeTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray700, marginBottom: 4 },
  accountTypeTextActive: { color: COLORS.darkTeal1 },
  accountTypeDescription: { fontSize: 14, color: COLORS.gray600 },
  accountTypeDescriptionActive: { color: COLORS.darkBlue },
  checkmark: { fontSize: 24, color: COLORS.darkTeal1, fontWeight: 'bold' },
  sellerSection: { backgroundColor: '#f0f9fc', borderRadius: 12, padding: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: COLORS.darkTeal1 },
  disconnectModalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '80%', alignItems: 'center' },
  disconnectTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray700, marginBottom: 8, textAlign: 'center' },
  disconnectMessage: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  disconnectButtonContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  disconnectButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelDisconnectButton: { backgroundColor: COLORS.gray200 },
  confirmDisconnectButton: { backgroundColor: COLORS.darkTeal1 },
  cancelDisconnectText: { fontSize: 14, fontWeight: '600', color: COLORS.gray500 },
  confirmDisconnectText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});