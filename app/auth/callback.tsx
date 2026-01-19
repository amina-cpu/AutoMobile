import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../src/config/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // The OAuth callback is already handled by Supabase
      // Just check if user is authenticated and redirect
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated, the RootLayout will automatically
        // detect the user and show the home screen
        router.replace('/(tabs)');
      } else {
        // No user, go back to auth
        router.replace('/auth/auth');
      }
    } catch (error) {
      console.error('Callback error:', error);
      router.replace('/auth/auth');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}