
import { useState } from "react";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePdv, Product } from "@/context/PdvContext";
import { Check } from "lucide-react";

const ScanScreen = () => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const { addToCart, findProductByBarcode, cart, totalAmount } = usePdv();

  const handleScan = () => {
    if (!barcode) return;
    
    setScanning(true);
    
    // Simular um pequeno atraso como aconteceria em um ambiente real
    setTimeout(() => {
      console.log(`API Call: GET /api/products/${barcode} - Buscando produto pelo código de barras`);
      const product = findProductByBarcode(barcode);
      
      if (product) {
        addToCart(product);
        setLastScanned(product);
        console.log(`Produto encontrado: ${product.name}`);
      } else {
        console.log("Produto não encontrado");
      }
      
      setBarcode("");
      setScanning(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  return (
    <PdvLayout
      className="flex flex-col"
      apiCall={{
        endpoint: "/api/products/{barcode}",
        method: "GET",
        description: "Este endpoint busca informações do produto pelo código de barras."
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leitura de Produtos</h1>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">
            R$ {totalAmount.toFixed(2).replace(".", ",")}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite ou escaneie o código de barras"
          className="text-lg"
          disabled={scanning}
        />
        <Button 
          onClick={handleScan} 
          disabled={scanning || !barcode}
          className="bg-dotz-laranja hover:bg-dotz-laranja/90"
        >
          Ler
        </Button>
      </div>

      {scanning && (
        <div className="text-center p-4 mb-4 bg-blue-50 rounded-md">
          <div className="animate-pulse">Escaneando...</div>
        </div>
      )}

      {lastScanned && (
        <div className="border-2 border-green-500 rounded-md p-4 mb-6 flex items-center bg-green-50">
          <div className="bg-green-100 rounded-full p-2 mr-4">
            <Check className="text-green-600 h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{lastScanned.name}</div>
            <div>R$ {lastScanned.price.toFixed(2).replace(".", ",")}</div>
          </div>
          <div className="text-2xl font-bold">+1</div>
        </div>
      )}

      <div className="flex-1 overflow-auto mb-6">
        <div className="text-lg font-medium mb-2">Produtos ({cart.length})</div>
        {cart.length > 0 ? (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <div>{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} x R$ {item.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>
                <div className="font-medium">
                  R$ {((item.quantity || 1) * item.price).toFixed(2).replace(".", ",")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            Nenhum produto escaneado ainda
          </div>
        )}
      </div>
      
      <div className="border-t pt-4 mt-auto">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="lg">
            Voltar
          </Button>
          <Button 
            size="lg" 
            disabled={cart.length === 0}
            className="bg-dotz-laranja hover:bg-dotz-laranja/90"
          >
            Finalizar compra
          </Button>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          <p>
            Dev Notes: Para cada produto escaneado, uma chamada à API é feita para buscar informações
            e outra para adicioná-lo ao carrinho.
          </p>
        </div>
      </div>
    </PdvLayout>
  );
};

export default ScanScreen;
