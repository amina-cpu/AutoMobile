import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
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
import { supabase } from '../src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  primaryGreen: '#41B975',
  darkGreen: '#268865',
  white: '#FFFFFF',
  lightGray: '#f5f5f5',
  gray100: '#f8fafc',
  gray200: '#f1f5f9',
  gray300: '#e2e8f0',
  gray400: '#cbd5e1',
  gray500: '#64748b',
  gray600: '#6b7280',
  gray700: '#1f2937',
  red: '#ef4444',
  lightRed: '#fee2e2',
};

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
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    console.log('🔗 [AuthScreen] Redirect URI:', redirectUri);
    console.log('📱 [AuthScreen] Platform:', Platform.OS);
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ [AuthScreen] Déjà connecté en tant que:', user.email);
      }
    } catch (error) {
      console.log('⚠️ [AuthScreen] Non connecté');
    }
  };

  const createUserProfile = async (userId, userEmail, userPhone = null) => {
    try {
      console.log('👤 [AuthScreen] Création du profil utilisateur pour:', userId);
      
      const profileData = {
        id: userId,
        email: userEmail,
        phone: userPhone || null,
        full_name: null,
        username: userEmail?.split('@')[0] || 'user',
        account_type: null,
        avatar_url: null
      };

      console.log('📤 [AuthScreen] Envoi des données du profil:', profileData);
      
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ [AuthScreen] Erreur Supabase lors de l\'insertion:', error);
        
        if (error.code === '23505') {
          console.log('✅ [AuthScreen] Le profil existe déjà (contrainte unique)');
          return { success: true, existed: true };
        }
        
        throw new Error(`Impossible de créer le profil: ${error.message}`);
      }

      console.log('✅ [AuthScreen] Profil utilisateur créé (incomplete):', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ [AuthScreen] Erreur de création du profil:', error);
      throw error;
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📝 [AuthScreen] Démarrage de l\'inscription avec email...');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUri,
        },
      });

      if (signUpError) {
        console.error('❌ [AuthScreen] Erreur d\'inscription:', signUpError);
        
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('User already registered')) {
          setError('Ce compte existe déjà. Essayez de vous connecter.');
          setLoading(false);
          return;
        }
        
        throw signUpError;
      }

      console.log('✅ [AuthScreen] Utilisateur créé:', authData.user?.id);

      if (authData.user) {
        try {
          await createUserProfile(
            authData.user.id, 
            email, 
            phone
          );
          
          console.log('🎉 [AuthScreen] Signup complete');
          
          if (authData.session) {
            console.log('✅ [AuthScreen] Logged in immediately');
          } else {
            console.log('📧 [AuthScreen] Email confirmation required');
            setEmailSent(true);
          }
          
          setError(null);
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setPhone('');
        } catch (profileError) {
          console.error('❌ [AuthScreen] Création du profil échouée:', profileError);
          setError('Erreur lors de la création du profil');
        }
      }
    } catch (err) {
      console.error('❌ [AuthScreen] Erreur d\'inscription:', err);
      setError(err.message || 'Impossible de s\'inscrire');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔑 [AuthScreen] Connexion...');

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ [AuthScreen] Erreur de connexion:', signInError);
        
        if (signInError.message?.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError(signInError.message || 'Impossible de se connecter');
        }
        setLoading(false);
        return;
      }

      console.log('✅ [AuthScreen] Connecté:', data.user.id);
      console.log('🎉 [AuthScreen] Login complete');
      
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ [AuthScreen] Erreur de connexion:', err);
      setError(err.message || 'Impossible de se connecter');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 [AuthScreen] Starting Google sign-in...');
      console.log('🔗 [AuthScreen] Using redirect URI:', redirectUri);

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
        console.error('❌ [AuthScreen] OAuth error:', error);
        setError(`OAuth Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.url) {
        console.error('❌ [AuthScreen] No OAuth URL returned');
        setError('Google OAuth not configured. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('🌐 [AuthScreen] OAuth URL received');
      console.log('🌐 [AuthScreen] Opening browser...');
      
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true }
      );

      console.log('🔙 [AuthScreen] Browser result type:', result.type);

      if (result.type === 'success') {
        console.log('✅ [AuthScreen] OAuth callback received');
        
        const { url } = result;
        const urlParts = url.split('#')[1] || url.split('?')[1];

        if (!urlParts) {
          console.error('❌ [AuthScreen] No URL params in return URL');
          setError('OAuth callback missing parameters');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams(urlParts);
        console.log('📋 [AuthScreen] Available params:', Array.from(params.keys()));
        
        const code = params.get('code');
        const error_description = params.get('error_description');
        const error_code = params.get('error');

        if (error_description || error_code) {
          console.error('❌ [AuthScreen] OAuth error:', error_description || error_code);
          setError(`Authentication failed: ${error_description || error_code}`);
          setLoading(false);
          return;
        }

        if (code) {
          console.log('🔐 [AuthScreen] Got authorization code, exchanging for session...');
          
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ [AuthScreen] Code exchange error:', sessionError);
            setError(`Failed to complete sign-in: ${sessionError.message}`);
            setLoading(false);
            return;
          }

          if (!sessionData?.session) {
            console.error('❌ [AuthScreen] No session returned from code exchange');
            setError('Failed to create session');
            setLoading(false);
            return;
          }

          console.log('✅ [AuthScreen] Session created successfully');
          const newUser = sessionData.session.user;
          console.log('✅ [AuthScreen] User authenticated:', newUser.email);

          try {
            const { data: existingProfile, error: checkError } = await supabase
              .from('users')
              .select('*')
              .eq('id', newUser.id)
              .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
              console.error('❌ [AuthScreen] Profile check error:', checkError);
            }

            if (existingProfile) {
              console.log('✅ [AuthScreen] Existing profile found - LOGIN complete');
            } else {
              console.log('📝 [AuthScreen] New user - creating profile...');
              await createUserProfile(newUser.id, newUser.email, null);
              console.log('✅ [AuthScreen] Profile created - SIGNUP complete');
            }
          } catch (profileErr) {
            console.error('❌ [AuthScreen] Profile error:', profileErr);
            try {
              await createUserProfile(newUser.id, newUser.email, null);
            } catch (createErr) {
              console.error('❌ [AuthScreen] Failed to create profile:', createErr);
            }
          }

          console.log('🎉 [AuthScreen] Google authentication complete!');
          
        } else {
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('🔐 [AuthScreen] Got tokens directly, setting session...');
            
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error('❌ [AuthScreen] Session error:', sessionError);
              setError(`Session Error: ${sessionError.message}`);
              setLoading(false);
              return;
            }

            console.log('✅ [AuthScreen] Session set successfully');

            const { data: { user: newUser }, error: userError } = await supabase.auth.getUser();

            if (userError || !newUser) {
              console.error('❌ [AuthScreen] User fetch error:', userError);
              setError('Failed to get user information');
              setLoading(false);
              return;
            }

            console.log('✅ [AuthScreen] User authenticated:', newUser.email);

            try {
              const { data: existingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', newUser.id)
                .maybeSingle();

              if (existingProfile) {
                console.log('✅ [AuthScreen] Existing profile - LOGIN');
              } else {
                console.log('📝 [AuthScreen] Creating profile...');
                await createUserProfile(newUser.id, newUser.email, null);
              }
            } catch (err) {
              console.error('❌ [AuthScreen] Profile error:', err);
            }

            console.log('🎉 [AuthScreen] Authentication complete!');
          } else {
            console.error('❌ [AuthScreen] No code or tokens in callback');
            setError('Authentication failed - no credentials received');
          }
        }
        
      } else if (result.type === 'cancel') {
        console.log('⚠️ [AuthScreen] User cancelled sign-in');
        setError('Google sign-in was cancelled');
      } else if (result.type === 'dismiss') {
        console.log('⚠️ [AuthScreen] Browser dismissed');
        setError('Sign-in window was closed');
      } else {
        console.log('⚠️ [AuthScreen] Unknown result type:', result.type);
        setError('An unexpected error occurred');
      }
    } catch (err) {
      console.error('❌ [AuthScreen] Exception:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Email envoyé!</Text>
              <Text style={styles.subtitle}>Vérifiez votre boîte de réception</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>📧</Text>
              <Text style={styles.successTitle}>Confirmez votre email</Text>
              <Text style={styles.successMessage}>
                Un email de confirmation a été envoyé à {'\n'}
                <Text style={{ fontWeight: 'bold', color: COLORS.darkTeal1 }}>{email}</Text>
                {'\n\n'}
                Cliquez sur le lien dans l'email pour activer votre compte.
              </Text>
              
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => {
                  setEmailSent(false);
                  setIsSignUp(false);
                  setError(null);
                }}
              >
                <Text style={styles.backToLoginButtonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.subtitle}>Bienvenue sur Vcar</Text>
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
                <Text style={styles.backButtonText}>← Retour à la connexion</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.formTitle}>{isSignUp ? 'Inscription' : 'Connexion'}</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.gray400}
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
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.gray400}
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
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={COLORS.gray400}
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
                    placeholder="Téléphone (optionnel)"
                    placeholderTextColor={COLORS.gray400}
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
                <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mainButton, loading && styles.mainButtonDisabled]}
              onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isSignUp ? 'S\'inscrire' : 'Se connecter'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton} 
                disabled={true}
              >
                <Text style={styles.socialIcon}>f</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.darkTeal1} size="small" />
                ) : (
                  <Text style={styles.googleIcon}>G</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Vous avez déjà un compte?' : 'Pas de compte?'}
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
                  {isSignUp ? 'Se connecter' : 'S\'inscrire'}
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
  container: { flex: 1, backgroundColor: COLORS.darkTeal1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { height: height * 0.35, backgroundColor: COLORS.darkTeal1, justifyContent: 'center', paddingHorizontal: 30, paddingTop: 40 },
  headerContent: { marginTop: 20 },
  greeting: { fontSize: 48, fontWeight: 'bold', color: COLORS.white, marginBottom: 8 },
  subtitle: { fontSize: 18, color: COLORS.white, opacity: 0.9 },
  formCard: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30, marginTop: -20 },
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 14, color: COLORS.darkTeal1, fontWeight: '600' },
  formTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.darkTeal1, marginBottom: 30 },
  errorContainer: { backgroundColor: COLORS.lightRed, borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 14, fontWeight: '600' },
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successIcon: { fontSize: 80, marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkTeal1, marginBottom: 16, textAlign: 'center' },
  successMessage: { fontSize: 16, color: COLORS.gray600, textAlign: 'center', marginBottom: 32, lineHeight: 24, paddingHorizontal: 20 },
  backToLoginButton: { backgroundColor: COLORS.darkTeal1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  backToLoginButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.gray700 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotPasswordText: { fontSize: 14, color: COLORS.darkTeal1, fontWeight: '600' },
  mainButton: { backgroundColor: COLORS.darkTeal1, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: COLORS.darkTeal2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainButtonDisabled: { opacity: 0.6 },
  mainButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray300 },
  dividerText: { fontSize: 14, color: COLORS.gray500, marginHorizontal: 16 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  socialButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray300 },
  googleButton: { backgroundColor: COLORS.white, borderColor: COLORS.darkTeal1, borderWidth: 2 },
  socialIcon: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkTeal1 },
  googleIcon: { fontSize: 26, fontWeight: 'bold', color: COLORS.darkTeal1 },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  switchText: { fontSize: 14, color: COLORS.gray600 },
  switchLink: { fontSize: 14, color: COLORS.darkTeal1, fontWeight: 'bold' },
});