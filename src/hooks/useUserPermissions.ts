
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UserPermissions {
  permissao: string[];
}

const fetchUserPermissions = async (userId: string): Promise<UserPermissions> => {
  const response = await fetch(
    `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/permissoes_usuario?id_usuario=${userId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user permissions');
  }
  
  return response.json();
};

const getUserId = (): string => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      // Try to get the correct user ID from different possible fields
      return user.id_usuario || user.id || user.usuario_id || '';
    } catch (error) {
      console.error('Error parsing user data:', error);
      return '';
    }
  }
  
  // If no userData, check if there's a direct userId stored
  const directUserId = localStorage.getItem('userId');
  if (directUserId) {
    return directUserId;
  }
  
  console.warn('No user ID found in localStorage');
  return '';
};

export const useUserPermissions = () => {
  const userId = getUserId();
  
  console.log('Current userId for permissions:', userId);
  
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => fetchUserPermissions(userId),
    enabled: !!userId, // Only run if we have a valid user ID
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });

  const hasPermission = (permission: string): boolean => {
    return permissionsData?.permissao?.includes(permission) || false;
  };

  return {
    permissions: permissionsData?.permissao || [],
    hasPermission,
    isLoading,
    error,
    userId, // Expose userId for debugging
  };
};
