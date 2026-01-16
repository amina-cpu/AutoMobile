import { supabase } from '../config/supabase';

export const carService = {
  // Get all available cars with images
  async getAllCars() {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          car_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },

  // Get latest cars (for homepage) with images
  async getLatestCars(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          car_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Sort images by display_order for each car
      const carsWithSortedImages = data?.map(car => ({
        ...car,
        car_images: car.car_images?.sort((a, b) => a.display_order - b.display_order) || []
      })) || [];
      
      return carsWithSortedImages;
    } catch (error) {
      console.error('Error fetching latest cars:', error);
      throw error;
    }
  },

  // Get car by ID with images
  async getCarById(carId) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          car_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('id', carId)
        .single();
      
      if (error) throw error;
      
      // Sort images by display_order
      if (data && data.car_images) {
        data.car_images = data.car_images.sort((a, b) => a.display_order - b.display_order);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching car:', error);
      throw error;
    }
  },

  // Search cars with filters and images
  async searchCars(filters) {
    try {
      let query = supabase
        .from('cars')
        .select(`
          *,
          car_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq('status', 'available');
      
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
      
      // Sort images by display_order for each car
      const carsWithSortedImages = data?.map(car => ({
        ...car,
        car_images: car.car_images?.sort((a, b) => a.display_order - b.display_order) || []
      })) || [];
      
      return carsWithSortedImages;
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

  // Get user's favorite cars with images
  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          cars (
            *,
            car_images (
              id,
              image_url,
              display_order
            )
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Sort images by display_order for each car
      const favoritesWithSortedImages = data?.map(fav => ({
        ...fav,
        cars: {
          ...fav.cars,
          car_images: fav.cars.car_images?.sort((a, b) => a.display_order - b.display_order) || []
        }
      })) || [];
      
      return favoritesWithSortedImages;
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

  // Add car image
  async addCarImage(carId, imageUrl, displayOrder = 0) {
    try {
      const { data, error } = await supabase
        .from('car_images')
        .insert([{
          car_id: carId,
          image_url: imageUrl,
          display_order: displayOrder
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding car image:', error);
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