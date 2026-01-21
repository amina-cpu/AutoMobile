import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
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

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'automobile',
  path: 'auth/callback',
});

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Already logged in as:', user.email);
      }
    } catch (error) {
      console.log('⚠️ Not logged in');
    }
  };

  const createUserProfile = async (userId, userEmail, userPhone = null, accessToken = null) => {
    try {
      console.log('👤 Creating user profile for:', userId);
      
      const profileData = {
        id: userId,
        email: userEmail,
        phone: userPhone || null,
        full_name: null,
        username: userEmail?.split('@')[0] || 'user',
        account_type: 'buyer',
        avatar_url: null
      };

      console.log('📤 Sending profile data:', profileData);
      
      // Build headers with authentication if available
      const headers = {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // Add auth token if available
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/users`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(profileData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Profile creation failed:', response.status, errorText);
        
        // If user already exists (409), that's fine
        if (response.status === 409) {
          console.log('✅ Profile already exists');
          return { success: true, existed: true };
        }
        
        throw new Error(`Failed to create profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User profile created:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📝 Starting sign up process...');

      // Step 1: Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('❌ Auth signup error:', signUpError);
        throw signUpError;
      }

      console.log('✅ Auth user created:', authData.user?.id);

      // Step 2: Get session immediately after signup
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('⚠️ No session after signup - profile creation may fail');
      }

      // Step 3: Create database profile
      if (authData.user) {
        try {
          await createUserProfile(
            authData.user.id, 
            email, 
            phone,
            session?.access_token
          );
        } catch (profileError) {
          console.error('❌ Profile creation failed:', profileError);
          // Don't fail the signup - user can still sign in
          Alert.alert(
            'Account Created',
            'Your account was created but there was an issue setting up your profile. Please try signing in.',
            [{ text: 'OK' }]
          );
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setPhone('');
          setIsSignUp(false);
          setLoading(false);
          return;
        }
      }

      Alert.alert(
        'Success', 
        'Account created! You can now sign in.',
        [{ text: 'OK' }]
      );
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setIsSignUp(false);
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'Failed to sign up');
      Alert.alert('Error', err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔑 Signing in...');

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        throw signInError;
      }

      console.log('✅ Signed in:', data.user.id);

      // Get session for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No session after sign in');
      }

      // Check if profile exists
      if (data.user) {
        try {
          console.log('🔍 Checking if profile exists...');
          
          const checkResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/users?id=eq.${data.user.id}`,
            {
              headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const userData = await checkResponse.json();

          if (!Array.isArray(userData) || userData.length === 0) {
            console.log('⚠️ Profile not found, creating...');
            await createUserProfile(
              data.user.id, 
              data.user.email,
              null,
              session.access_token
            );
          } else {
            console.log('✅ Profile exists');
          }
        } catch (err) {
          console.error('❌ Error checking/creating profile:', err);
          // Try to create profile anyway
          try {
            await createUserProfile(
              data.user.id, 
              data.user.email,
              null,
              session.access_token
            );
          } catch (createErr) {
            console.error('❌ Failed to create profile:', createErr);
          }
        }
      }

      Alert.alert('Success', 'Logged in!');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      Alert.alert('Error', err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 Starting Google sign-in...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('❌ OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
          { showInRecents: true }
        );

        if (result.type === 'success') {
          const { url } = result;
          const urlParts = url.split('#')[1] || url.split('?')[1];

          if (!urlParts) {
            throw new Error('No authentication data received');
          }

          const params = new URLSearchParams(urlParts);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error('❌ Session error:', sessionError);
              throw sessionError;
            }

            const { data: { user: newUser } } = await supabase.auth.getUser();

            if (newUser) {
              console.log('✅ Google user authenticated:', newUser.id);
              
              // Check if profile exists
              try {
                const checkResponse = await fetch(
                  `${SUPABASE_URL}/rest/v1/users?id=eq.${newUser.id}`,
                  {
                    headers: {
                      'apikey': API_KEY,
                      'Authorization': `Bearer ${access_token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                const userData = await checkResponse.json();

                if (!Array.isArray(userData) || userData.length === 0) {
                  console.log('📝 Creating profile for Google user...');
                  await createUserProfile(
                    newUser.id, 
                    newUser.email,
                    null,
                    access_token
                  );
                } else {
                  console.log('✅ Google user profile already exists');
                }
              } catch (err) {
                console.error('❌ Error checking profile:', err);
                // Try to create anyway
                try {
                  await createUserProfile(
                    newUser.id, 
                    newUser.email,
                    null,
                    access_token
                  );
                } catch (createErr) {
                  console.error('❌ Failed to create profile:', createErr);
                }
              }

              Alert.alert('Success', 'Logged in with Google!');
            }
          } else {
            throw new Error('Authentication tokens not found');
          }
        } else if (result.type === 'cancel') {
          setError('Google sign-in was cancelled');
        }
      }
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      Alert.alert('Error', err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
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
              <Text style={styles.subtitle}>Bienvenue sur Automobile</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {isSignUp && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setIsSignUp(false);
                  setError(null);
                  setConfirmPassword('');
                  setPhone('');
                }}
              >
                <Text style={styles.backButtonText}>← Back to login</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.formTitle}>{isSignUp ? 'Sign Up' : 'Login'}</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#b0b0b0"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#b0b0b0"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#b0b0b0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📱</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone (optional)"
                    placeholderTextColor="#b0b0b0"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mainButton, loading && styles.mainButtonDisabled]}
              onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isSignUp ? 'Sign up' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} disabled={loading}>
                <Text style={styles.socialIcon}>f</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1a7f8e" size="small" />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account?' : "Don't have account?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setConfirmPassword('');
                  setPhone('');
                }}
              >
                <Text style={styles.switchLink}>
                  {isSignUp ? 'Login' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a7f8e' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { height: height * 0.35, backgroundColor: '#1085a8ff', justifyContent: 'center', paddingHorizontal: 30, paddingTop: 40 },
  headerContent: { marginTop: 20 },
  greeting: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#ffffff', opacity: 0.9 },
  formCard: { flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30, marginTop: -20 },
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 14, color: '#1085a8ff', fontWeight: '600' },
  formTitle: { fontSize: 32, fontWeight: 'bold', color: '#1085a8ff', marginBottom: 30 },
  errorContainer: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1f2937' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotPasswordText: { fontSize: 14, color: '#1085a8ff', fontWeight: '600' },
  mainButton: { backgroundColor: '#1085a8ff', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#1a7f8e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  dividerText: { fontSize: 14, color: '#9ca3af', marginHorizontal: 16 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e5e5' },
  googleButton: { backgroundColor: '#fff', borderColor: '#1085a8ff', borderWidth: 2 },
  socialIcon: { fontSize: 24, fontWeight: 'bold', color: '#1a7f8e' },
  googleIcon: { fontSize: 26, fontWeight: 'bold', color: '#1085a8ff' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  switchText: { fontSize: 14, color: '#6b7280' },
  switchLink: { fontSize: 14, color: '#1085a8ff', fontWeight: 'bold' },
});