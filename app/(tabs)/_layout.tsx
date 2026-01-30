import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const TabLabel = ({ focused, label }: { focused: boolean; label: string }) => (
    <Text
      style={[
        styles.label,
        {
          color: focused ? '#1085a8ff' : '#9ca3af',
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
        tabBarActiveTintColor: '#1085a8ff',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 8,
          paddingBottom: 8,
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
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Vendre',
          tabBarIcon: ({ color }) => <Ionicons name="arrow-up-circle" size={24} color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Vendre" />,
        }}
      />
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