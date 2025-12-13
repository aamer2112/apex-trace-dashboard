import { useState, useEffect, useCallback } from "react";
import { streamBagData, generateMockTelemetry, TelemetryData } from "@/lib/api";
import { useBag } from "@/contexts/BagContext";

interface UseTelemetryResult {
  telemetry: TelemetryData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTelemetry(): UseTelemetryResult {
  const { selectedBagId, bags } = useBag();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBag = bags.find(b => b.id === selectedBagId);

  const fetchTelemetry = useCallback(async () => {
    if (!selectedBag) {
      setTelemetry(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from backend first
      const data = await streamBagData(selectedBag.name);
      
      if (data && data.timestamps.length > 0) {
        setTelemetry(data);
      } else {
        // Fallback to mock data if backend returns empty or fails
        console.log("Using mock telemetry data for:", selectedBag.name);
        const mockData = generateMockTelemetry(selectedBag.name);
        setTelemetry(mockData);
      }
    } catch (err) {
      console.error("Failed to fetch telemetry:", err);
      // Use mock data as fallback
      const mockData = generateMockTelemetry(selectedBag.name);
      setTelemetry(mockData);
      setError("Backend unavailable, using simulated data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBag]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  return {
    telemetry,
    isLoading,
    error,
    refetch: fetchTelemetry
  };
}
