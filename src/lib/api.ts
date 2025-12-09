/**
 * API client for ROS2 backend communication
 * Backend runs at http://localhost:8000 (see ros2_backend.py)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TelemetryData {
  steering: number[];
  speed: number[];
  yaw_moment: number[];
  force: number[];
  track: Array<{ type: string; x: number; y: number }>;
  timestamps: number[];
  bag_name: string;
  total_points: number;
}

export interface BagListResponse {
  bags: string[];
  total: number;
  details: Record<string, { size: number; path: string }>;
}

export interface BagTopic {
  name: string;
  type: string;
}

export interface HealthResponse {
  status: string;
  ros2_available: boolean;
  bags_loaded: number;
}

// Check if backend is available
export async function checkBackendHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('Backend not available, using local mock data');
  }
  return null;
}

// List all ROS2 bags
export async function listBags(search?: string): Promise<BagListResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/list/`);
    if (search) {
      url.searchParams.set('search', search);
    }
    const response = await fetch(url.toString());
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to list bags:', error);
  }
  return { bags: [], total: 0, details: {} };
}

// Upload a ROS2 bag file
export async function uploadBag(file: File): Promise<{ status: string; filename: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to upload bag:', error);
  }
  return null;
}

// Delete a ROS2 bag file
export async function deleteBag(bagName: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(bagName)}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete bag:', error);
  }
  return false;
}

// Stream telemetry data from a bag
export async function streamBagData(bagName: string): Promise<TelemetryData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/stream/${encodeURIComponent(bagName)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to stream bag data:', error);
  }
  return null;
}

// Get topics in a bag
export async function getBagTopics(bagName: string): Promise<BagTopic[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/topics/${encodeURIComponent(bagName)}`);
    if (response.ok) {
      const data = await response.json();
      return data.topics || [];
    }
  } catch (error) {
    console.error('Failed to get bag topics:', error);
  }
  return [];
}

// Generate mock telemetry data for demo/offline mode
export function generateMockTelemetry(bagName: string, numPoints: number = 500): TelemetryData {
  const steering: number[] = [];
  const speed: number[] = [];
  const yaw_moment: number[] = [];
  const force: number[] = [];
  const timestamps: number[] = [];
  const track: Array<{ type: string; x: number; y: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i * 0.02;
    timestamps.push(t);
    steering.push(Math.sin(t * 0.5) * 25 + (Math.random() - 0.5) * 5);
    speed.push(60 + Math.sin(t * 0.3) * 25 + (Math.random() - 0.5) * 3);
    yaw_moment.push(Math.cos(t * 0.4) * 400 + (Math.random() - 0.5) * 50);
    force.push(Math.abs(Math.sin(t * 0.6)) * 1800 + 200 + (Math.random() - 0.5) * 100);
  }

  // Generate track cones
  for (let i = 0; i < 25; i++) {
    const x = i * 4;
    const trackY = Math.sin(i * 0.3) * 2;
    track.push({ type: 'blue_cone', x, y: trackY - 2.5 });
    track.push({ type: 'yellow_cone', x, y: trackY + 2.5 });
  }

  return {
    steering,
    speed,
    yaw_moment,
    force,
    track,
    timestamps,
    bag_name: bagName,
    total_points: numPoints,
  };
}
