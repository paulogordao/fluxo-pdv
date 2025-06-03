
import { API_CONFIG } from "@/config/api";

export interface PermissionItem {
  permissao: string;
  perfil: string;
}

export interface UserPermissions {
  data: PermissionItem[];
}

export const permissionService = {
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const response = await fetch(`${API_CONFIG.baseUrl}/permissoes_usuario?id_usuario=${userId}`, {
      headers: API_CONFIG.defaultHeaders
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user permissions');
    }

    return response.json();
  }
};
