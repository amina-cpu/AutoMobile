import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../src/config/supabase';

const { height } = Dimensions.get('window');

const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

export default function CompleteProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState(null);

  const handleCompleteProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!accountType) {
      Alert.alert('Error', 'Please select an account type');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 [CompleteProfile] Starting profile update...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Auth error:', userError);
        setLoading(false);
        Alert.alert('Error', 'User not found');
        return;
      }

      console.log('💾 [CompleteProfile] Updating user:', user.id);

      // Get session for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      // Try with Bearer token first
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            account_type: accountType,
            updated_at: new Date().toISOString(),
          })
        }
      );

      console.log('📤 [CompleteProfile] Response status:', response.status);
      const responseText = await response.text();
      console.log('📤 [CompleteProfile] Response body:', responseText);

      if (!response.ok) {
        setLoading(false);
        Alert.alert('Error', `Failed to update profile: ${response.status}`);
        return;
      }

      console.log('✅ Profile updated successfully');
      setLoading(false);
      
      console.log('🎉 Navigating to home');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('❌ Error:', err);
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to update profile');
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
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.subtitle}>Complete your profile to continue</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Your Information</Text>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
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
                placeholder="Phone Number (Optional)"
                placeholderTextColor="#b0b0b0"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                keyboardType="phone-pad"
              />
            </View>

            {/* Account Type Selection */}
            <View style={styles.accountTypeSection}>
              <Text style={styles.accountTypeLabel}>I am a:</Text>

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
                      Buyer
                    </Text>
                    <Text
                      style={[
                        styles.accountTypeDescription,
                        accountType === 'buyer' && styles.accountTypeDescriptionActive,
                      ]}
                    >
                      I want to buy a car
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
                      Seller
                    </Text>
                    <Text
                      style={[
                        styles.accountTypeDescription,
                        accountType === 'seller' && styles.accountTypeDescriptionActive,
                      ]}
                    >
                      I want to sell my car
                    </Text>
                  </View>
                  {accountType === 'seller' && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.continueButtonDisabled]}
              onPress={handleCompleteProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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