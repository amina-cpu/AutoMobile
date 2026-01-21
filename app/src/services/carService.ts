// src/services/carService.ts
import { directFetch, supabaseAnonKey, supabaseUrl } from '../config/supabase';

export const carService = {
  // Get all cars with images
  async getAllCars() {
    return directFetch('cars?select=*,car_images(id,image_url,display_order)&order=created_at.desc');
  },

  // Get car by ID
  async getCarById(carId: string) {
    const data = await directFetch(`cars?select=*,car_images(id,image_url,display_order)&id=eq.${carId}`);
    return data[0];
  },

  // Add new car
  async addCar(carData: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/cars`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(carData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data[0];
  },

  // Update car
  async updateCar(carId: string, updates: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/cars?id=eq.${carId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Delete car
  async deleteCar(carId: string) {
    const response = await fetch(`${supabaseUrl}/rest/v1/cars?id=eq.${carId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  },
};