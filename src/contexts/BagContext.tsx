import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface BagData {
  id: string;
  name: string;
  timestamp: string;
  topics: number;
  duration: string;
  isDemo?: boolean;
}

interface BagContextType {
  selectedBagId: string;
  setSelectedBagId: (id: string) => void;
  bags: BagData[];
  deleteBag: (id: string) => void;
  addBag: (bag: BagData) => void;
  isDemoMode: boolean;
  demoUploadsRemaining: number;
  isAdminLoggedIn: boolean;
  setAdminLoggedIn: (val: boolean) => void;
  selectedTopics: string[];
  setSelectedTopics: (topics: string[]) => void;
}

const defaultBags: BagData[] = [
  { id: "1", name: "skidpad_run_001.db3", timestamp: "Nov 22, 2025 at 14:30", topics: 47, duration: "10:52", isDemo: true },
  { id: "2", name: "autocross_lap_003.db3", timestamp: "Nov 22, 2025 at 11:15", topics: 52, duration: "08:15", isDemo: true },
  { id: "3", name: "endurance_test_045.db3", timestamp: "Nov 21, 2025 at 16:42", topics: 51, duration: "22:08", isDemo: true }
];

const BagContext = createContext<BagContextType | undefined>(undefined);

export const BagProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBagId, setSelectedBagId] = useState("1");
  const [bags, setBags] = useState<BagData[]>(() => {
    const stored = localStorage.getItem("apextrace-bags");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.length > 0 ? parsed : defaultBags;
    }
    return defaultBags;
  });
  const [isAdminLoggedIn, setAdminLoggedIn] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["steering", "speed"]);

  const demoUploadsRemaining = 3 - bags.filter(b => !b.isDemo).length;
  const isDemoMode = !isAdminLoggedIn;

  useEffect(() => {
    localStorage.setItem("apextrace-bags", JSON.stringify(bags));
  }, [bags]);

  const deleteBag = (id: string) => {
    setBags(prev => {
      const updated = prev.filter(b => b.id !== id);
      if (selectedBagId === id && updated.length > 0) {
        setSelectedBagId(updated[0].id);
      }
      return updated;
    });
  };

  const addBag = (bag: BagData) => {
    setBags(prev => [...prev, bag]);
  };

  return (
    <BagContext.Provider value={{ 
      selectedBagId, 
      setSelectedBagId, 
      bags,
      deleteBag,
      addBag,
      isDemoMode,
      demoUploadsRemaining,
      isAdminLoggedIn,
      setAdminLoggedIn,
      selectedTopics,
      setSelectedTopics
    }}>
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
