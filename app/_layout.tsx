import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthScreen from './auth/auth';
import CompleteProfileScreen from './auth/complete-profile';
import OnboardingScreen from './onBoard';
import { supabase } from './src/config/supabase';

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [skipOnboarding, setSkipOnboarding] = useState(false);
  const checkingProfileRef = useRef(false);

  /**
   * ✅ VERY IMPORTANT: Handle OAuth deep link
   */
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      console.log('🔗 [OAuth] Deep link received:', url);

      try {
        const { data, error } = await supabase.auth.getSession();

        console.log('🔐 [OAuth] Session after redirect:', data?.session?.user?.email);

        if (error) {
          console.error('❌ [OAuth] Session error:', error.message);
        }
      } catch (err) {
        console.error('❌ [OAuth] Failed handling redirect', err);
      }
    };

    // Initial URL (cold start)
    Linking.getInitialURL().then(handleDeepLink);

    // Runtime URL listener
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => sub.remove();
  }, []);

  const checkProfileCompleteness = async (userId: string): Promise<boolean> => {
    if (checkingProfileRef.current) return false;
    checkingProfileRef.current = true;

    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, account_type')
        .eq('id', userId)
        .maybeSingle();

      const complete =
        !!data?.full_name?.trim() &&
        !!data?.account_type?.trim();

      checkingProfileRef.current = false;
      return complete;
    } catch {
      checkingProfileRef.current = false;
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('🔄 [RootLayout] Initializing...');
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data?.session?.user) {
        console.log('✅ [Init] User found:', data.session.user.email);
        setShowOnboarding(false);
        setUser(data.session.user);
        setProfileComplete(
          await checkProfileCompleteness(data.session.user.id)
        );
      } else {
        console.log('⚠️ [Init] No user');
        setUser(null);
        setShowOnboarding(true);
      }

      setLoading(false);
      SplashScreen.hideAsync().catch(() => {});
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 [Auth] Event:', _event, 'User:', session?.user?.email);

        if (!mounted) return;

        // ✅ FIX: IGNORE USER_UPDATED EVENT (password change)
        if (_event === 'USER_UPDATED') {
          console.log('⏭️ [Auth] Password changed - ignoring UI update');
          return; // Don't do anything on password change
        }

        if (session?.user) {
          console.log('✅ [Auth] User detected:', session.user.email);
          setUser(session.user);
          setShowOnboarding(false);
          setProfileComplete(
            await checkProfileCompleteness(session.user.id)
          );
        } else {
          console.log('⚠️ [Auth] No user detected');
          setUser(null);
          setProfileComplete(false);
          if (!skipOnboarding) setShowOnboarding(true);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [skipOnboarding]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#05696F' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 12 }}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (showOnboarding && !user && !skipOnboarding) {
    return <OnboardingScreen onSkipToAuth={() => setSkipOnboarding(true)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profileComplete) {
    return <CompleteProfileScreen onComplete={() => setProfileComplete(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}