import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface BagData {
  id: string;
  name: string;
  timestamp: string;
  topics: number;
  duration: string;
  isDemo?: boolean;
  missionType?: string;
  location?: string;
  uploadDate?: Date;
  drivenDistance?: number; // km, only counts when velocity > 0.5
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
  { id: "1", name: "skidpad_run_001.db3", timestamp: "Nov 22, 2025 at 14:30", topics: 47, duration: "10:52", isDemo: true, missionType: "skidpad", location: "Hockenheimring", drivenDistance: 2.34 },
  { id: "2", name: "autocross_lap_003.db3", timestamp: "Nov 22, 2025 at 11:15", topics: 52, duration: "08:15", isDemo: true, missionType: "autocross", location: "Munich Test Track", drivenDistance: 1.87 },
  { id: "3", name: "endurance_test_045.db3", timestamp: "Nov 21, 2025 at 16:42", topics: 51, duration: "22:08", isDemo: true, missionType: "endurance", location: "Hockenheimring", drivenDistance: 4.56 }
];

const BagContext = createContext<BagContextType | undefined>(undefined);

export const BagProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBagId, setSelectedBagId] = useState("1");
  const [bags, setBags] = useState<BagData[]>(() => {
    const stored = localStorage.getItem("apextrace-bags");
    const deletedBags = localStorage.getItem("apextrace-deleted-bags");
    const deletedBagIds = deletedBags ? new Set(JSON.parse(deletedBags)) : new Set<string>();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Filter out deleted bags
      const filtered = parsed.filter((bag: BagData) => !deletedBagIds.has(bag.id));
      // Only use default bags if no stored bags exist and user hasn't deleted anything
      if (filtered.length > 0) {
        return filtered;
      } else if (!deletedBags) {
        // Only return defaults if user hasn't explicitly deleted anything
        return defaultBags;
      }
      return [];
    }
    return defaultBags;
  });
  const [isAdminLoggedIn, setAdminLoggedIn] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["steering", "speed"]);

  const demoUploadsRemaining = Infinity; // No limit
  const isDemoMode = false; // No demo mode restrictions

  useEffect(() => {
    localStorage.setItem("apextrace-bags", JSON.stringify(bags));
  }, [bags]);

  const deleteBag = (id: string) => {
    setBags(prev => {
      const updated = prev.filter(b => b.id !== id);
      // Track deleted bag IDs so they don't reappear
      const deletedBags = localStorage.getItem("apextrace-deleted-bags");
      const deletedSet = deletedBags ? new Set(JSON.parse(deletedBags)) : new Set<string>();
      deletedSet.add(id);
      localStorage.setItem("apextrace-deleted-bags", JSON.stringify(Array.from(deletedSet)));
      
      if (selectedBagId === id && updated.length > 0) {
        setSelectedBagId(updated[0].id);
      } else if (updated.length === 0) {
        setSelectedBagId("");
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
