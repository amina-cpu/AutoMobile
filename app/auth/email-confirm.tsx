import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../src/config/supabase';

export default function EmailConfirmCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔄 [EmailConfirmCallback] Processing email confirmation...');

        // Get the current session - Supabase should have already set it from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ [EmailConfirmCallback] Session error:', sessionError.message);
          setError('Erreur lors de la confirmation: ' + sessionError.message);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ [EmailConfirmCallback] Session confirmed for user:', session.user.email);
          console.log('🎉 [EmailConfirmCallback] Email verified successfully, redirecting to app');

          // Wait a moment then redirect
          setTimeout(() => {
            router.replace('/');
          }, 500);
        } else {
          console.error('❌ [EmailConfirmCallback] No session found after confirmation');
          setError('Impossible de confirmer l\'email. Veuillez réessayer.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('❌ [EmailConfirmCallback] Error:', err);
        setError(err.message || 'Une erreur est survenue');
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [router]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fee2e2', padding: 20 }}>
        <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>⚠️ Erreur de confirmation</Text>
        <Text style={{ color: '#991b1b', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 14 }}>
          Retournez à l'app de connexion et réessayez.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
      <ActivityIndicator size="large" color="#1085a8ff" />
      <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 16 }}>Confirmation en cours...</Text>
    </View>
  );
}