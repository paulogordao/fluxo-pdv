
import { Building2, Plus, Edit, Settings, User, FlaskConical } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Configurações de Empresa",
    icon: Building2,
    items: [
      {
        title: "Novo",
        url: "/config_empresa",
        icon: Plus,
        permissions: ["ROOT", "ADMIN"],
      },
      {
        title: "Editar",
        url: "/config_empresa_list",
        icon: Edit,
        permissions: ["ROOT", "ADMIN"],
      },
    ],
  },
  {
    title: "Usuário",
    icon: User,
    items: [
      {
        title: "Novo",
        url: "/config_usuario_novo",
        icon: Plus,
        permissions: ["ROOT", "ADMIN"],
      },
      {
        title: "Editar",
        url: "/config_usuario_edit",
        icon: Edit,
        permissions: ["ROOT", "ADMIN"],
      },
    ],
  },
  {
    title: "Configurações do fluxo",
    icon: FlaskConical,
    items: [
      {
        title: "Usuários de teste",
        url: "/config_usuarios_teste",
        icon: User,
        permissions: ["ROOT", "ADMIN"],
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const getUserPermissions = () => {
    // This would normally come from your auth context or user state
    // For now, returning a default permission - you should replace this with actual user permission logic
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.permissions || user.tipo_usuario || 'USER';
      } catch (error) {
        console.error('Error parsing user data:', error);
        return 'USER';
      }
    }
    return 'USER';
  };

  const hasPermission = (requiredPermissions: string[]) => {
    const userPermission = getUserPermissions();
    return requiredPermissions.includes(userPermission);
  };

  const handleNavigation = (url: string, requiredPermissions?: string[]) => {
    if (requiredPermissions && !hasPermission(requiredPermissions)) {
      toast({
        title: "Acesso Negado",
        description: "Você não possui permissão para acessar esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }
    navigate(url);
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-dotz-laranja rounded-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-dotz-laranja">Configurações</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((group) => (
              <SidebarMenuItem key={group.title}>
                <SidebarGroupLabel className="px-2 py-2 text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <group.icon className="h-4 w-4" />
                  <span>{group.title}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {group.items.map((item) => {
                      const hasAccess = !item.permissions || hasPermission(item.permissions);
                      
                      return (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                            className={`
                              w-full text-left text-sm px-3 py-2 rounded-md transition-colors
                              ${isActive(item.url) 
                                ? 'bg-dotz-laranja text-white font-medium' 
                                : hasAccess 
                                  ? 'text-gray-600 hover:bg-gray-100 hover:text-dotz-laranja cursor-pointer'
                                  : 'text-gray-400 cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            <button
                              onClick={() => handleNavigation(item.url, item.permissions)}
                              className="flex items-center space-x-2 w-full"
                              disabled={!hasAccess}
                              title={!hasAccess ? "Você não tem permissão para acessar esta funcionalidade" : undefined}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
