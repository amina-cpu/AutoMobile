import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../src/config/supabase';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('favorites')
          .select('cars(*)')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setFavorites(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (carId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('car_id', carId);
      
      loadFavorites();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <ActivityIndicator size="large" />;

  if (favorites.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Aucune voiture favorites</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      renderItem={({ item }) => (
        <View>
          <Text>{item.cars.brand} {item.cars.model}</Text>
          <TouchableOpacity onPress={() => removeFavorite(item.cars.id)}>
            <Text>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
      keyExtractor={(item) => item.cars.id}
    />
  );
}