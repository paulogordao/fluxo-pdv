import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Building2, LogOut, User, Play, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { empresaService, Empresa } from "@/services/empresaService";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { clearUserSessionCache } from "@/utils/cacheUtils";
import { createLogger } from '@/utils/logger';

const log = createLogger('UserProfileSelector');

interface UserProfileSelectorProps {
  userName?: string;
  companyName?: string;
  companyId?: string;
  tipoSimulacao?: string;
  userId?: string;
  userEmail?: string;
  userUsername?: string;
  onCompanyChange?: () => void;
}

const UserProfileSelector = ({ 
  userName = "Usuário", 
  companyName = "Empresa",
  companyId,
  tipoSimulacao,
  userId,
  userEmail = "",
  userUsername = "",
  onCompanyChange
}: UserProfileSelectorProps) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      loadEmpresas();
    }
  }, [isOpen, userId]);

  const loadEmpresas = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingEmpresas(true);
      const data = await empresaService.getEmpresas(userId);
      setEmpresas(data);
    } catch (error) {
      log.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setIsLoadingEmpresas(false);
    }
  };

  const handleSwitchCompany = async (empresaId: string) => {
    if (!userId) return;
    
    try {
      setIsSwitching(true);
      
      await userService.updateUser({
        id: userId,
        usuario: userUsername || userName,
        nome: userName,
        email: userEmail,
        empresa_id: empresaId
      }, userId);

      clearUserSessionCache();
      
      toast.success("Empresa alterada com sucesso!");
      setIsOpen(false);
      
      if (onCompanyChange) {
        onCompanyChange();
      }
      
    } catch (error) {
      log.error("Erro ao trocar empresa:", error);
      toast.error("Erro ao trocar empresa. Tente novamente.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const formatSimulationType = (tipo?: string) => {
    if (!tipo) return "N/A";
    switch (tipo.toUpperCase()) {
      case "PROD":
        return "Produção";
      case "TEST":
        return "Teste";
      case "DEV":
        return "Desenvolvimento";
      default:
        return tipo;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Card 
          className="shadow-md border border-dotz-pessego hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: isHovered ? 'auto' : '140px',
            maxWidth: isHovered ? '450px' : '140px'
          }}
        >
          <CardContent className={`transition-all duration-300 ${isHovered ? 'p-4' : 'p-3'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-dotz-laranja rounded-full flex-shrink-0">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  {/* Sempre visível */}
                  <div className="flex items-center space-x-1 text-sm font-medium text-gray-900 whitespace-nowrap">
                    <User className="h-4 w-4 text-dotz-laranja flex-shrink-0" />
                    <span className={isHovered ? '' : 'truncate max-w-[60px]'}>{userName}</span>
                  </div>
                  
                  {/* Mostra apenas no hover com animação */}
                  <div 
                    className={`
                      flex items-center space-x-1 text-xs text-gray-600 whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${isHovered 
                        ? 'opacity-100 max-h-6 mt-1' 
                        : 'opacity-0 max-h-0 overflow-hidden'
                      }
                    `}
                  >
                    <Building2 className="h-3 w-3 text-dotz-laranja flex-shrink-0" />
                    <span className="truncate">{companyName}</span>
                    {isHovered && <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />}
                  </div>
                  
                  {/* Mostra apenas no hover com animação */}
                  <div 
                    className={`
                      flex items-center space-x-1 text-xs text-gray-600 whitespace-nowrap
                      transition-all duration-300 ease-in-out
                      ${isHovered 
                        ? 'opacity-100 max-h-6 mt-1' 
                        : 'opacity-0 max-h-0 overflow-hidden'
                      }
                    `}
                  >
                    <Play className="h-3 w-3 text-dotz-laranja flex-shrink-0" />
                    <span>Simulação: {formatSimulationType(tipoSimulacao)}</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className={`
                  p-2 hover:bg-gray-100 text-gray-600 hover:text-dotz-laranja flex-shrink-0
                  transition-all duration-300
                  ${isHovered ? 'opacity-100' : 'opacity-0 w-0 p-0'}
                `}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-3 bg-background z-50" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-foreground mb-3">
            Trocar Empresa
          </h4>
          
          {isLoadingEmpresas ? (
            <div className="text-sm text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando empresas...
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma empresa disponível
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => handleSwitchCompany(empresa.id)}
                  disabled={isSwitching || empresa.id === companyId}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-md
                    transition-colors text-left
                    ${empresa.id === companyId 
                      ? 'bg-dotz-laranja/10 text-dotz-laranja cursor-default' 
                      : 'hover:bg-accent text-foreground'
                    }
                    ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{empresa.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatSimulationType(empresa.tipo_simulacao)}
                    </span>
                  </div>
                  {empresa.id === companyId && (
                    <Check className="h-4 w-4 text-dotz-laranja flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
          
          <div className="pt-2 border-t mt-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                setIsOpen(false);
                navigate("/configuracoes");
              }}
            >
              Ir para Configurações
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileSelector;
