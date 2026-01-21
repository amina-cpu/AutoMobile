import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthScreen from './auth/auth';
import { supabase } from './src/config/supabase';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 [RootLayout] Initializing auth...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [RootLayout] Session error:', sessionError);
          setError(sessionError.message);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('📋 [RootLayout] Session check:', session?.user?.email || 'No session');
        
        if (isMounted) {
          if (session?.user) {
            console.log('✅ [RootLayout] User found:', session.user.email);
            setUser(session.user);
          } else {
            console.log('⚠️ [RootLayout] No user session found');
            setUser(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [RootLayout] Auth init error:', error);
        if (isMounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    initAuth();

    console.log('👂 [RootLayout] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 [RootLayout] Auth state changed:', event, session?.user?.email || 'No user');
        
        if (isMounted) {
          if (session?.user) {
            setUser(session.user);
          } else {
            setUser(null);
          }
        }
      }
    );

    return () => {
      console.log('🧹 [RootLayout] Cleanup');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2', padding: 20 }}>
        <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>⚠️ Error</Text>
        <Text style={{ color: '#991b1b', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
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