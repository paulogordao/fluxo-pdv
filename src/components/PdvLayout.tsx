
import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className={cn("w-full max-w-3xl min-h-[500px] p-6 shadow-lg", className)}>
        {children}
      </Card>

      <div className="mt-4 text-center text-gray-500 text-sm">
        /RLIINFO
      </div>
    </div>;
};

export default PdvLayout;
