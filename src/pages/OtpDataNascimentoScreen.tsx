import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PdvLayout from "@/components/PdvLayout";
const OtpDataNascimentoScreen = () => {
  const [digits, setDigits] = useState<string[]>([]);
  const navigate = useNavigate();

  // Handle number input
  const handleNumberClick = (num: string) => {
    if (digits.length < 8) {
      setDigits(prev => [...prev, num]);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (digits.length > 0) {
      setDigits(prev => prev.slice(0, -1));
    }
  };

  // Handle enter button
  const handleEnter = () => {
    if (digits.length === 8) {
      // Navigate to next screen or handle confirmation
      // For now, let's navigate back to meios_de_pagamento as a placeholder
      navigate("/confirmacao_pagamento");
    }
  };

  // Format digits to display as DD/MM/YYYY if 8 digits are entered
  const formattedDate = () => {
    if (digits.length === 0) return "";
    const dateString = digits.join("");
    if (digits.length <= 2) {
      return dateString;
    } else if (digits.length <= 4) {
      return `${dateString.substring(0, 2)}/${dateString.substring(2)}`;
    } else {
      return `${dateString.substring(0, 2)}/${dateString.substring(2, 4)}/${dateString.substring(4)}`;
    }
  };

  // Check if enter button should be enabled
  const isEnterEnabled = digits.length === 8;
  return <PdvLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-dotz-laranja text-white">
          <CardTitle className="text-center">
            Pagamento Cliente A
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Digite os 8 dígitos da data de nascimento
            </h3>
            
            {/* Display the entered digits */}
            <div className="bg-white border rounded-md p-4 mb-4 text-xl font-mono min-h-16 flex items-center justify-center">
              {formattedDate() || "DD/MM/YYYY"}
            </div>
            
            
            
            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-4">
              {/* Row 1: 1, 2, 3 */}
              <Button variant="outline" onClick={() => handleNumberClick("1")} className="h-14 text-xl shadow-sm">
                1
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("2")} className="h-14 text-xl shadow-sm">
                2
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("3")} className="h-14 text-xl shadow-sm">
                3
              </Button>
              
              {/* Row 2: 4, 5, 6 */}
              <Button variant="outline" onClick={() => handleNumberClick("4")} className="h-14 text-xl shadow-sm">
                4
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("5")} className="h-14 text-xl shadow-sm">
                5
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("6")} className="h-14 text-xl shadow-sm">
                6
              </Button>
              
              {/* Row 3: 7, 8, 9 */}
              <Button variant="outline" onClick={() => handleNumberClick("7")} className="h-14 text-xl shadow-sm">
                7
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("8")} className="h-14 text-xl shadow-sm">
                8
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("9")} className="h-14 text-xl shadow-sm">
                9
              </Button>
              
              {/* Row 4: Backspace, 0, Enter */}
              <Button variant="outline" onClick={handleBackspace} className="h-14 text-xl shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={() => handleNumberClick("0")} className="h-14 text-xl shadow-sm">
                0
              </Button>
              <Button variant={isEnterEnabled ? "dotz" : "outline"} onClick={handleEnter} disabled={!isEnterEnabled} className="h-14 text-sm font-bold shadow-sm">
                ENTRA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PdvLayout>;
};
export default OtpDataNascimentoScreen;