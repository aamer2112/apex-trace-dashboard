import { createContext, useContext, useState, ReactNode } from "react";

interface BagContextType {
  selectedBagId: string;
  setSelectedBagId: (id: string) => void;
}

const BagContext = createContext<BagContextType | undefined>(undefined);

export const BagProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBagId, setSelectedBagId] = useState("1");

  return (
    <BagContext.Provider value={{ selectedBagId, setSelectedBagId }}>
      {children}
    </BagContext.Provider>
  );
};

export const useBag = () => {
  const context = useContext(BagContext);
  if (!context) {
    throw new Error("useBag must be used within BagProvider");
  }
  return context;
};
