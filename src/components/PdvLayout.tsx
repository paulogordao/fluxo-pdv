
import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import GuiaDeNavegacaoAPI from "./GuiaDeNavegacaoAPI";

interface PdvLayoutProps {
  children: React.ReactNode;
  className?: string;
  apiCall?: {
    endpoint: string;
    method: string;
    description: string;
  };
}

const PdvLayout = ({
  children,
  className
}: PdvLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Card className={cn("w-full h-screen overflow-hidden shadow-lg", className)}>
        {children}
      </Card>

      <div className="mt-4 text-center text-gray-500 text-sm">Simulador PDV - Guia Técnico de Integração</div>
      
      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
    </div>
  );
};

export default PdvLayout;
