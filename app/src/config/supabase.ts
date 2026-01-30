import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://hhzwamxtmjdxtdmiwshi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoendhbXh0bWpkeHRkbWl3c2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTk5NTYsImV4cCI6MjA4NDAzNTk1Nn0.yQTwux9GBg1LUOBghN5mH_dzojwNPDi3kRDEUdJF2OA';

// Simple in-memory storage for development
const memoryStorage: { [key: string]: string } = {};

const createStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try {
          return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        } catch (e) {
          // ignore
        }
      },
      removeItem: (key: string) => {
        try {
          if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        } catch (e) {
          // ignore
        }
      },
    };
  }

  // In-memory for React Native
  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});