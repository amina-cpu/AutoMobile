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
        console.log('Already logged in as:', user.email);
      }
    } catch (error) {
      console.log('Not logged in');
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

    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      Alert.alert('Success', 'Account created! Check your email to confirm.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setIsSignUp(false);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
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

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      Alert.alert('Success', 'Logged in!');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
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
          {/* Header Section with Gradient Background */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Bonjour!</Text>
              <Text style={styles.subtitle}>Bienvenue sur Automobile</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Back to Login/Sign Up Link */}
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

            {/* Title */}
            <Text style={styles.formTitle}>{isSignUp ? 'Sign Up' : 'Login'}</Text>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}></Text>
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

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}></Text>
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

            {/* Sign Up Additional Fields */}
            {isSignUp && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}></Text>
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
                  <Text style={styles.inputIcon}></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    placeholderTextColor="#b0b0b0"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            {/* Forgot Password (Login only) */}
            {!isSignUp && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Login/Sign Up Button */}
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

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                disabled={loading}
              >
                <Text style={styles.socialIcon}>f</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Text style={styles.socialIcon}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                disabled={loading}
              >
                <Text style={styles.socialIcon}>🍎</Text>
              </TouchableOpacity>
            </View>

            {/* Switch to Sign Up/Login */}
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
  container: {
    flex: 1,
    backgroundColor: '#1a7f8e',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: height * 0.35,
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
    fontSize: 18,
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
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 14,
    color:'#1085a8ff',
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1085a8ff',
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1085a8ff',
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: '#1085a8ff',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1a7f8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonDisabled: {
    opacity: 0.6,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  socialIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a7f8e',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  switchText: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchLink: {
    fontSize: 14,
    color: '#1085a8ff',
    fontWeight: 'bold',
  },
});