import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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
  scheme: 'vcar',
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
  
  // Focus states for inputs
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Custom Alert States
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

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

      console.log('📤 [AuthScreen] Envoi des données du profil');
      
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .maybeSingle();

      if (error) {
        // ✅ HANDLE DUPLICATE EMAIL (23505 constraint violation) - NO ERROR LOG
        if (error.code === '23505') {
          console.log('⚠️ [AuthScreen] Le compte existe déjà (contrainte unique)');
          
          setLoading(false);
          showCustomAlert(
            'Compte Existant',
            `Veuillez vous connecter avec vos identifiants.`,
            () => {
              console.log('✅ Redirection vers la page de connexion');
              setIsSignUp(false);
              setError(null);
              setPassword('');
              setConfirmPassword('');
              setPhone('');
            },
            () => {
              console.log('❌ Utilisateur a annulé');
              setError(null);
            }
          );
          
          return { success: false, duplicate: true };
        }
        
        // Only log other errors
        console.error('❌ [AuthScreen] Erreur Supabase lors de l\'insertion:', error);
        throw new Error(`Impossible de créer le profil: ${error.message}`);
      }

      console.log('✅ [AuthScreen] Profil utilisateur créé');
      return { success: true, data };
    } catch (error) {
      console.error('❌ [AuthScreen] Erreur de création du profil:', error);
      throw error;
    }
  };

  // Custom Alert Function
  const showCustomAlert = (title, message, onConfirm, onCancel) => {
    setCustomAlertConfig({
      title,
      message,
      onConfirm,
      onCancel,
    });
    setCustomAlertVisible(true);
  };

  // Custom Alert Modal Component
  const CustomAlertModal = () => (
    <Modal
      visible={customAlertVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCustomAlertVisible(false)}
    >
      <View style={styles.customAlertOverlay}>
        <View style={styles.customAlertBox}>
          <Text style={styles.customAlertTitle}>{customAlertConfig.title}</Text>
          <Text style={styles.customAlertMessage}>{customAlertConfig.message}</Text>
          
          <View style={styles.customAlertButtonContainer}>
            <TouchableOpacity
              style={[styles.customAlertButton, styles.customAlertCancelButton]}
              onPress={() => {
                setCustomAlertVisible(false);
                customAlertConfig.onCancel?.();
              }}
            >
              <Text style={styles.customAlertCancelText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.customAlertButton, styles.customAlertConfirmButton]}
              onPress={() => {
                setCustomAlertVisible(false);
                customAlertConfig.onConfirm?.();
              }}
            >
              <Text style={styles.customAlertConfirmText}>Aller à la Connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        
        // Handle existing auth account
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('User already registered') ||
            signUpError.message?.includes('email_exists')) {
          console.log('⚠️ [AuthScreen] Compte d\'authentification déjà existant');
          setLoading(false);
          
          showCustomAlert(
            'Compte Existant',
            `Un compte avec cet email existe déjà.\n\nVeuillez vous connecter.`,
            () => {
              setIsSignUp(false);
              setError(null);
              setPassword('');
              setConfirmPassword('');
              setPhone('');
            },
            () => {
              setError(null);
            }
          );
          return;
        }
        
        // Show user-friendly error
        setError('Impossible de s\'inscrire. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      console.log('✅ [AuthScreen] Utilisateur créé:', authData.user?.id);

      if (authData.user) {
        try {
          const profileResult = await createUserProfile(
            authData.user.id, 
            email, 
            phone
          );

          // ✅ CHECK IF PROFILE CREATION SHOWED ALERT
          if (profileResult && profileResult.duplicate === true) {
            // Alert was already shown, don't continue
            return;
          }
          
          console.log('🎉 [AuthScreen] Inscription complète');
          
          if (authData.session) {
            console.log('✅ [AuthScreen] Connecté immédiatement');
          } else {
            console.log('📧 [AuthScreen] Confirmation d\'email requise');
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
      setError('Une erreur est survenue');
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
          setError('Impossible de se connecter');
        }
        setLoading(false);
        return;
      }

      console.log('✅ [AuthScreen] Connecté:', data.user.id);
      console.log('🎉 [AuthScreen] Connexion complète');
      
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ [AuthScreen] Erreur de connexion:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 [AuthScreen] Démarrage de la connexion Google...');

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
        console.error('❌ [AuthScreen] Erreur OAuth:', error);
        setError(`Erreur OAuth: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.url) {
        console.error('❌ [AuthScreen] Aucune URL OAuth');
        setError('Google OAuth non configuré.');
        setLoading(false);
        return;
      }

      console.log('🌐 [AuthScreen] Ouverture du navigateur...');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true }
      );

      if (result.type === 'success') {
        console.log('✅ [AuthScreen] Callback reçu');

        const { url } = result;
        const urlParts = url.split('#')[1] || url.split('?')[1];

        if (!urlParts) {
          console.error('❌ [AuthScreen] Pas de paramètres');
          setError('Paramètres manquants');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams(urlParts);
        const code = params.get('code');
        const error_description = params.get('error_description');
        const error_code = params.get('error');

        if (error_description || error_code) {
          console.error('❌ [AuthScreen] Erreur OAuth:', error_description);
          setError(`Authentification échouée`);
          setLoading(false);
          return;
        }

        if (code) {
          console.log('🔐 [AuthScreen] Échange du code...');

          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ [AuthScreen] Erreur d\'échange:', sessionError);
            setError(`Erreur de connexion`);
            setLoading(false);
            return;
          }

          if (!sessionData?.session) {
            console.error('❌ [AuthScreen] Pas de session');
            setError('Impossible de créer une session');
            setLoading(false);
            return;
          }

          console.log('✅ [AuthScreen] Session créée');
          const newUser = sessionData.session.user;

          try {
            const { data: existingProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', newUser.id)
              .maybeSingle();

            if (existingProfile) {
              console.log('✅ [AuthScreen] LOGIN avec profil existant');
            } else {
              console.log('📝 [AuthScreen] SIGNUP - création du profil...');
              const profileData = {
                id: newUser.id,
                email: newUser.email,
                phone: null,
                full_name: newUser.user_metadata?.full_name || null,
                username: newUser.email?.split('@')[0] || 'user',
                account_type: null,
                avatar_url: newUser.user_metadata?.avatar_url || null,
              };

              await supabase
                .from('users')
                .insert([profileData])
                .select();
            }
          } catch (profileErr) {
            console.error('❌ [AuthScreen] Erreur profil:', profileErr);
          }

          console.log('🎉 [AuthScreen] Authentification Google complète!');
        }
      } else if (result.type === 'cancel') {
        console.log('⚠️ [AuthScreen] Annulé');
      }
    } catch (err) {
      console.error('❌ [AuthScreen] Erreur:', err);
      setError(err.message || 'Impossible de se connecter avec Google');
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

            <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.gray400}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.gray400}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>{showPassword ? '○' : '●'}</Text>
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <>
                <View style={[styles.inputContainer, confirmPasswordFocused && styles.inputContainerFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={COLORS.gray400}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    editable={!loading}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeIconText}>{showConfirmPassword ? '○' : '●'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputContainer, phoneFocused && styles.inputContainerFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Téléphone (optionnel)"
                    placeholderTextColor={COLORS.gray400}
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
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

      <CustomAlertModal />
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56, borderWidth: 2, borderColor: 'transparent' },
  inputContainerFocused: { borderColor: COLORS.darkTeal1, backgroundColor: COLORS.white },
  input: { flex: 1, fontSize: 16, color: COLORS.gray700 },
  eyeIcon: { padding: 4, marginLeft: 8 },
  eyeIconText: { fontSize: 16, color: COLORS.darkTeal1, fontWeight: '600' },
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

  // ✅ Custom Alert Styles (Matching ProfileScreen)
  customAlertOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  customAlertBox: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 24, 
    width: '80%',
    alignItems: 'center',
    shadowColor: COLORS.darkTeal2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  customAlertTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.gray700,
    marginBottom: 12,
    textAlign: 'center',
  },
  customAlertMessage: { 
    fontSize: 15, 
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  customAlertButtonContainer: { 
    flexDirection: 'row', 
    gap: 12, 
    width: '100%' 
  },
  customAlertButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertCancelButton: { 
    backgroundColor: COLORS.gray200 
  },
  customAlertConfirmButton: { 
    backgroundColor: COLORS.darkTeal1 
  },
  customAlertCancelText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.gray500 
  },
  customAlertConfirmText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: COLORS.white 
  },
});