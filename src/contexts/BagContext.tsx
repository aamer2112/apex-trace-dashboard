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
  { id: "3", name: "endurance_test_045.db3", timestamp: "Nov 21, 2025 at 16:42", topics: 51, duration: "22:08", isDemo: true, missionType: "endurance", location: "Hockenheimring", drivenDistance: 4.56 },
  { id: "4", name: "acceleration_test_007.db3", timestamp: "Nov 20, 2025 at 09:30", topics: 38, duration: "02:15", isDemo: true, missionType: "acceleration", location: "Munich Test Track", drivenDistance: 0.75 },
];

const BagContext = createContext<BagContextType | undefined>(undefined);

// Helper to get laps for a bag based on mission type
export const getLapsForBag = (bag: BagData): string[] => {
  const missionType = bag.missionType || "demo";
  
  if (missionType === "skidpad") {
    return ["1", "2", "3", "4", "5"];
  } else if (missionType === "autocross") {
    return ["1"];
  } else if (missionType === "acceleration") {
    return ["1"];
  } else if (missionType === "endurance") {
    return Array.from({ length: 10 }, (_, i) => String(i + 1));
  }
  return ["1", "2", "3"];
};

export const BagProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBagId, setSelectedBagId] = useState("1");
  const [bags, setBags] = useState<BagData[]>(() => {
    // Version check - if we added new demo bags, reset deleted list for demo bags only
    const DEMO_VERSION = "v2"; // Increment when adding new demo bags
    const storedVersion = localStorage.getItem("apextrace-demo-version");
    
    if (storedVersion !== DEMO_VERSION) {
      // New demo bags available - clear the deleted list for demo bag IDs only
      const deletedBags = localStorage.getItem("apextrace-deleted-bags");
      if (deletedBags) {
        const deletedSet = new Set(JSON.parse(deletedBags));
        // Remove demo bag IDs from deleted set
        defaultBags.forEach(bag => deletedSet.delete(bag.id));
        localStorage.setItem("apextrace-deleted-bags", JSON.stringify(Array.from(deletedSet)));
      }
      localStorage.setItem("apextrace-demo-version", DEMO_VERSION);
    }
    
    const stored = localStorage.getItem("apextrace-bags");
    const deletedBags = localStorage.getItem("apextrace-deleted-bags");
    const deletedBagIds = deletedBags ? new Set(JSON.parse(deletedBags)) : new Set<string>();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge stored bags with default bags (in case new defaults were added)
      const storedIds = new Set(parsed.map((b: BagData) => b.id));
      const mergedBags = [...parsed];
      
      // Add any default bags that aren't in stored and weren't deleted
      for (const defaultBag of defaultBags) {
        if (!storedIds.has(defaultBag.id) && !deletedBagIds.has(defaultBag.id)) {
          mergedBags.push(defaultBag);
        }
      }
      
      // Filter out deleted bags
      const filtered = mergedBags.filter((bag: BagData) => !deletedBagIds.has(bag.id));
      return filtered.length > 0 ? filtered : defaultBags;
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
