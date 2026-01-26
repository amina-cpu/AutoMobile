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
        console.log('✅ Déjà connecté en tant que:', user.email);
      }
    } catch (error) {
      console.log('⚠️ Non connecté');
    }
  };

  const createUserProfile = async (userId, userEmail, userPhone = null) => {
    try {
      console.log('👤 Création du profil utilisateur pour:', userId);
      
      const profileData = {
        id: userId,
        email: userEmail,
        phone: userPhone || null,
        full_name: null,
        username: userEmail?.split('@')[0] || 'user',
        account_type: 'buyer',
        avatar_url: null
      };

      console.log('📤 Envoi des données du profil:', profileData);
      
      // Use Supabase client instead of fetch
      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        
        // If user already exists (unique constraint), that's ok
        if (error.code === '23505') {
          console.log('✅ Le profil existe déjà');
          return { success: true, existed: true };
        }
        
        throw new Error(`Impossible de créer le profil: ${error.message}`);
      }

      console.log('✅ Profil utilisateur créé:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erreur de création du profil:', error);
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

      console.log('📝 Démarrage de l\'inscription...');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('❌ Erreur d\'inscription:', signUpError);
        throw signUpError;
      }

      console.log('✅ Utilisateur créé:', authData.user?.id);

      if (authData.user) {
        try {
          await createUserProfile(
            authData.user.id, 
            email, 
            phone
          );
        } catch (profileError) {
          console.error('❌ Création du profil échouée:', profileError);
          Alert.alert(
            'Compte créé',
            'Votre compte a été créé mais il y a eu un problème lors de la configuration de votre profil. Veuillez essayer de vous connecter.',
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
        'Succès', 
        'Compte créé! Vous pouvez maintenant vous connecter.',
        [{ text: 'OK' }]
      );
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setIsSignUp(false);
    } catch (err) {
      console.error('❌ Erreur d\'inscription:', err);
      setError(err.message || 'Impossible de s\'inscrire');
      Alert.alert('Erreur', err.message || 'Impossible de s\'inscrire');
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

      console.log('🔑 Connexion...');

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erreur de connexion:', signInError);
        throw signInError;
      }

      console.log('✅ Connecté:', data.user.id);

      if (data.user) {
        try {
          console.log('🔍 Vérification de l\'existence du profil...');
          
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (!userData) {
            console.log('⚠️ Profil non trouvé, création...');
            await createUserProfile(
              data.user.id, 
              data.user.email,
              null
            );
          } else {
            console.log('✅ Le profil existe');
          }
        } catch (err) {
          console.error('❌ Erreur de vérification/création du profil:', err);
          try {
            await createUserProfile(
              data.user.id, 
              data.user.email,
              null
            );
          } catch (createErr) {
            console.error('❌ Impossible de créer le profil:', createErr);
          }
        }
      }

      Alert.alert('Succès', 'Connecté!');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      setError(err.message || 'Impossible de se connecter');
      Alert.alert('Erreur', err.message || 'Impossible de se connecter');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 Démarrage de la connexion Google...');

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
        console.error('❌ Erreur OAuth:', error);
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
            throw new Error('Aucune donnée d\'authentification reçue');
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
              console.error('❌ Erreur de session:', sessionError);
              throw sessionError;
            }

            const { data: { user: newUser } } = await supabase.auth.getUser();

            if (newUser) {
              console.log('✅ Utilisateur Google authentifié:', newUser.id);
              
              try {
                const { data: userData, error: fetchError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', newUser.id)
                  .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                  throw fetchError;
                }

                if (!userData) {
                  console.log('📝 Création du profil pour l\'utilisateur Google...');
                  await createUserProfile(
                    newUser.id, 
                    newUser.email,
                    null
                  );
                } else {
                  console.log('✅ Le profil de l\'utilisateur Google existe déjà');
                }
              } catch (err) {
                console.error('❌ Erreur de vérification du profil:', err);
                try {
                  await createUserProfile(
                    newUser.id, 
                    newUser.email,
                    null
                  );
                } catch (createErr) {
                  console.error('❌ Impossible de créer le profil:', createErr);
                }
              }

              Alert.alert('Succès', 'Connecté avec Google!');
            }
          } else {
            throw new Error('Tokens d\'authentification non trouvés');
          }
        } else if (result.type === 'cancel') {
          setError('Connexion Google annulée');
        }
      }
    } catch (err) {
      console.error('❌ Erreur de connexion Google:', err);
      setError(err.message || 'Impossible de se connecter avec Google');
      Alert.alert('Erreur', err.message || 'Impossible de se connecter avec Google');
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
                placeholder="Mot de passe"
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
                    placeholder="Confirmer le mot de passe"
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
                    placeholder="Téléphone (optionnel)"
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
                <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
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