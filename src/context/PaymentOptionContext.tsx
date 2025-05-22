
import { createContext, useContext, useState, ReactNode } from "react";

type PaymentOptionType = "app" | "livelo" | "dotz" | "none";

interface PaymentOptionContextType {
  selectedPaymentOption: PaymentOptionType;
  setSelectedPaymentOption: (option: PaymentOptionType) => void;
}

const PaymentOptionContext = createContext<PaymentOptionContextType | undefined>(undefined);

export function PaymentOptionProvider({ children }: { children: ReactNode }) {
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOptionType>("app");

  return (
    <PaymentOptionContext.Provider value={{ selectedPaymentOption, setSelectedPaymentOption }}>
      {children}
    </PaymentOptionContext.Provider>
  );
}

export function usePaymentOption() {
  const context = useContext(PaymentOptionContext);
  if (context === undefined) {
    throw new Error("usePaymentOption must be used within a PaymentOptionProvider");
  }
  return context;
}
