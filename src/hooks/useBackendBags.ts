import { useState, useEffect, useCallback } from "react";
import { 
  listBags, 
  uploadBag, 
  deleteBag as apiDeleteBag, 
  checkBackendHealth,
  BagListResponse 
} from "@/lib/api";

interface UseBackendBagsResult {
  backendBags: string[];
  backendDetails: Record<string, { size: number; path: string }>;
  isConnected: boolean;
  isLoading: boolean;
  upload: (file: File) => Promise<boolean>;
  remove: (bagName: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useBackendBags(): UseBackendBagsResult {
  const [backendBags, setBackendBags] = useState<string[]>([]);
  const [backendDetails, setBackendDetails] = useState<Record<string, { size: number; path: string }>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    const health = await checkBackendHealth();
    setIsConnected(health !== null && health.status === 'healthy');
    return health !== null;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const connected = await checkConnection();
      if (connected) {
        const response = await listBags();
        setBackendBags(response.bags);
        setBackendDetails(response.details);
      }
    } catch (err) {
      console.error("Failed to refresh bags:", err);
    } finally {
      setIsLoading(false);
    }
  }, [checkConnection]);

  const upload = useCallback(async (file: File): Promise<boolean> => {
    try {
      const result = await uploadBag(file);
      if (result) {
        await refresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Upload failed:", err);
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (bagName: string): Promise<boolean> => {
    try {
      const success = await apiDeleteBag(bagName);
      if (success) {
        await refresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Delete failed:", err);
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    backendBags,
    backendDetails,
    isConnected,
    isLoading,
    upload,
    remove,
    refresh
  };
}
