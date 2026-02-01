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

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  primaryGreen: '#41B975',
  white: '#FFFFFF',
  lightGray: '#f5f5f5',
  gray100: '#f8fafc',
  gray200: '#f1f5f9',
  gray300: '#e2e8f0',
  gray400: '#cbd5e1',
  gray600: '#6b7280',
  gray700: '#1f2937',
  lightBlue: '#e0f2f7',
  darkBlue: '#0d6978',
};

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

      const updateData = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        account_type: accountType,
        updated_at: new Date().toISOString(),
      };

      if (accountType === 'seller') {
        updateData.siret = siretNumber.trim();
        updateData.address = address.trim();
        updateData.garage_name = garageName.trim();
      }

      if (email.trim()) {
        updateData.email = email.trim();
      }

      console.log('📝 [CompleteProfile] Update data:', updateData);

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
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Bonjour!</Text>
              <Text style={styles.subtitle}>Complétez votre profil pour continuer</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vos Informations</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom Prénom"
                placeholderTextColor={COLORS.gray400}
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de Téléphone (Optionnel)"
                placeholderTextColor={COLORS.gray400}
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse Email (Optionnel)"
                placeholderTextColor={COLORS.gray400}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

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

            {accountType === 'seller' && (
              <View style={styles.sellerSection}>
                <Text style={styles.sellerSectionTitle}>Informations du Garage</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🏢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du Garage"
                    placeholderTextColor={COLORS.gray400}
                    value={garageName}
                    onChangeText={setGarageName}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔢</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Numéro de SIRET"
                    placeholderTextColor={COLORS.gray400}
                    value={siretNumber}
                    onChangeText={setSiretNumber}
                    editable={!loading}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📍</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse du Garage"
                    placeholderTextColor={COLORS.gray400}
                    value={address}
                    onChangeText={setAddress}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleCompleteProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
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
  container: { flex: 1, backgroundColor: COLORS.darkTeal1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { height: height * 0.3, backgroundColor: COLORS.darkTeal1, justifyContent: 'center', paddingHorizontal: 30, paddingTop: 40 },
  headerContent: { marginTop: 20 },
  greeting: { fontSize: 48, fontWeight: 'bold', color: COLORS.white, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.white, opacity: 0.9 },
  formCard: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30, marginTop: -20 },
  formTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.darkTeal1, marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.gray700 },
  accountTypeSection: { marginTop: 8, marginBottom: 24 },
  accountTypeLabel: { fontSize: 16, fontWeight: '600', color: COLORS.gray700, marginBottom: 16 },
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
  sellerSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.darkTeal1, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  continueButton: { backgroundColor: COLORS.darkTeal1, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: COLORS.darkTeal2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
});