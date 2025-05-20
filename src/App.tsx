
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PdvProvider } from "@/context/PdvContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WelcomeScreen from "./pages/WelcomeScreen";
import StartScreen from "./pages/StartScreen";
import ScanScreen from "./pages/ScanScreen";
import CpfScreen from "./pages/CpfScreen";
import TelefoneScreen from "./pages/TelefoneScreen";
import TransicaoCadastroScreen from "./pages/TransicaoCadastroScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PdvProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/start" element={<StartScreen />} />
            <Route path="/cpf" element={<CpfScreen />} />
            <Route path="/telefone" element={<TelefoneScreen />} />
            <Route path="/transicao-cadastro" element={<TransicaoCadastroScreen />} />
            <Route path="/scan" element={<ScanScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PdvProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
