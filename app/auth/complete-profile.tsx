import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useAlert } from '../hooks/useAlert';
import { supabase } from '../src/config/supabase';

const { height } = Dimensions.get('window');

export default function CompleteProfileScreen({ onComplete }) {
  const { alertConfig, showSuccess, showError, dismiss } = useAlert();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [siretNumber, setSiretNumber] = useState('');
  const [garageName, setGarageName] = useState('');
  const [accountType, setAccountType] = useState(null);

  const handleCompleteProfile = async () => {
    if (!fullName.trim()) {
      showError('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (!accountType) {
      showError('Erreur', 'Veuillez sélectionner un type de compte');
      return;
    }

    // If seller, require garage info
    if (accountType === 'seller') {
      if (!siretNumber.trim()) {
        showError('Erreur', 'Numéro de SIRET requis pour les vendeurs');
        return;
      }
      if (!garageName.trim()) {
        showError('Erreur', 'Nom du garage requis pour les vendeurs');
        return;
      }
      if (!address.trim()) {
        showError('Erreur', 'Adresse requise pour les vendeurs');
        return;
      }
    }

    try {
      setLoading(true);
      console.log('💾 [CompleteProfile] Starting profile update...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ [CompleteProfile] Auth error:', userError);
        setLoading(false);
        showError('Erreur', 'Utilisateur non trouvé');
        return;
      }

      console.log('💾 [CompleteProfile] Updating user:', user.id);

      // Build update object based on account type
      const updateData = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        account_type: accountType,
        updated_at: new Date().toISOString(),
      };

      // Add seller-specific fields
      if (accountType === 'seller') {
        updateData.siret = siretNumber.trim();
        updateData.address = address.trim();
        updateData.garage_name = garageName.trim();
      }

      // Add email if provided
      if (email.trim()) {
        updateData.email = email.trim();
      }

      console.log('📝 [CompleteProfile] Update data:', updateData);

      // Update the profile using Supabase client
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ [CompleteProfile] Profile update error:', error);
        setLoading(false);
        showError('Erreur', `Impossible de mettre à jour le profil: ${error.message}`);
        return;
      }

      console.log('✅ [CompleteProfile] Profile updated successfully:', data);
      
      showSuccess('Profil complété', 'Votre profil a été créé avec succès!');
      
      // Call the onComplete callback to trigger re-check in RootLayout
      if (onComplete) {
        console.log('🔄 [CompleteProfile] Calling onComplete callback');
        await onComplete();
      }
      
      setLoading(false);
      console.log('🎉 [CompleteProfile] Profile completion flow finished');
    } catch (err) {
      console.error('❌ [CompleteProfile] Error:', err);
      setLoading(false);
      showError('Erreur', err.message || 'Impossible de mettre à jour le profil');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Bonjour!</Text>
              <Text style={styles.subtitle}>Complétez votre profil pour continuer</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vos Informations</Text>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom Prénom"
                placeholderTextColor="#b0b0b0"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de Téléphone (Optionnel)"
                placeholderTextColor="#b0b0b0"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse Email (Optionnel)"
                placeholderTextColor="#b0b0b0"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Account Type Selection */}
            <View style={styles.accountTypeSection}>
              <Text style={styles.accountTypeLabel}>Je suis:</Text>

              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'buyer' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('buyer')}
                disabled={loading}
              >
                <View style={styles.accountTypeContent}>
                  <Text style={styles.accountTypeIcon}>🛒</Text>
                  <View style={styles.accountTypeTextContainer}>
                    <Text
                      style={[
                        styles.accountTypeTitle,
                        accountType === 'buyer' && styles.accountTypeTextActive,
                      ]}
                    >
                      Acheteur
                    </Text>
                    <Text
                      style={[
                        styles.accountTypeDescription,
                        accountType === 'buyer' && styles.accountTypeDescriptionActive,
                      ]}
                    >
                      Je veux acheter une voiture
                    </Text>
                  </View>
                  {accountType === 'buyer' && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'seller' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('seller')}
                disabled={loading}
              >
                <View style={styles.accountTypeContent}>
                  <Text style={styles.accountTypeIcon}>🚗</Text>
                  <View style={styles.accountTypeTextContainer}>
                    <Text
                      style={[
                        styles.accountTypeTitle,
                        accountType === 'seller' && styles.accountTypeTextActive,
                      ]}
                    >
                      Vendeur
                    </Text>
                    <Text
                      style={[
                        styles.accountTypeDescription,
                        accountType === 'seller' && styles.accountTypeDescriptionActive,
                      ]}
                    >
                      Je veux vendre ma voiture
                    </Text>
                  </View>
                  {accountType === 'seller' && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Seller-Specific Fields */}
            {accountType === 'seller' && (
              <View style={styles.sellerSection}>
                <Text style={styles.sellerSectionTitle}>Informations du Garage</Text>

                {/* Garage Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🏢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du Garage"
                    placeholderTextColor="#b0b0b0"
                    value={garageName}
                    onChangeText={setGarageName}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>

                {/* SIRET Number Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Numéro de SIRET"
                    placeholderTextColor="#b0b0b0"
                    value={siretNumber}
                    onChangeText={setSiretNumber}
                    editable={!loading}
                    keyboardType="numeric"
                  />
                </View>

                {/* Address Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📍</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse du Garage"
                    placeholderTextColor="#b0b0b0"
                    value={address}
                    onChangeText={setAddress}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleCompleteProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continuer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onDismiss={dismiss}
        duration={alertConfig.duration}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1085a8ff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: height * 0.3,
    backgroundColor: '#1085a8ff',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  headerContent: {
    marginTop: 20,
  },
  greeting: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    marginTop: -20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1085a8ff',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  accountTypeSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  accountTypeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountTypeButtonActive: {
    backgroundColor: '#e0f2f7',
    borderColor: '#1085a8ff',
  },
  accountTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  accountTypeTextContainer: {
    flex: 1,
  },
  accountTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  accountTypeTextActive: {
    color: '#1085a8ff',
  },
  accountTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  accountTypeDescriptionActive: {
    color: '#0d6978',
  },
  checkmark: {
    fontSize: 24,
    color: '#1085a8ff',
    fontWeight: 'bold',
  },
  sellerSection: {
    backgroundColor: '#f0f9fc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1085a8ff',
  },
  sellerSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1085a8ff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueButton: {
    backgroundColor: '#1085a8ff',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1a7f8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});