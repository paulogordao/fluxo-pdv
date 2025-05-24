
import { Building2, Plus, Edit, Settings } from "lucide-react";
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

const menuItems = [
  {
    title: "Configurações de Empresa",
    icon: Building2,
    items: [
      {
        title: "Novo",
        url: "/config_empresa",
        icon: Plus,
      },
      {
        title: "Editar",
        url: "/config_empresa_editar",
        icon: Edit,
        disabled: true, // Temporariamente desabilitado
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string) => {
    return location.pathname === url;
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
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(item.url)}
                          className={`
                            w-full text-left text-sm px-3 py-2 rounded-md transition-colors
                            ${isActive(item.url) 
                              ? 'bg-dotz-laranja text-white font-medium' 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-dotz-laranja'
                            }
                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <button
                            onClick={() => !item.disabled && navigate(item.url)}
                            disabled={item.disabled}
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
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
