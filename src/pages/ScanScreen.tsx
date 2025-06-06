import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePdv, Product } from "@/context/PdvContext";
import { ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import { consultaFluxoService } from "@/services/consultaFluxoService";

const ScanScreen = () => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    addToCart,
    findProductByBarcode,
    cart,
    totalAmount,
    setInitialCart
  } = usePdv();
  
  // API integration states
  const [apiSlug, setApiSlug] = useState<string | null>(null);
  const [apiData, setApiData] = useState<{
    request_servico?: string;
    response_servico_anterior?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Determine the source page from the URL query parameter
  const from = new URLSearchParams(location.search).get('from');
  // Set the appropriate slug based on the source page
  const detailSlug = from === 'telefone' ? 'RLICELLRLIFUND' : 'RLIINFORLIFUND';
  
  // Fetch initial slug with stored CPF
  useEffect(() => {
    const fetchSlug = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          navigate('/cpf');
          return;
        }
        
        const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIFUND');
        if (data && data.SLUG) {
          setApiSlug(data.SLUG);
          console.log("API Slug fetched:", data.SLUG);
        } else {
          console.error("No SLUG in response:", data);
        }
      } catch (error) {
        console.error("Error fetching slug:", error);
      }
    };
    
    fetchSlug();
  }, [navigate]);
  
  // Fetch API data with the dynamic slug based on the source page
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        setIsLoading(true);
        // Use the dynamic slug determined from the source page
        console.log(`Fetching flow details with slug: ${detailSlug}`);
        
        const data = await consultaFluxoService.consultarFluxoDetalhe(detailSlug);
        setApiData(data);
      } catch (error) {
        console.error("Error fetching API data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiData();
  }, [detailSlug]);

  // Handle payment button click
  const handlePaymentClick = async () => {
    try {
      setIsProcessingPayment(true);
      // Get CPF from localStorage
      const cpf = localStorage.getItem('cpfDigitado');
      
      if (!cpf) {
        console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
        navigate('/cpf');
        return;
      }
      
      console.log("Checking for Dotz benefits...");
      const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIFUND');
      console.log("Payment benefits check response:", data);
      
      if (data.possui_dotz === true) {
        // If user has Dotz points, redirect to interest page
        navigate('/interesse_pagamento');
      } else {
        // If no Dotz points, do nothing for now
        console.log("User has no Dotz points. No action taken.");
      }
    } catch (error) {
      console.error("Error processing payment check:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Preencher com produtos mockados iniciais ao carregar a tela
  useEffect(() => {
    // Produtos mockados conforme solicitado
    const mockProducts = [{
      id: '1',
      name: 'Deo Aero Suave Men 200ml',
      price: 9.99,
      barcode: '7891000315507',
      quantity: 2
    }, {
      id: '2',
      name: 'AmacConfort Brisa 1L',
      price: 14.00,
      barcode: '7891008086697',
      quantity: 1
    }, {
      id: '3',
      name: 'Sabão Líquido Ba 300ml',
      price: 6.99,
      barcode: '7896002301428',
      quantity: 5
    }];

    // Configurar o último item escaneado como o último da lista
    setLastScanned(mockProducts[mockProducts.length - 1]);

    // Definir o carrinho inicial com os produtos mockados
    setInitialCart(mockProducts);
  }, [setInitialCart]);
  
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

  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";
    
    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ');
  };
  
  // Função para formatar valor em reais
  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace(".", ",");
  };
  
  return <PdvLayout className="p-0 overflow-hidden" apiCall={{
    endpoint: "/api/products/{barcode}",
    method: "GET",
    description: "Este endpoint busca informações do produto pelo código de barras."
  }}>
      {/* Header com nome do cliente e promoção */}
      <div className="bg-dotz-laranja text-white p-4 flex justify-between items-center">
        <div className="font-medium">Manoel, R$3 à R$1000 em opções de pagamento</div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">A</div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">B</div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">C</div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">D</div>
        </div>
      </div>

      <div className="flex h-[calc(100%-10rem)]">
        {/* Lado esquerdo - Lista de produtos */}
        <div className="w-2/3 p-4 border-r">
          <div className="mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Nome</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Qtde.</TableHead>
                  <TableHead className="text-right">Total(R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map(item => <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price * (item.quantity || 1))}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Lado direito - Detalhes do último item */}
        <div className="w-1/3 flex flex-col">
          {/* Logo */}
          <div className="text-center p-4">
            
          </div>

          {/* Último item escaneado */}
          <div className="bg-dotz-laranja text-white p-4 text-center">
            <div>EAN</div>
            <div className="font-bold">Nome último Produto</div>
          </div>

          <div className="p-4 flex-1">
            {lastScanned ? <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="text-gray-600">Preço</div>
                  <div className="font-bold">{formatCurrency(lastScanned.price)}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-gray-600">Quantidade</div>
                  <div className="font-bold">{lastScanned.quantity || 1}</div>
                </div>
                <div className="flex justify-between">
                  <div className="text-gray-600">Total do item (R$)</div>
                  <div className="font-bold">{formatCurrency((lastScanned.quantity || 1) * lastScanned.price)}</div>
                </div>
              </div> : <div className="text-center text-gray-400 py-6">
                <ShoppingCart className="mx-auto mb-2" />
                <div>Nenhum produto escaneado</div>
              </div>}
          </div>

          {/* Botão de pagamento */}
          <div 
            onClick={handlePaymentClick}
            className={`bg-emerald-500 text-white p-4 text-center font-bold cursor-pointer ${isProcessingPayment ? 'opacity-70' : 'hover:bg-emerald-600'}`}
          >
            {isProcessingPayment ? "PROCESSANDO..." : "PAGAMENTO"}
          </div>
        </div>
      </div>

      {/* Footer com total e campos de scan */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2 flex-1">
            <Input value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite ou escaneie o código de barras" className="text-lg" disabled={scanning} />
            <Button onClick={handleScan} disabled={scanning || !barcode} className="bg-dotz-laranja hover:bg-dotz-laranja/90">
              Ler
            </Button>
          </div>
          <div className="bg-dotz-laranja text-white px-6 py-2 flex items-center ml-2">
            <div className="mr-4">Total(R$):</div>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        {scanning && <div className="text-center p-4 mb-4 bg-blue-50 rounded-md">
            <div className="animate-pulse">Escaneando...</div>
          </div>}
          
        {/* Replace the old Collapsible sections with the TechnicalDocumentation component */}
        <TechnicalDocumentation
          requestData={apiData.request_servico}
          responseData={apiData.response_servico_anterior}
          isLoading={isLoading}
          slug={detailSlug}
        />
      </div>
    </PdvLayout>;
};

export default ScanScreen;
