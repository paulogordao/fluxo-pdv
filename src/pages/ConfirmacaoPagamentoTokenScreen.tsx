
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";

const ConfirmacaoPagamentoTokenScreen = () => {
  const [tokenDigits, setTokenDigits] = useState<string[]>([]);
  const navigate = useNavigate();

  // Handle number input
  const handleNumberClick = (num: string) => {
    if (tokenDigits.length < 6) {
      setTokenDigits((prev) => [...prev, num]);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (tokenDigits.length > 0) {
      setTokenDigits((prev) => prev.slice(0, -1));
    }
  };

  // Handle enter button
  const handleEnter = () => {
    if (tokenDigits.length === 6) {
      // For now, just navigate to confirmation page as a placeholder
      // This will be updated in the next phase
      navigate("/confirmacao_pagamento");
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate("/meios_de_pagamento");
  };

  // Check if enter button should be enabled
  const isEnterEnabled = tokenDigits.length === 6;

  return (
    <PdvLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-dotz-laranja text-white">
          <CardTitle className="text-center">
            Pagamento Cliente A
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Aguardando pagamento com Token no APP Cliente A
            </h3>
            
            {/* Display the entered token digits */}
            <div className="flex justify-center gap-2 mb-6">
              {Array(6).fill(0).map((_, index) => (
                <div 
                  key={index}
                  className={`w-10 h-12 border-2 ${
                    index < tokenDigits.length 
                      ? "border-dotz-laranja bg-orange-50" 
                      : "border-gray-300"
                  } rounded flex items-center justify-center text-xl font-bold`}
                >
                  {index < tokenDigits.length ? tokenDigits[index] : ""}
                </div>
              ))}
            </div>
            
            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {/* Row 1: 1, 2, 3 */}
              {[1, 2, 3].map((num) => (
                <Button 
                  key={num}
                  variant="outline" 
                  onClick={() => handleNumberClick(num.toString())} 
                  className="h-14 text-xl shadow-sm"
                >
                  {num}
                </Button>
              ))}
              
              {/* Row 2: 4, 5, 6 */}
              {[4, 5, 6].map((num) => (
                <Button 
                  key={num}
                  variant="outline" 
                  onClick={() => handleNumberClick(num.toString())} 
                  className="h-14 text-xl shadow-sm"
                >
                  {num}
                </Button>
              ))}
              
              {/* Row 3: 7, 8, 9 */}
              {[7, 8, 9].map((num) => (
                <Button 
                  key={num}
                  variant="outline" 
                  onClick={() => handleNumberClick(num.toString())} 
                  className="h-14 text-xl shadow-sm"
                >
                  {num}
                </Button>
              ))}
              
              {/* Row 4: Backspace, 0, Enter */}
              <Button 
                variant="outline" 
                onClick={handleBackspace} 
                className="h-14 text-xl shadow-sm"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("0")} 
                className="h-14 text-xl shadow-sm"
              >
                0
              </Button>
              <Button 
                variant={isEnterEnabled ? "dotz" : "outline"} 
                onClick={handleEnter} 
                disabled={!isEnterEnabled} 
                className="h-14 text-sm font-bold shadow-sm"
              >
                ENTRAR
              </Button>
            </div>

            {/* Cancel button */}
            <div className="mt-8">
              <Button 
                variant="cancel"
                className="w-full sm:w-auto"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PdvLayout>
  );
};

export default ConfirmacaoPagamentoTokenScreen;
