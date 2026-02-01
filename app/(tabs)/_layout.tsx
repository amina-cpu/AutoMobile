import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '../src/config/supabase';

// COLORS - Dark Teal Theme
const COLORS = {
  darkTeal1: '#05696F',
  primaryGreen: '#41B975',
  gray400: '#cbd5e1',
  gray500: '#64748b',
  white: '#FFFFFF',
  lightGray: '#f5f5f5',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | null>(null);

  useEffect(() => {
    const getAccountType = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('account_type')
            .eq('id', user.id)
            .maybeSingle();

          if (data?.account_type) {
            setAccountType(data.account_type);
          }
        }
      } catch (error) {
        console.error('Error fetching account type:', error);
      }
    };

    getAccountType();
  }, []);

  const TabLabel = ({ focused, label }: { focused: boolean; label: string }) => (
    <Text
      style={[
        styles.label,
        {
          color: focused ? COLORS.darkTeal1 : COLORS.gray500,
          fontWeight: focused ? '700' : '500',
        },
      ]}
    >
      {label}
    </Text>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.darkTeal1,
        tabBarInactiveTintColor: COLORS.gray500,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: COLORS.white,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Accueil" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Acheter',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Acheter" />,
        }}
      />
      
      {/* ONLY SHOW FOR SELLERS */}
      {accountType === 'seller' ? (
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Vendre',
            tabBarIcon: ({ color }) => <Ionicons name="arrow-up-circle" size={24} color={color} />,
            tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Vendre" />,
          }}
        />
      ) : (
        <Tabs.Screen
          name="sell"
          options={{
            href: null,
          }}
        />
      )}
      
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Favoris" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Profil" />,
        }}
      />
      <Tabs.Screen
        name="product-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="my-listings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sellerProfile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});