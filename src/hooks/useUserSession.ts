
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

  // Function to force refresh session data
  const refreshSession = async () => {
    // Clear cache first
    localStorage.removeItem("user_session_cache");
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("company_name");
    
    // Trigger a reload by calling loadUserSession
    loadUserSession();
  };

  const loadUserSession = async () => {
      try {
        setSessionData(prev => ({ ...prev, isLoading: true, error: null }));

        // 1. Get user ID from localStorage
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.warn("[useUserSession] No user ID found in localStorage");
          setSessionData(prev => ({ 
            ...prev, 
            userId: null,
            isLoading: false, 
            error: "Sessão não encontrada" 
          }));
          return;
        }

        // 2. Check for valid cached data first
        const cachedData = localStorage.getItem("user_session_cache");
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const isExpired = Date.now() - parsed.timestamp > parsed.expires_in;
            
            if (!isExpired && parsed.userId === userId) {
              console.log("[useUserSession] Using cached data:", parsed);
              setSessionData({
                userName: parsed.userName,
                companyName: parsed.companyName,
                userId: parsed.userId,
                tipo_simulacao: parsed.tipo_simulacao,
                isLoading: false,
                error: null
              });
              return;
            } else {
              console.log("[useUserSession] Cache expired or invalid, fetching fresh data");
              localStorage.removeItem("user_session_cache");
            }
          } catch (error) {
            console.warn("[useUserSession] Error parsing cached data:", error);
            localStorage.removeItem("user_session_cache");
          }
        }

        console.log("[useUserSession] Loading fresh user session for userId:", userId);

        // 3. Fetch fresh data from API
        const userData = await userService.getUserById(userId, userId);
        console.log("[useUserSession] User data received:", userData);

        const userName = userData.nome || "Usuário";
        const empresaId = userData.empresa_id;

        // If no company ID, use partial data
        if (!empresaId) {
          const sessionData = {
            userName,
            companyName: userData.empresa || "Empresa",
            userId,
            tipo_simulacao: null,
            isLoading: false,
            error: null
          };
          
          // Cache the data
          const cacheData = {
            ...sessionData,
            timestamp: Date.now(),
            expires_in: 60 * 60 * 1000 // 1 hour
          };
          localStorage.setItem("user_session_cache", JSON.stringify(cacheData));
          sessionStorage.setItem("user_name", sessionData.userName);
          sessionStorage.setItem("company_name", sessionData.companyName);
          
          setSessionData(sessionData);
          return;
        }

        // 4. Fetch company details
        const empresaData = await empresaService.getEmpresaById(empresaId, userId);
        console.log("[useUserSession] Company data received:", empresaData);

        const companyName = empresaData.nome || "Empresa";
        const tipoSimulacao = empresaData.tipo_simulacao || null;

        const sessionData = {
          userName,
          companyName,
          userId,
          tipo_simulacao: tipoSimulacao,
          isLoading: false,
          error: null
        };

        // 5. Cache the fresh data
        const cacheData = {
          ...sessionData,
          timestamp: Date.now(),
          expires_in: 60 * 60 * 1000 // 1 hour
        };
        localStorage.setItem("user_session_cache", JSON.stringify(cacheData));
        sessionStorage.setItem("user_name", userName);
        sessionStorage.setItem("company_name", companyName);

        setSessionData(sessionData);

      } catch (error) {
        console.error("[useUserSession] Error loading user session:", error);
        
        // Fallback: try to use data from sessionStorage if there's an API error
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

  useEffect(() => {
    loadUserSession();
  }, []);

  return { ...sessionData, refreshSession };
};
