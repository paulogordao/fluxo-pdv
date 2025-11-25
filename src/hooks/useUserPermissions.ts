
import { useQuery } from '@tanstack/react-query';
import { permissionService } from '@/services/permissionService';
import { getUserId } from '@/utils/userUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('useUserPermissions');

export const useUserPermissions = () => {
  const userId = getUserId();
  
  log.debug('Current userId for permissions:', userId);
  
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('No user ID available');
      }
      log.debug('Fetching permissions for userId:', userId);
      return permissionService.getUserPermissions(userId);
    },
    enabled: !!userId, // Only run if we have a valid user ID
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
  });

  log.debug('Permissions data:', permissionsData);
  log.debug('Permissions loading:', isLoading);
  log.debug('Permissions error:', error);

  const hasPermission = (permission: string): boolean => {
    const result = permissionsData?.data?.some(item => item.permissao === permission) || false;
    log.debug(`Checking permission ${permission}:`, result);
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
