
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { empresaService } from '@/services/empresaService';
import { credentialsService } from '@/services/credentialsService';

interface UserSessionData {
  userName: string;
  companyName: string;
  userId: string | null;
  empresaId: string | null;
  userEmail: string | null;
  userUsername: string | null;
  tipo_simulacao: string | null;
  ambiente: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserSession = () => {
  const [sessionData, setSessionData] = useState<UserSessionData>({
    userName: "Usuário",
    companyName: "Empresa",
    userId: null,
    empresaId: null,
    userEmail: null,
    userUsername: null,
    tipo_simulacao: null,
    ambiente: null,
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
            
            // Validate if cache has all required fields (including new fields like 'ambiente')
            const hasRequiredFields = 
              typeof parsed.userName === 'string' &&
              typeof parsed.companyName === 'string' &&
              typeof parsed.userId === 'string' &&
              'ambiente' in parsed; // Verifica se o campo existe (mesmo que seja null)
            
            if (!hasRequiredFields) {
              console.log("[useUserSession] Cache is missing required fields (possibly 'ambiente'), invalidating cache");
              localStorage.removeItem("user_session_cache");
            } else if (!isExpired && parsed.userId === userId) {
              console.log("[useUserSession] Using cached data:", parsed);
              setSessionData({
                userName: parsed.userName,
                companyName: parsed.companyName,
                userId: parsed.userId,
                empresaId: parsed.empresaId || null,
                userEmail: parsed.userEmail || null,
                userUsername: parsed.userUsername || null,
                tipo_simulacao: parsed.tipo_simulacao,
                ambiente: parsed.ambiente || null,
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
        const userEmail = userData.email || "";
        const userUsername = userData.usuario || "";

        // If no company ID, use partial data
        if (!empresaId) {
          const sessionData = {
            userName,
            companyName: userData.empresa || "Empresa",
            userId,
            empresaId: null,
            userEmail,
            userUsername,
            tipo_simulacao: null,
            ambiente: null,
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

        // 5. Fetch credential environment directly by user
        let ambiente: string | null = null;
        try {
          const credentialData = await credentialsService.getCredentialByUser();
          console.log("[useUserSession] Credential data from user endpoint:", credentialData);
          
          // Map API values to internal values
          // API returns: "prod" or "homolog"
          // Internal: "producao" or "homologacao"
          if (credentialData.ambiente === "prod") {
            ambiente = "producao";
          } else if (credentialData.ambiente === "homolog") {
            ambiente = "homologacao";
          } else {
            ambiente = null;
          }
          
          console.log("[useUserSession] Mapped environment:", ambiente);
        } catch (error) {
          console.warn("[useUserSession] Failed to fetch credential by user:", error);
          ambiente = null;
        }

        const sessionData = {
          userName,
          companyName,
          userId,
          empresaId,
          userEmail,
          userUsername,
          tipo_simulacao: tipoSimulacao,
          ambiente,
          isLoading: false,
          error: null
        };

        // 6. Cache the fresh data
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
            empresaId: null,
            userEmail: null,
            userUsername: null,
            tipo_simulacao: null,
            ambiente: null,
            isLoading: false,
            error: null
          });
        } else {
          setSessionData(prev => ({
            ...prev,
            userId,
            empresaId: null,
            userEmail: null,
            userUsername: null,
            tipo_simulacao: null,
            ambiente: null,
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
