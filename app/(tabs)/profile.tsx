import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../src/config/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#1085a8ff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
    position: 'relative',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginVertical: 2,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileSection: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    alignSelf: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1085a8ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 11,
  },
  editAvatarIcon: {
    fontSize: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1085a8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuArrow: {
    fontSize: 20,
    color: '#cbd5e1',
  },
  signOutButton: {
    backgroundColor: '#1085a8ff',
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  signOutIconContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
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
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    fontSize: 20,
    color: '#64748b',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  pickerPlaceholder: {
    color: '#94a3b8',
  },
  pickerArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#1085a8ff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#1085a8ff',
    backgroundColor: '#e0f2fe',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  genderOptionTextSelected: {
    color: '#1085a8ff',
  },
});

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    gender: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          username: profileData.username || user.email?.split('@')[0] || '',
          gender: profileData.gender || '',
          phone: profileData.phone || '',
          email: user.email || '',
        });
      } else {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            account_type: 'buyer',
            username: user.email?.split('@')[0] || '',
          }])
          .select()
          .single();

        if (!createError) {
          setProfile(newProfile);
          setFormData({
            full_name: '',
            username: user.email?.split('@')[0] || '',
            gender: '',
            phone: '',
            email: user.email || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (imageUri) => {
    try {
      setUpdating(true);

      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert('Success', 'Avatar updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUpdating(true);

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          gender: formData.gender,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...formData }));
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1085a8ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Blue Background */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile</Text>
          
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity>
        </View>
        
        {/* Avatar positioned on top of header */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}></Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={pickAvatar}
            disabled={updating}
          >
            <Text style={styles.editAvatarIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card - Contains Info and Menu Items */}
        <View style={styles.profileCard}>
          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            <Text style={styles.userName}>
              {profile?.full_name || profile?.username || 'USER'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>

          {/* Menu Section - Inside Same Card */}
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setEditModalVisible(true)}
            >
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20}}>
                  <View style={{position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderWidth: 2, borderColor: '#fff', borderRadius: 2}} />
                  <View style={{position: 'absolute', top: 0, right: 0, width: 8, height: 8, backgroundColor: '#fff', transform: [{rotate: '45deg'}]}} />
                </View>
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20}}>
                  <View style={{width: 14, height: 12, borderWidth: 2, borderColor: '#fff', borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomWidth: 0, alignSelf: 'center'}} />
                  <View style={{width: 18, height: 4, backgroundColor: '#fff', borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: -1, alignSelf: 'center'}} />
                  <View style={{position: 'absolute', top: -2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444'}} />
                </View>
              </View>
              <Text style={styles.menuText}>Notification</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
                  <View style={{width: 14, height: 18, borderWidth: 2, borderColor: '#fff', borderRadius: 3}} />
                  <View style={{position: 'absolute', bottom: 3, width: 6, height: 8, backgroundColor: '#fff', borderRadius: 3}} />
                </View>
              </View>
              <Text style={styles.menuText}>Shipping Address</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
                  <View style={{width: 12, height: 14, backgroundColor: '#fff', borderRadius: 3, marginTop: 2}} />
                  <View style={{position: 'absolute', top: 0, width: 6, height: 8, backgroundColor: '#fff', borderTopLeftRadius: 3, borderTopRightRadius: 3}} />
                  <View style={{position: 'absolute', bottom: 6, width: 3, height: 3, backgroundColor: '#1085a8ff', borderRadius: 1.5}} />
                </View>
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <View style={styles.signOutIconContainer}>
            <View style={{width: 18, height: 18}}>
              <View style={{position: 'absolute', left: 0, top: 3, width: 10, height: 12, borderWidth: 2, borderColor: '#FFF', borderRightWidth: 0, borderTopLeftRadius: 3, borderBottomLeftRadius: 3}} />
              <View style={{position: 'absolute', right: 0, top: 7, width: 8, height: 2, backgroundColor: '#FFF'}} />
              <View style={{position: 'absolute', right: 0, top: 4, width: 5, height: 5, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#FFFF', transform: [{rotate: '45deg'}]}} />
            </View>
          </View>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
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
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Albert Florest"
                  value={formData.full_name}
                  onChangeText={(value) => handleInputChange('full_name', value)}
                  editable={!updating}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="albertflorest"
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  editable={!updating}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'Male' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('gender', 'Male')}
                    disabled={updating}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === 'Male' && styles.genderOptionTextSelected
                    ]}>
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      formData.gender === 'Female' && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('gender', 'Female')}
                    disabled={updating}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === 'Female' && styles.genderOptionTextSelected
                    ]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+213 555 0000"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  editable={!updating}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={formData.email}
                  editable={false}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}