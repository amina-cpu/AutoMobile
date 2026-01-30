import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
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
import { supabase } from './src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // SplashScreen.preventAutoHideAsync() throws when it's not mounted.
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkingProfileRef = useRef(false);

  const checkProfileCompleteness = async (userId: string): Promise<boolean> => {
    // Prevent multiple simultaneous checks
    if (checkingProfileRef.current) {
      console.log('⚠️ [RootLayout] Profile check already in progress, skipping');
      return false;
    }

    checkingProfileRef.current = true;

    try {
      console.log('👤 [RootLayout] Checking profile completeness for user:', userId);

      // Set a hard timeout - after 3 seconds, return false
      let timeoutOccurred = false;
      const timeoutPromise = new Promise<{ timeout: boolean }>((resolve) => {
        setTimeout(() => {
          console.log('⏱️ [RootLayout] Profile check timeout - assuming incomplete');
          timeoutOccurred = true;
          resolve({ timeout: true });
        }, 3000);
      });

      // Start the query
      const queryPromise = supabase
        .from('users')
        .select('full_name, account_type')
        .eq('id', userId)
        .maybeSingle();

      // Race the query against the timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result.timeout || timeoutOccurred) {
        console.log('⏱️ [RootLayout] Timeout occurred - marking as incomplete');
        checkingProfileRef.current = false;
        return false;
      }

      const { data: userData, error: fetchError } = result as any;

      if (fetchError) {
        console.error('❌ [RootLayout] Error fetching profile:', fetchError.message);
        checkingProfileRef.current = false;
        return false;
      }

      if (!userData) {
        console.log('⚠️ [RootLayout] No profile data found for user');
        checkingProfileRef.current = false;
        return false;
      }

      console.log('📋 [RootLayout] Profile data retrieved');

      const hasFullName = userData?.full_name && String(userData.full_name).trim() !== '';
      const hasAccountType = userData?.account_type && String(userData.account_type).trim() !== '';
      const isComplete = hasFullName && hasAccountType;

      console.log('✅ [RootLayout] Profile complete:', isComplete, {
        hasFullName,
        hasAccountType,
      });

      checkingProfileRef.current = false;
      return isComplete;
    } catch (error: any) {
      console.error('❌ [RootLayout] Error checking profile:', error.message);
      checkingProfileRef.current = false;
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        console.log('🔐 [RootLayout] Initializing app and auth...');

        // Get current session (will include email confirmation data if present)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ [RootLayout] Session error:', sessionError.message);
          if (isMounted) {
            setError(sessionError.message);
            setLoading(false);
            // Hide splash after a small delay
            setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 500);
          }
          return;
        }

        console.log('📋 [RootLayout] Session check:', session?.user?.email || 'No session');

        if (isMounted) {
          if (session?.user) {
            console.log('✅ [RootLayout] User found:', session.user.email);

            const isComplete = await checkProfileCompleteness(session.user.id);

            setUser(session.user);
            setProfileComplete(isComplete);
          } else {
            console.log('⚠️ [RootLayout] No user session found');
            setUser(null);
            setProfileComplete(false);
          }

          setLoading(false);
          // Hide splash after checking auth
          setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 800);
        }
      } catch (error: any) {
        console.error('❌ [RootLayout] Error initializing app:', error);
        if (isMounted) {
          setError(error.message || 'Failed to initialize app');
          setLoading(false);
          setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 500);
        }
      }
    };

    initializeApp();

    console.log('👂 [RootLayout] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [RootLayout] Auth state changed:', event, session?.user?.email || 'No user');

        if (isMounted) {
          if (session?.user) {
            console.log('✅ [RootLayout] User authenticated, checking profile...');

            const isComplete = await checkProfileCompleteness(session.user.id);

            console.log('✅ [RootLayout] Profile check completed');

            setUser(session.user);
            setProfileComplete(isComplete);
          } else {
            console.log('⚠️ [RootLayout] User logged out');
            setUser(null);
            setProfileComplete(false);
          }

          setLoading(false);
          // Make sure splash screen is hidden
          setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 300);
        }
      }
    );

    return () => {
      console.log('🧹 [RootLayout] Cleaning up');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Show loading screen while initializing
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1085a8ff',
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ marginTop: 16, color: '#ffffff', fontSize: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fee2e2',
          padding: 20,
        }}
      >
        <Text
          style={{
            color: '#dc2626',
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          ⚠️ Erreur
        </Text>
        <Text style={{ color: '#991b1b', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  // No user - show auth screen
  if (!user) {
    console.log('🔓 [RootLayout] Rendering AuthScreen');
    return <AuthScreen />;
  }

  // User exists but profile not complete - show complete profile screen
  if (!profileComplete) {
    console.log('📝 [RootLayout] Rendering CompleteProfileScreen');
    return (
      <CompleteProfileScreen
        onComplete={async () => {
          console.log(
            '🔄 [RootLayout] Profile completed, re-checking...'
          );
          const isComplete = await checkProfileCompleteness(user.id);
          setProfileComplete(isComplete);
        }}
      />
    );
  }

  // User exists and profile is complete - show main app
  console.log('🏠 [RootLayout] Rendering main app');
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="EditCarScreen"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}