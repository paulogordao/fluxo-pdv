
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
      return user.id || user.usuario_id || '1'; // fallback to '1' if no ID found
    } catch (error) {
      console.error('Error parsing user data:', error);
      return '1';
    }
  }
  return '1'; // default fallback
};

export const useUserPermissions = () => {
  const userId = getUserId();
  
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => fetchUserPermissions(userId),
    enabled: !!userId,
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
  };
};
