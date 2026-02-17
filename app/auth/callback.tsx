import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    // Let Supabase finish OAuth, then leave immediately
    router.replace('/');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#05696F" />
    </View>
  );
}
