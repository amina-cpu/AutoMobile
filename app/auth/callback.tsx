import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Simply redirect back to root
    // RootLayout will handle the session detection automatically
    console.log('🔄 [AuthCallback] OAuth callback received, redirecting...');
    
    // Small delay to ensure session is set
    const timer = setTimeout(() => {
      console.log('🏠 [AuthCallback] Redirecting to root');
      router.replace('/');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
      <ActivityIndicator size="large" color="#1085a8ff" />
      <Text style={{ marginTop: 16, color: '#6b7280' }}>Finalizing authentication...</Text>
    </View>
  );
}