import { supabase } from '../config/supabase';

export const carService = {
  // Get all available cars
  async getAllCars() {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },

  // Get latest cars (for homepage)
  async getLatestCars(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching latest cars:', error);
      throw error;
    }
  },

  // Get car by ID - SIMPLE VERSION (no maintenance history)
  async getCarById(carId) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching car:', error);
      throw error;
    }
  },

  // Search cars with filters
  async searchCars(filters) {
    try {
      let query = supabase.from('cars').select('*').eq('status', 'available');
      
      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.fuel) {
        query = query.eq('fuel_type', filters.fuel);
      }
      if (filters.minYear) {
        query = query.gte('year', filters.minYear);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching cars:', error);
      throw error;
    }
  },

  // Add car to favorites
  async addToFavorites(userId, carId) {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, car_id: carId }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Remove car from favorites
  async removeFromFavorites(userId, carId) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('car_id', carId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  // Get user's favorite cars
  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('cars(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  // Add new car listing
  async addCar(carData) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .insert([carData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding car:', error);
      throw error;
    }
  },

  // Update car listing
  async updateCar(carId, carData) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .update(carData)
        .eq('id', carId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },

  // Delete car listing
  async deleteCar(carId) {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  }
};