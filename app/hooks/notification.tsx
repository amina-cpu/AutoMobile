import { useEffect, useState } from 'react';
import { supabase } from '../src/config/supabase';

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';
const SUPABASE_URL = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';

export const useNotifications = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadNotificationCount();

    // Set up real-time subscription
    const subscription = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favorites',
        },
        () => {
          console.log('🔔 New favorite detected, updating count');
          loadNotificationCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotificationCount = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setNotificationCount(0);
        return;
      }

      // Get user's cars
      const { data: userCars, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq('seller_id', user.id);

      if (carsError || !userCars || userCars.length === 0) {
        setNotificationCount(0);
        return;
      }

      const carIds = userCars.map(car => car.id);

      // Count favorites on user's cars
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?car_id=in.(${carIds.join(',')})&select=id`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        setNotificationCount(0);
        return;
      }

      const data = await response.json();
      setNotificationCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('❌ Error loading notification count:', error);
      setNotificationCount(0);
    }
  };

  return { notificationCount, refreshCount: loadNotificationCount };
};