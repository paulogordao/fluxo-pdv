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
import { comandoService, RlifundItem, RlidealOrderItem, RlifundApiError } from "@/services/comandoService";
import ErrorModal from "@/components/ErrorModal";
import DotzBenefitsModal from "@/components/DotzBenefitsModal";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { buscarProdutosFakes, type FakeProduct } from '@/services/produtoService';
import { useFakeProducts } from '@/hooks/useFakeProducts';
import { useToast } from "@/hooks/use-toast";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";

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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    message: string;
    fullRequest?: any;
    fullResponse?: any;
  } | null>(null);
  
  const [showDotzPaymentModal, setShowDotzPaymentModal] = useState(false);
  
  // Check simulation type from localStorage
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  
  // Fake products with intelligent caching
  const { fakeProducts, isLoadingProducts, productsError } = useFakeProducts();
  
  // Technical documentation states
  const [technicalRequestData, setTechnicalRequestData] = useState<string | undefined>();
  const [technicalResponseData, setTechnicalResponseData] = useState<string | undefined>();
  const [technicalPreviousRequestData, setTechnicalPreviousRequestData] = useState<string | undefined>();
  
  // Previous response state for technical documentation
  const [previousResponse, setPreviousResponse] = useState<any>(null);
  const [headerContent, setHeaderContent] = useState<string>("Carregando...");
  
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

  // Load technical documentation data
  useEffect(() => {
    try {
      if (from === 'telefone') {
        // Coming from telefone screen - get RLICELL response
        const rlicellData = localStorage.getItem('rlicellResponse');
        if (rlicellData) {
          const parsedData = JSON.parse(rlicellData);
          setPreviousResponse(parsedData);
          
          // Extract data for technical documentation
          if (Array.isArray(parsedData) && parsedData[0]) {
            // Previous request (RLICELL)
            if (parsedData[0].request) {
              setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
            }
            // Previous response (RLICELL)  
            if (parsedData[0].response) {
              setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
            }
          }
          
          // Extract header content from response
          if (parsedData && Array.isArray(parsedData) && parsedData[0]?.response?.data?.message?.content) {
            setHeaderContent(parsedData[0].response.data.message.content);
          } else {
            setHeaderContent("Informações de pagamento disponíveis");
          }
          
          console.log('Previous response from telefone screen loaded:', parsedData);
        }
      } else {
        // Coming from cpf screen - get RLIINFO response
        const onlineData = localStorage.getItem('onlineResponse');
        if (onlineData) {
          const parsedData = JSON.parse(onlineData);
          setPreviousResponse(parsedData);
          
          // Extract data for technical documentation
          if (Array.isArray(parsedData) && parsedData[0]) {
            // Previous request (RLIINFO)
            if (parsedData[0].request) {
              setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
            }
            // Previous response (RLIINFO)
            if (parsedData[0].response) {
              setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
            }
          }
          
          // Extract header content from response
          if (parsedData && Array.isArray(parsedData) && parsedData[0]?.response?.data?.message?.content) {
            setHeaderContent(parsedData[0].response.data.message.content);
          } else {
            setHeaderContent("Informações de pagamento disponíveis");
          }
          
          console.log('Previous response from cpf screen loaded:', parsedData);
        }
      }
      
      // Generate current RLIFUND request
      generateCurrentRequest();
    } catch (error) {
      console.error('Error loading previous response from localStorage:', error);
      setHeaderContent("Informações de pagamento disponíveis");
    }
  }, [from, cart, totalAmount]);

  // Generate current RLIFUND request for technical documentation
  const generateCurrentRequest = () => {
    try {
      const transactionId = localStorage.getItem('transactionId');
      if (!transactionId) return;

      const currentRequest = {
        route: "RLIFUND",
        version: 1,
        input: {
          transaction_id: transactionId,
          payment_option_type: "default",
          order: {
            value: parseFloat(totalAmount.toFixed(2)),
            discount: 0,
            date: new Date().toISOString(),
            items: cart.map(product => ({
              ean: product.barcode,
              sku: product.id,
              unit_price: product.price,
              discount: 0,
              quantity: product.quantity || 1,
              name: product.name,
              unit_type: "UN",
              brand: "Unknown",
              manufacturer: "Unknown",
              categories: ["groceries"],
              gross_profit_amount: Math.max(product.price * 0.1, 0.01),
              is_private_label: false,
              is_on_sale: false
            }))
          }
        }
      };

      setTechnicalRequestData(JSON.stringify(currentRequest, null, 2));
    } catch (error) {
      console.error('Error generating current request:', error);
    }
  };

  // Handle payment button click
  const handlePaymentClick = async () => {
    // Validate cart has products before processing payment
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um produto ao carrinho para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      if (isOnlineMode) {
        // Check simulation type to determine which command to use
        const tipoSimulacao = localStorage.getItem('tipo_simulacao');
        
        if (tipoSimulacao === "UAT - Versão 1") {
          // UAT VERSION 1: Use RLIDEAL command
          console.log("[ScanScreen] UAT Versão 1 - using RLIDEAL service");
          
          // Check has_product_dz from RLIINFO response
          const onlineResponse = localStorage.getItem('onlineResponse');
          let hasProductDz = 0;
          
          if (onlineResponse) {
            try {
              const parsedResponse = JSON.parse(onlineResponse);
              hasProductDz = parsedResponse[0]?.response?.data?.has_product_dz || 0;
            } catch (error) {
              console.error("Error parsing onlineResponse:", error);
            }
          }

          // If user has Dotz eligibility, show modal
          if (hasProductDz === 1) {
            setShowDotzPaymentModal(true);
            return; // Wait for modal response
          }
          
          // If no Dotz eligibility, proceed with use_product_dz: 0
          await processRlidealPayment(0);
          
        } else {
          // UAT VERSION 2 OR OTHER: Use RLIFUND service (existing logic)
          console.log("[ScanScreen] UAT Versão 2 ou outro - using RLIFUND service");
        
          // Get transaction ID from localStorage 
          const transactionId = localStorage.getItem('transactionId');
          if (!transactionId) {
            console.error('Transaction ID não encontrado. Redirecionando para identificação.');
            navigate('/cpf');
            return;
          }
          
          // Function to calculate minimum gross profit when the value is 0 or invalid
          const calculateMinimumGrossProfit = (unitPrice: number): number => {
            const minimumMargin = Math.max(unitPrice * 0.1, 0.01); // 10% margin or minimum 0.01
            return parseFloat(minimumMargin.toFixed(2));
          };

          // Map cart items to RLIFUND format
          const rlifundItems: RlifundItem[] = cart.map(product => {
            // Check if product has complete data from fake products API
            const fakeProduct = fakeProducts.find(fp => fp.ean === product.barcode);
            
            if (fakeProduct) {
              // Ensure gross_profit_amount is never 0
              const grossProfitAmount = fakeProduct.gross_profit_amount <= 0 
                ? calculateMinimumGrossProfit(fakeProduct.unit_price)
                : fakeProduct.gross_profit_amount;
                
              if (fakeProduct.gross_profit_amount <= 0) {
                console.log(`[ScanScreen] Corrected gross_profit_amount for ${fakeProduct.name}: ${fakeProduct.gross_profit_amount} -> ${grossProfitAmount}`);
              }
              
              // Use complete data from API
              return {
                ean: fakeProduct.ean,
                sku: fakeProduct.sku,
                unit_price: fakeProduct.unit_price,
                discount: fakeProduct.discount,
                quantity: product.quantity || 1,
                name: fakeProduct.name,
                unit_type: fakeProduct.unit_type,
                brand: fakeProduct.brand || "Unknown",
                manufacturer: fakeProduct.manufacturer || "Unknown",
                categories: fakeProduct.categories,
                gross_profit_amount: grossProfitAmount,
                is_private_label: fakeProduct.is_private_label,
                is_on_sale: fakeProduct.is_on_sale
              };
            } else {
              // Use mock data with defaults for missing fields
              const mockGrossProfit = calculateMinimumGrossProfit(product.price);
              
              return {
                ean: product.barcode,
                sku: product.id,
                unit_price: product.price,
                discount: 0,
                quantity: product.quantity || 1,
                name: product.name,
                unit_type: "UN",
                brand: "Mock",
                manufacturer: "Test",
                categories: ["general"],
                gross_profit_amount: mockGrossProfit,
                is_private_label: false,
                is_on_sale: false
              };
            }
          });
          
          console.log("[ScanScreen] Mapped RLIFUND items:", rlifundItems);
          console.log("[ScanScreen] Total amount:", totalAmount.toString());
          
          // Call RLIFUND service
          const response = await comandoService.enviarComandoRlifund(
            transactionId,
            "default", // payment_option_type
            parseFloat(totalAmount.toFixed(2)).toString(), // value_total - fix decimal precision
            rlifundItems
          );
          
          console.log("[ScanScreen] RLIFUND response:", response);
          
          // Store RLIFUND response in localStorage for technical documentation
          localStorage.setItem('rlifundResponse', JSON.stringify(response));
          
          // Check payment_options in RLIFUND response (inside data object)
          const paymentOptions = response[0]?.response?.data?.payment_options;
          console.log("[ScanScreen] Payment options from RLIFUND:", paymentOptions);
          console.log("[ScanScreen] Full response structure:", JSON.stringify(response[0]?.response, null, 2));
          
          if (Array.isArray(paymentOptions)) {
            if (paymentOptions.length === 0) {
              // payment_options is empty array - go directly to payment confirmation
              console.log("[ScanScreen] payment_options is empty - redirecting to confirmacao_pagamento");
              navigate('/confirmacao_pagamento', { state: { fromScanScreenFund: true } });
            } else {
              // payment_options has content - show interest modal
              console.log("[ScanScreen] payment_options has content - redirecting to interesse_pagamento");
              navigate('/interesse_pagamento');
            }
          } else {
            // Fallback: if payment_options is not an array or missing, check for data presence
            if (response[0]?.response?.data) {
              console.log("[ScanScreen] No payment_options array, but has data - redirecting to interesse_pagamento");
              navigate('/interesse_pagamento');
            } else {
              console.log("[ScanScreen] No specific action defined for RLIFUND response");
            }
          }
        }
        
      } else {
        // OFFLINE MODE: Use original consultaFluxo service
        console.log("[ScanScreen] OFFLINE mode - using consultaFluxo service");
        
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
      }
      
    } catch (error) {
      console.error('Erro no pagamento:', error);
      
      // Tratamento específico para erros da API RLIFUND
      if (error instanceof RlifundApiError) {
        setErrorDetails({
          code: error.errorCode,
          message: error.errorMessage,
          fullRequest: error.fullRequest,
          fullResponse: error.fullResponse
        });
        setShowErrorModal(true);
      } else {
        // Check for timeout errors specifically
        if (error.name === 'AbortError' || error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('tempo limite')) {
          setErrorDetails({
            code: 'TIMEOUT_ERROR',
            message: "Tempo limite da operação excedido. Tente novamente.",
            fullRequest: null,
            fullResponse: null
          });
        } else {
          // Generic error for other types
          setErrorDetails({
            code: 'ERRO_GENERICO',
            message: error instanceof Error ? error.message : "Erro desconhecido",
            fullRequest: null,
            fullResponse: null
          });
        }
        setShowErrorModal(true);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to process RLIDEAL payment with specified use_product_dz
  const processRlidealPayment = async (useProductDz: number) => {
    try {
      // Get transaction ID from localStorage 
      const transactionId = localStorage.getItem('transactionId');
      if (!transactionId) {
        console.error('Transaction ID não encontrado. Redirecionando para identificação.');
        navigate('/cpf');
        return;
      }
      
      // Function to calculate minimum gross profit when the value is 0 or invalid
      const calculateMinimumGrossProfit = (unitPrice: number): number => {
        const minimumMargin = Math.max(unitPrice * 0.1, 0.01); // 10% margin or minimum 0.01
        return parseFloat(minimumMargin.toFixed(2));
      };

      // Map cart items to RLIDEAL format
      const rlidealItems = cart.map(product => {
        // Check if product has complete data from fake products API
        const fakeProduct = fakeProducts.find(fp => fp.ean === product.barcode);
        
        if (fakeProduct) {
          // Ensure gross_profit_amount is never 0
          const grossProfitAmount = fakeProduct.gross_profit_amount <= 0 
            ? calculateMinimumGrossProfit(fakeProduct.unit_price)
            : fakeProduct.gross_profit_amount;
            
          if (fakeProduct.gross_profit_amount <= 0) {
            console.log(`[ScanScreen] Corrected gross_profit_amount for ${fakeProduct.name}: ${fakeProduct.gross_profit_amount} -> ${grossProfitAmount}`);
          }
          
          // Use complete data from API
          return {
            ean: fakeProduct.ean,
            sku: fakeProduct.sku,
            unit_price: fakeProduct.unit_price,
            discount: fakeProduct.discount,
            quantity: product.quantity || 1,
            name: fakeProduct.name,
            unit_type: fakeProduct.unit_type,
            brand: fakeProduct.brand || "Unknown",
            manufacturer: fakeProduct.manufacturer || "Unknown",
            categories: fakeProduct.categories,
            gross_profit_amount: grossProfitAmount,
            is_private_label: fakeProduct.is_private_label,
            is_on_sale: fakeProduct.is_on_sale
          };
        } else {
          // Use mock data with defaults for missing fields
          const mockGrossProfit = calculateMinimumGrossProfit(product.price);
          
          return {
            ean: product.barcode,
            sku: product.id,
            unit_price: product.price,
            discount: 0,
            quantity: product.quantity || 1,
            name: product.name,
            unit_type: "UN",
            brand: "Mock",
            manufacturer: "Test",
            categories: ["general"],
            gross_profit_amount: mockGrossProfit,
            is_private_label: false,
            is_on_sale: false
          };
        }
      });
      
      const orderData = {
        value_total: parseFloat(totalAmount.toFixed(2)),
        discount: 0,
        date: new Date().toISOString(),
        items: rlidealItems
      };
      
      console.log("[ScanScreen] Mapped RLIDEAL items:", rlidealItems);
      console.log("[ScanScreen] Order data:", orderData);
      console.log("[ScanScreen] Using use_product_dz:", useProductDz);
      
      // Call RLIDEAL service for UAT Version 1 with specified use_product_dz
      const response = await comandoService.enviarComandoRlidealUatV1(transactionId, orderData, useProductDz);
      
      console.log("[ScanScreen] RLIDEAL UAT V1 response:", response);
      
      // Store RLIDEAL response in localStorage for technical documentation
      localStorage.setItem('rlidealResponse', JSON.stringify(response));
      
      // Handle response navigation - check next_step first, then fallback to payment_options
      const nextStep = response[0]?.response?.data?.next_step?.[0];
      console.log("[ScanScreen] Next step from RLIDEAL:", nextStep);
      
      if (nextStep?.code === 4) {
        // RLIWAIT - go to app payment confirmation
        console.log("[ScanScreen] next_step is RLIWAIT (code 4) - redirecting to confirmacao_pagamento_app");
        navigate('/confirmacao_pagamento_app', { state: { fromScanScreenIdeal: true } });
        return;
      } else if (nextStep?.code === 6) {
        // RLIPAYS - go directly to payment confirmation
        console.log("[ScanScreen] next_step is RLIPAYS (code 6) - redirecting to confirmacao_pagamento");
        navigate('/confirmacao_pagamento', { state: { fromScanScreenIdeal: true } });
        return;
      } else if (nextStep?.code === 3) {
        // RLIDEAL - continue to payment interest
        console.log("[ScanScreen] next_step is RLIDEAL (code 3) - redirecting to interesse_pagamento");
        navigate('/interesse_pagamento');
        return;
      }
      
      // Fallback: use existing payment_options logic
      const paymentOptions = response[0]?.response?.data?.payment_options;
      console.log("[ScanScreen] Payment options from RLIDEAL:", paymentOptions);
      
      if (Array.isArray(paymentOptions)) {
        if (paymentOptions.length === 0) {
          console.log("[ScanScreen] payment_options is empty - redirecting to confirmacao_pagamento");
          navigate('/confirmacao_pagamento', { state: { fromScanScreenIdeal: true } });
        } else {
          console.log("[ScanScreen] payment_options has content - redirecting to interesse_pagamento");
          navigate('/interesse_pagamento');
        }
      } else {
        if (response[0]?.response?.data) {
          console.log("[ScanScreen] No payment_options array, but has data - redirecting to interesse_pagamento");
          navigate('/interesse_pagamento');
        } else {
          console.log("[ScanScreen] No specific action defined for RLIDEAL response");
        }
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      if (error instanceof RlifundApiError) {
        setErrorDetails({
          code: error.errorCode,
          message: error.errorMessage,
          fullRequest: error.fullRequest,
          fullResponse: error.fullResponse
        });
        setShowErrorModal(true);
      } else {
        // Check for timeout errors specifically
        if (error.name === 'AbortError' || error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('tempo limite')) {
          setErrorDetails({
            code: 'TIMEOUT_ERROR',
            message: "Tempo limite da operação excedido. Tente novamente.",
            fullRequest: null,
            fullResponse: null
          });
        } else {
          // Generic error for other types
          setErrorDetails({
            code: 'ERRO_GENERICO',
            message: error instanceof Error ? error.message : "Erro desconhecido",
            fullRequest: null,
            fullResponse: null
          });
        }
        setShowErrorModal(true);
      }
    }
  };

  // Handle Dotz payment modal responses
  const handleDotzPaymentYes = async () => {
    setShowDotzPaymentModal(false);
    setIsProcessingPayment(true); // Add loading state
    await processRlidealPayment(1); // Use Dotz payment
    setIsProcessingPayment(false);
  };

  const handleDotzPaymentNo = () => {
    setShowDotzPaymentModal(false);
    processRlidealPayment(0); // Don't use Dotz payment
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
      
      // Products will be loaded automatically by useFakeProducts hook
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


  // Add product to cart from fake products list
  const handleAddProductToCart = (fakeProduct: FakeProduct) => {
    // Convert FakeProduct to Product for cart
    const product: Product = {
      id: fakeProduct.ean,
      name: fakeProduct.name,
      price: fakeProduct.unit_price,
      barcode: fakeProduct.ean,
      image: fakeProduct.image,
    };
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
        <div className="font-medium">{headerContent}</div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">A</div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">B</div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">C</div>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">D</div>
          </div>
          <EncerrarAtendimentoButton />
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
                      <div key={product.ean} className="p-2 border rounded hover:bg-gray-50">
                        <div className="font-medium text-xs mb-1 truncate" title={product.name}>
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          R$ {product.unit_price.toFixed(2).replace('.', ',')}
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
            onClick={cart.length > 0 ? handlePaymentClick : undefined}
            className={`p-4 text-center font-bold ${
              cart.length === 0 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60' 
                : `bg-emerald-500 text-white cursor-pointer ${isProcessingPayment ? 'opacity-70' : 'hover:bg-emerald-600'}`
            }`}
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
        requestData={technicalRequestData}
        responseData={technicalResponseData}
        previousRequestData={technicalPreviousRequestData}
        isLoading={isLoading || isProcessingPayment}
        slug={detailSlug}
        loadOnMount={false}
        sourceScreen="scan"
        previousServiceName={from === 'cpf' ? 'RLIINFO' : 'RLICELL'}
      />

      {/* Modal de erro para desenvolvedores */}
      {errorDetails && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => {
            setShowErrorModal(false);
            setErrorDetails(null);
          }}
          onRetry={() => {
            setShowErrorModal(false);
            setErrorDetails(null);
            handlePaymentClick();
          }}
          errorCode={errorDetails.code}
          errorMessage={errorDetails.message}
          fullRequest={errorDetails.fullRequest}
          fullResponse={errorDetails.fullResponse}
        />
      )}

      {/* Modal de pagamento com Dotz */}
      <DotzBenefitsModal
        isOpen={showDotzPaymentModal}
        onUsePoints={handleDotzPaymentYes}
        onSkipPoints={handleDotzPaymentNo}
      />
    </PdvLayout>;
};

export default ScanScreen;
