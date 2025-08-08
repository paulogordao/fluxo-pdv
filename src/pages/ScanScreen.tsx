import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePdv, Product } from "@/context/PdvContext";
import { ShoppingCart, Loader2, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TechnicalFooter from "@/components/TechnicalFooter";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { buscarProdutosFakes } from "@/services/produtoService";
import { useToast } from "@/hooks/use-toast";

const ScanScreen = () => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
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
  
  // Check simulation type from localStorage
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  
  // Fake products state
  const [fakeProducts, setFakeProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  
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

  // Check simulation type and initialize cart accordingly
  useEffect(() => {
    const tipoSimulacao = localStorage.getItem('tipo_simulacao') || 'OFFLINE';
    const isOnline = tipoSimulacao !== 'OFFLINE';
    setIsOnlineMode(isOnline);
    
    console.log(`ScanScreen modo: ${isOnline ? 'ONLINE' : 'OFFLINE'} (tipo_simulacao: ${tipoSimulacao})`);
    
    if (isOnline) {
      // ONLINE mode: start with empty data and load fake products
      setLastScanned(null);
      setInitialCart([]);
      console.log('Modo ONLINE: iniciando com dados vazios');
      
      // Load fake products for online mode
      loadFakeProducts();
    } else {
      // OFFLINE mode: use mock data
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
      console.log('Modo OFFLINE: iniciando com dados mockados');
    }
  }, []); // Removido [setInitialCart] para evitar loop infinito

  // Load fake products from API
  const loadFakeProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const products = await buscarProdutosFakes();
      setFakeProducts(products);
      console.log('Produtos fake carregados:', products);
    } catch (error) {
      console.error('Erro ao carregar produtos fake:', error);
      setProductsError('Erro ao carregar produtos');
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Add product to cart from fake products list
  const handleAddProductToCart = (product: Product) => {
    addToCart(product);
    setLastScanned(product);
    console.log('Produto adicionado ao carrinho via lista:', product);
  };
  
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
        {/* Coluna 1: Produtos Disponíveis (só no modo online) */}
        {isOnlineMode && (
          <div className="w-1/4 p-4 border-r">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Produtos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)] overflow-y-auto p-3">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Carregando...</span>
                  </div>
                ) : productsError ? (
                  <div className="flex items-center justify-center h-full text-red-500 text-sm text-center">
                    {productsError}
                  </div>
                ) : fakeProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center">
                    Nenhum produto disponível
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fakeProducts.map((product) => (
                      <div key={product.id} className="p-2 border rounded hover:bg-gray-50">
                        <div className="font-medium text-xs mb-1 truncate" title={product.name}>
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddProductToCart(product)}
                          className="w-full h-6 text-xs"
                        >
                          <Plus className="h-2 w-2 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coluna 2: Carrinho PDV */}
        <div className={`${isOnlineMode ? 'w-1/2' : 'w-3/4'} p-6 border-r`}>
          <div className="h-full">
            <h3 className="text-lg font-semibold mb-4">Carrinho PDV</h3>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5 font-semibold">Nome do Produto</TableHead>
                    <TableHead className="text-right w-1/5 font-semibold">Preço</TableHead>
                    <TableHead className="text-center w-1/5 font-semibold">Qtde.</TableHead>
                    <TableHead className="text-right w-1/5 font-semibold">Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <div>Nenhum produto no carrinho</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map(item => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium py-3">{item.name}</TableCell>
                        <TableCell className="text-right py-3">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-center py-3">{item.quantity}</TableCell>
                        <TableCell className="text-right font-semibold py-3">{formatCurrency(item.price * (item.quantity || 1))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Coluna 3: Detalhes do último item e pagamento */}
        <div className={`${isOnlineMode ? 'w-1/4' : 'w-1/4'} flex flex-col`}>
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
      <div className="bg-white border-t p-4 pb-16">
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
      </div>

      {/* Technical Footer Component */}
      <TechnicalFooter
        requestData={apiData.request_servico}
        responseData={apiData.response_servico_anterior}
        isLoading={isLoading}
        slug={detailSlug}
      />
    </PdvLayout>;
};

export default ScanScreen;
