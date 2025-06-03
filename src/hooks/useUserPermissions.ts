import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_CONFIG, buildApiUrl } from "@/config/api";

interface PermissionItem {
  permissao: string;
  perfil: string;
}

interface UserPermissions {
  data: PermissionItem[];
}

const fetchUserPermissions = async (userId: string): Promise<UserPermissions> => {
  console.log('Calling API with userId:', userId);
  const url = buildApiUrl('/permissoes_usuario', { id_usuario: userId });
  
  const response = await fetch(url, {
    headers: API_CONFIG.defaultHeaders
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user permissions');
  }
  
  return response.json();
};

const getUserId = (): string | null => {
  console.log('Getting user ID from localStorage...');
  
  // Debug: List all localStorage keys
  const allKeys = Object.keys(localStorage);
  console.log('All localStorage keys:', allKeys);
  
  // First, check for direct userId storage
  const directUserId = localStorage.getItem('userId');
  if (directUserId) {
    console.log('Found direct userId:', directUserId);
    return directUserId;
  }
  
  // Check for userData object
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('Found userData:', user);
      // Try to get the correct user ID from different possible fields
      const userId = user.id_usuario || user.id || user.usuario_id;
      if (userId) {
        console.log('Extracted userId from userData:', userId);
        return userId;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  // Check for loginResponse data (from recent login)
  const loginResponse = localStorage.getItem('loginResponse');
  if (loginResponse) {
    try {
      const response = JSON.parse(loginResponse);
      console.log('Found loginResponse:', response);
      if (response.id_usuario) {
        console.log('Extracted userId from loginResponse:', response.id_usuario);
        return response.id_usuario;
      }
    } catch (error) {
      console.error('Error parsing login response:', error);
    }
  }
  
  // Try to get from any login-related data stored
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('login') || key.includes('user') || key.includes('auth')) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Checking ${key}:`, parsed);
          if (parsed.id_usuario) {
            console.log(`Found userId in ${key}:`, parsed.id_usuario);
            return parsed.id_usuario;
          }
        }
      } catch (error) {
        // Skip non-JSON items
        console.log(`Skipping non-JSON item: ${key}`);
      }
    }
  }
  
  // Check if we have the network request response data from recent login
  // Look for id_usuario in any stored data
  for (const key of allKeys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          // Look for id_usuario in any nested object
          if (parsed.id_usuario) {
            console.log(`Found id_usuario in ${key}:`, parsed.id_usuario);
            return parsed.id_usuario;
          }
          // Also check if it's a response object with id_usuario
          if (parsed.response && parsed.response.id_usuario) {
            console.log(`Found id_usuario in ${key}.response:`, parsed.response.id_usuario);
            return parsed.response.id_usuario;
          }
        }
      }
    } catch (error) {
      // Skip non-JSON items
    }
  }
  
  console.warn('No user ID found in localStorage');
  return null;
};

export const useUserPermissions = () => {
  const userId = getUserId();
  
  console.log('Current userId for permissions:', userId);
  
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('No user ID available');
      }
      console.log('Fetching permissions for userId:', userId);
      return fetchUserPermissions(userId);
    },
    enabled: !!userId, // Only run if we have a valid user ID
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });

  console.log('Permissions data:', permissionsData);
  console.log('Permissions loading:', isLoading);
  console.log('Permissions error:', error);

  const hasPermission = (permission: string): boolean => {
    const result = permissionsData?.data?.some(item => item.permissao === permission) || false;
    console.log(`Checking permission ${permission}:`, result);
    return result;
  };

  return {
    permissions: permissionsData?.data?.map(item => item.permissao) || [],
    hasPermission,
    isLoading,
    error,
    userId, // Expose userId for debugging
  };
};
