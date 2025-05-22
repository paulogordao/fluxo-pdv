
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PdvProvider } from "@/context/PdvContext";
import { PaymentOptionProvider } from "@/context/PaymentOptionContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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
              <Route path="/" element={<Index />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PaymentOptionProvider>
      </PdvProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
