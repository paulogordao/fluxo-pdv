
import { Building2, Plus, Edit, Settings, User, FlaskConical, Home } from "lucide-react";
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
import { useUserPermissions } from "@/hooks/useUserPermissions";

const menuItems = [
  {
    title: "Configurações de Empresa",
    icon: Building2,
    items: [
      {
        title: "Novo",
        url: "/config_empresa",
        icon: Plus,
        permission: "menu_empresa_novo",
      },
      {
        title: "Editar",
        url: "/config_empresa_list",
        icon: Edit,
        permission: "menu_empresa_editar",
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
        permission: "menu_usuario_novo",
      },
      {
        title: "Editar",
        url: "/config_usuario_edit",
        icon: Edit,
        permission: "menu_usuario_editar",
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
        permission: "menu_usuario_teste",
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, isLoading } = useUserPermissions();

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const handleNavigation = (url: string, permission?: string) => {
    if (permission && !hasPermission(permission)) {
      toast({
        title: "Acesso Negado",
        description: "Você não possui permissão para acessar esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }
    navigate(url);
  };

  if (isLoading) {
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
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Carregando permissões...</div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

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
            {/* Item de navegação para voltar ao início - sem permissão necessária */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/index")}
                className={`
                  w-full text-left text-sm px-3 py-2 rounded-md transition-colors mb-4
                  ${isActive("/index") 
                    ? 'bg-dotz-laranja text-white font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-dotz-laranja cursor-pointer'
                  }
                `}
              >
                <button
                  onClick={() => handleNavigation("/index")}
                  className="flex items-center space-x-2 w-full"
                >
                  <Home className="h-4 w-4" />
                  <span>Voltar ao Início</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Itens do menu baseados em permissões */}
            {menuItems.map((group) => {
              // Filter items based on permissions
              const visibleItems = group.items.filter(item => 
                !item.permission || hasPermission(item.permission)
              );

              // Only show group if it has visible items
              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <SidebarMenuItem key={group.title}>
                  <SidebarGroupLabel className="px-2 py-2 text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <group.icon className="h-4 w-4" />
                    <span>{group.title}</span>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      {visibleItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                            className={`
                              w-full text-left text-sm px-3 py-2 rounded-md transition-colors
                              ${isActive(item.url) 
                                ? 'bg-dotz-laranja text-white font-medium' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-dotz-laranja cursor-pointer'
                              }
                            `}
                          >
                            <button
                              onClick={() => handleNavigation(item.url, item.permission)}
                              className="flex items-center space-x-2 w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
