
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PdvProvider } from "@/context/PdvContext";
import { PaymentOptionProvider } from "@/context/PaymentOptionContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginScreen from "./pages/LoginScreen";
import PrimeiroAcessoScreen from "./pages/PrimeiroAcessoScreen";
import WelcomeScreen from "./pages/WelcomeScreen";
import StartScreen from "./pages/StartScreen";
import ScanScreen from "./pages/ScanScreen";
import CpfScreen from "./pages/CpfScreen";
import TelefoneScreen from "./pages/TelefoneScreen";
import TransicaoCadastroScreen from "./pages/TransicaoCadastroScreen";
import InteressePagamentoScreen from "./pages/InteressePagamentoScreen";
import MeiosDePagamentoScreen from "./pages/MeiosDePagamentoScreen";
import OtpDataNascimentoScreen from "./pages/OtpDataNascimentoScreen";
import ConfirmacaoPagamentoAppScreen from "./pages/ConfirmacaoPagamentoAppScreen";
import ConfirmacaoPagamentoScreen from "./pages/ConfirmacaoPagamentoScreen";
import ConfirmacaoPagamentoTokenScreen from "./pages/ConfirmacaoPagamentoTokenScreen";
import ConfigHomeScreen from "./pages/ConfigHomeScreen";
import CadastroEmpresaScreen from "./pages/CadastroEmpresaScreen";
import ConfigEmpresaScreen from "./pages/ConfigEmpresaScreen";
import ConfigEmpresaEditarScreen from "./pages/ConfigEmpresaEditarScreen";
import ConfigEmpresaEditScreen from "./pages/ConfigEmpresaEditScreen";
import ConfigUsuarioEditScreen from "./pages/ConfigUsuarioEditScreen";
import ConfigUsuarioEditIndividualScreen from "./pages/ConfigUsuarioEditIndividualScreen";
import ConfigUsuarioNovoScreen from "./pages/ConfigUsuarioNovoScreen";
import ConfigUsuariosTesteScreen from "./pages/ConfigUsuariosTesteScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PdvProvider>
        <PaymentOptionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/primeiro_acesso" element={<PrimeiroAcessoScreen />} />
              <Route path="/index" element={<Index />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/start" element={<StartScreen />} />
              <Route path="/cpf" element={<CpfScreen />} />
              <Route path="/telefone" element={<TelefoneScreen />} />
              <Route path="/transicao-cadastro" element={<TransicaoCadastroScreen />} />
              <Route path="/scan" element={<ScanScreen />} />
              <Route path="/interesse_pagamento" element={<InteressePagamentoScreen />} />
              <Route path="/meios_de_pagamento" element={<MeiosDePagamentoScreen />} />
              <Route path="/otp_data_nascimento" element={<OtpDataNascimentoScreen />} />
              <Route path="/confirmacao_pagamento_app" element={<ConfirmacaoPagamentoAppScreen />} />
              <Route path="/confirmacao_pagamento" element={<ConfirmacaoPagamentoScreen />} />
              <Route path="/confirmacao_pagamento_token" element={<ConfirmacaoPagamentoTokenScreen />} />
              <Route path="/configuracoes" element={<ConfigHomeScreen />} />
              <Route path="/configuracoes/empresa" element={<CadastroEmpresaScreen />} />
              <Route path="/config_empresa" element={<ConfigEmpresaScreen />} />
              <Route path="/config_empresa_list" element={<ConfigEmpresaEditarScreen />} />
              <Route path="/config_empresa_edit/:id" element={<ConfigEmpresaEditScreen />} />
              <Route path="/config_usuario_edit" element={<ConfigUsuarioEditScreen />} />
              <Route path="/config_usuario_edit_individual/:id" element={<ConfigUsuarioEditIndividualScreen />} />
              <Route path="/config_usuario_novo" element={<ConfigUsuarioNovoScreen />} />
              <Route path="/config_usuarios_teste" element={<ConfigUsuariosTesteScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PaymentOptionProvider>
      </PdvProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
