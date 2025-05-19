import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

const CpfScreen = () => {
  const [cpf, setCpf] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyPress = (value: string) => {
    if (value === "CLEAR") {
      setCpf("");
    } else if (value === "BACKSPACE") {
      setCpf(prev => prev.slice(0, -1));
    } else if (cpf.length < 11) {
      setCpf(prev => prev + value);
    }
  };

  const handleSubmit = () => {
    console.log(`Cliente identificado com CPF: ${formatCPF(cpf)}`);
    // Keeping the navigation commented out as per constraints
    // navigate('/scan');
  };

  const formatCPF = (value: string) => {
    if (!value) return "";
    
    value = value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const NumPad = () => {
    const keys = [
      ["7", "8", "9"],
      ["4", "5", "6"],
      ["1", "2", "3"],
      ["BACKSPACE", "0", "ENTER"]
    ];

    return (
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
        {keys.flat().map((key) => {
          if (key === "BACKSPACE") {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 bg-gray-200 hover:bg-gray-300 text-black"
                onClick={() => handleKeyPress("BACKSPACE")}
              >
                ←
              </Button>
            );
          } else if (key === "ENTER") {
            return (
              <Button
                key={key}
                className="h-16 bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                disabled={cpf.length !== 11}
                onClick={handleSubmit}
              >
                ENTRA
              </Button>
            );
          } else {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 text-xl font-medium bg-white hover:bg-gray-100"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </Button>
            );
          }
        })}
      </div>
    );
  };

  return (
    <PdvLayout className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-md p-6 flex flex-col items-center">
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Informe seu CPF</h2>
          <Input
            className="text-center text-xl h-14 mb-6"
            value={formatCPF(cpf)}
            readOnly
            placeholder="Digite seu CPF"
          />
          <NumPad />
        </div>
      </Card>

      <div className="mt-8 w-full max-w-3xl">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="w-full border border-gray-200 rounded-md shadow overflow-hidden"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
            <span>Exibir chamada à API</span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-3 bg-white">
              <h3 className="text-lg font-semibold mb-2">Request Body</h3>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                <div className="flex gap-2">
                  <span className="text-green-600 font-bold">POST</span>
                  <span className="text-dotz-laranja">/RLIINFO</span>
                </div>
                <p className="mt-2 text-gray-600">Este endpoint identifica o cliente utilizando o CPF informado.</p>
                
                <pre className="mt-4 whitespace-pre-wrap text-xs p-4 bg-gray-100 rounded border overflow-x-auto">
{`curl --location 'https://uat-loyalty.dotznext.com/integration-router/api/default/v1/command' \\
--header 'id: [CNPJ]' \\
--header 'Authorization: [BASIC]' \\
--header 'Content-Type: application/json' \\
--data '{
  "data": {
    "route": "RLIINFO",
    "version": 1,
    "input": {
      "customer_info_id": "00911804064",
      "customer_info_id_type": 1,
      "employee_id": "284538",
      "pos_id": "228",
      "order_id": "11957"
    }
  }
}'`}
                </pre>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </PdvLayout>
  );
};

export default CpfScreen;
