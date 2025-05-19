
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
  className,
  apiCall
}: PdvLayoutProps) => {
  return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className={cn("w-full max-w-3xl min-h-[500px] p-6 shadow-lg", className)}>
        {children}
      </Card>
      
      {apiCall && <div className="mt-8 w-full max-w-3xl bg-white p-4 rounded-md shadow border-l-4 border-dotz-laranja">
          <h3 className="text-lg font-semibold mb-2">Request Body</h3>
          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
            <div className="flex gap-2">
              <span className="text-green-600 font-bold">{apiCall.method}</span>
              <span className="text-dotz-laranja">{apiCall.endpoint}</span>
            </div>
            <p className="mt-2 text-gray-600">{apiCall.description}</p>
          </div>
        </div>}

      <div className="mt-4 text-center text-gray-500 text-sm">
        <span className="text-dotz-laranja">RLIINFO</span>
      </div>
    </div>;
};
export default PdvLayout;
