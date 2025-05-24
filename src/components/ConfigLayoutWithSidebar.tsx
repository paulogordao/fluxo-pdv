
import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import GuiaDeNavegacaoAPI from "./GuiaDeNavegacaoAPI";

interface ConfigLayoutWithSidebarProps {
  children: React.ReactNode;
}

const ConfigLayoutWithSidebar = ({ children }: ConfigLayoutWithSidebarProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            <div className="flex items-center p-4 bg-white border-b border-gray-200">
              <SidebarTrigger className="mr-4" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-500 text-sm">
        Simulador PDV - Guia Técnico de Integração
      </div>
      
      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
    </div>
  );
};

export default ConfigLayoutWithSidebar;
