import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from './src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// COLORS - Dark Teal & Green Theme from Logo
const COLORS = {
  darkTeal1: '#05696F',
  darkTeal2: '#064C53',
  primaryGreen: '#05696F',
  darkGreen: '#05696F',
  white: '#FFFFFF',
  black: '#000000',
};

const redirectUri = AuthSession.makeRedirectUri({
   scheme: 'vcar',
  path: 'auth/callback',
});

interface OnboardingScreenProps {
  onSkipToAuth?: () => void;
}

export default function OnboardingScreen({ onSkipToAuth }: OnboardingScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔗 [Onboarding] Redirect URI:', redirectUri);
    console.log('📱 [Onboarding] Initializing onboarding screen...');
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔑 [Onboarding] Démarrage de la connexion Google...');

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
        console.error('❌ [Onboarding] Erreur OAuth:', error);
        setError(`Erreur OAuth: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.url) {
        console.error('❌ [Onboarding] Aucune URL OAuth');
        setError('Google OAuth non configuré.');
        setLoading(false);
        return;
      }

      console.log('🌐 [Onboarding] Ouverture du navigateur...');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        { showInRecents: true }
      );

      if (result.type === 'success') {
        console.log('✅ [Onboarding] Callback reçu');

        const { url } = result;
        const urlParts = url.split('#')[1] || url.split('?')[1];

        if (!urlParts) {
          console.error('❌ [Onboarding] Pas de paramètres');
          setError('Paramètres manquants');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams(urlParts);
        const code = params.get('code');
        const error_description = params.get('error_description');
        const error_code = params.get('error');

        if (error_description || error_code) {
          console.error('❌ [Onboarding] Erreur OAuth:', error_description);
          setError(`Authentification échouée`);
          setLoading(false);
          return;
        }

        if (code) {
          console.log('🔐 [Onboarding] Échange du code...');

          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('❌ [Onboarding] Erreur d\'échange:', sessionError);
            setError(`Erreur de connexion`);
            setLoading(false);
            return;
          }

          if (!sessionData?.session) {
            console.error('❌ [Onboarding] Pas de session');
            setError('Impossible de créer une session');
            setLoading(false);
            return;
          }

          console.log('✅ [Onboarding] Session créée');
          const newUser = sessionData.session.user;

          try {
            const { data: existingProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', newUser.id)
              .maybeSingle();

            if (existingProfile) {
              console.log('✅ [Onboarding] LOGIN avec profil existant');
            } else {
              console.log('📝 [Onboarding] SIGNUP - création du profil...');
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
            console.error('❌ [Onboarding] Erreur profil:', profileErr);
          }

          console.log('🎉 [Onboarding] Authentification Google complète!');
        }
      } else if (result.type === 'cancel') {
        console.log('⚠️ [Onboarding] Annulé');
      }
    } catch (err) {
      console.error('❌ [Onboarding] Erreur:', err);
      setError(err.message || 'Impossible de se connecter avec Google');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Call the callback to skip onboarding and show auth screen
  const handleSignUp = () => {
    console.log('📝 [Onboarding] Navigating to auth signup...');
    if (onSkipToAuth) {
      onSkipToAuth();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Background with Car Image - Fullscreen */}
      <ImageBackground
        source={require('../assets/images/black.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />

        {/* Header Content */}
        <View style={styles.headerContent}>
          <Text style={styles.title}>Bienvenue sur</Text>
          <Text style={styles.brandName}>
            <Text style={styles.brandNameV}>V</Text>
            <Text>car</Text>
          </Text>
          <Text style={styles.subtitle}>Achetez et vendez des voitures en toute confiance, rapidement et en toute sécurité</Text>
        </View>

       
        <View style={styles.bottomSection}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleButtonText}>
              {loading ? '⏳ Connexion...' : ' Se connecter avec Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.signupButtonText}>
              {loading ? '⏳ Chargement...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // Background Image Section - Fullscreen
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 50,
  },

  // Dark overlay over image
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Header Content
  headerContent: {
    alignItems: 'flex-start',
    
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 60,
    zIndex: 10,
  },

  title: {
    fontSize: 35,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '500',
  },

  brandName: {
    fontSize: 55,
    fontWeight: 'bold',
    color: COLORS.white,
    marginVertical: 4,
  },

  brandNameV: {
    color: COLORS.primaryGreen,
  },

  subtitle: {
    fontSize: 20,
    color: COLORS.white,
    opacity: 0.85,
  },

  // Bottom Section
  bottomSection: {
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
    zIndex: 10,
  },

  // Buttons
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  googleButton: {
    backgroundColor: COLORS.darkTeal1,
  },

  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  signupButton: {
    backgroundColor: COLORS.darkTeal1,
  },

  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Error
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    width: '100%',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
});