
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { empresaService } from '@/services/empresaService';

interface UserSessionData {
  userName: string;
  companyName: string;
  userId: string | null;
  tipo_simulacao: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserSession = () => {
  const [sessionData, setSessionData] = useState<UserSessionData>({
    userName: "Usuário",
    companyName: "Empresa",
    userId: null,
    tipo_simulacao: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setSessionData(prev => ({ ...prev, isLoading: true, error: null }));

        // 1. Obter id_usuario do localStorage (já salvo no login)
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.warn("No user ID found in localStorage");
          setSessionData(prev => ({ 
            ...prev, 
            userId: null,
            isLoading: false, 
            error: "Sessão não encontrada" 
          }));
          return;
        }

        console.log("Loading user session for userId:", userId);

        // 2. Buscar detalhes do usuário
        const userData = await userService.getUserById(userId, userId);
        console.log("User data received:", userData);

        const userName = userData.nome || "Usuário";
        const empresaId = userData.empresa_id;

        // Se não tiver empresa_id, usar dados parciais
        if (!empresaId) {
          setSessionData({
            userName,
            companyName: userData.empresa || "Empresa",
            userId,
            tipo_simulacao: null,
            isLoading: false,
            error: null
          });
          return;
        }

        // 3. Buscar detalhes da empresa
        const empresaData = await empresaService.getEmpresaById(empresaId, userId);
        console.log("Company data received:", empresaData);

        const companyName = empresaData.nome || "Empresa";
        const tipoSimulacao = empresaData.tipo_simulacao || null;

        // 4. Salvar no sessionStorage para próximas sessões
        sessionStorage.setItem("user_name", userName);
        sessionStorage.setItem("company_name", companyName);

        setSessionData({
          userName,
          companyName,
          userId,
          tipo_simulacao: tipoSimulacao,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error("Error loading user session:", error);
        
        // Fallback: tentar usar dados do sessionStorage se houver erro na API
        const fallbackUserName = sessionStorage.getItem("user_name");
        const fallbackCompanyName = sessionStorage.getItem("company_name");
        const userId = localStorage.getItem("userId");
        
        if (fallbackUserName || fallbackCompanyName) {
          setSessionData({
            userName: fallbackUserName || "Usuário",
            companyName: fallbackCompanyName || "Empresa",
            userId,
            tipo_simulacao: null,
            isLoading: false,
            error: null
          });
        } else {
          setSessionData(prev => ({
            ...prev,
            userId,
            tipo_simulacao: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "Erro ao carregar dados"
          }));
        }
      }
    };

    loadUserSession();
  }, []);

  return sessionData;
};
