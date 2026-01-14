import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBag } from "@/contexts/BagContext";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { streamBagData, generateMockTelemetry, TelemetryData } from "@/lib/api";

// Monza-inspired track outline points (simplified representation)
const trackOuterPath = `
  M 15 50
  L 15 25
  Q 15 15 25 15
  L 45 15
  Q 55 15 60 20
  L 75 35
  Q 85 45 85 55
  L 85 70
  Q 85 80 75 85
  L 55 85
  Q 45 85 40 80
  L 25 65
  Q 15 55 15 50
  Z
`;

const trackInnerPath = `
  M 25 50
  L 25 30
  Q 25 22 33 22
  L 43 22
  Q 50 22 55 27
  L 68 40
  Q 75 48 75 55
  L 75 65
  Q 75 72 68 77
  L 53 77
  Q 48 77 44 73
  L 32 60
  Q 25 53 25 50
  Z
`;

// Define key points along the track for car movement
const trackPoints = [
  { x: 20, y: 50 }, { x: 20, y: 35 }, { x: 20, y: 25 }, { x: 28, y: 18 },
  { x: 40, y: 18 }, { x: 52, y: 20 }, { x: 62, y: 28 }, { x: 72, y: 40 },
  { x: 80, y: 52 }, { x: 80, y: 65 }, { x: 78, y: 75 }, { x: 70, y: 82 },
  { x: 58, y: 82 }, { x: 48, y: 78 }, { x: 38, y: 70 }, { x: 28, y: 58 },
];

// Optimal racing line points (the ideal path - GREEN)
const optimalLinePoints = [
  { x: 22, y: 50 }, { x: 21, y: 38 }, { x: 22, y: 26 }, { x: 30, y: 17 },
  { x: 42, y: 16 }, { x: 55, y: 18 }, { x: 68, y: 30 }, { x: 78, y: 45 },
  { x: 80, y: 58 }, { x: 78, y: 72 }, { x: 68, y: 82 }, { x: 54, y: 83 },
  { x: 42, y: 78 }, { x: 32, y: 68 }, { x: 24, y: 56 },
];

// Actual racing line points (the path the car takes - RED)
const actualLinePoints = [
  { x: 23, y: 52 }, { x: 24, y: 40 }, { x: 26, y: 28 }, { x: 34, y: 20 },
  { x: 45, y: 19 }, { x: 58, y: 22 }, { x: 70, y: 34 }, { x: 77, y: 48 },
  { x: 78, y: 60 }, { x: 74, y: 74 }, { x: 64, y: 80 }, { x: 50, y: 80 },
  { x: 40, y: 74 }, { x: 30, y: 64 }, { x: 25, y: 54 },
];

// Convert points to SVG path
const pointsToPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return "";
  return points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, "");
};

const Simulation = () => {
  const { selectedBagId, bags } = useBag();
  const currentBag = bags.find(bag => bag.id === selectedBagId) || bags[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number>();

  // Fetch telemetry data when bag changes
  const fetchTelemetryData = useCallback(async () => {
    if (!currentBag) return;
    setIsLoading(true);
    
    const data = await streamBagData(currentBag.name);
    if (data) {
      setTelemetryData(data);
    } else {
      setTelemetryData(generateMockTelemetry(currentBag.name, 500));
    }
    setIsLoading(false);
    setCurrentDataIndex(0);
    setCurrentTime(0);
  }, [currentBag]);

  useEffect(() => {
    fetchTelemetryData();
  }, [fetchTelemetryData]);

  const maxTime = telemetryData?.timestamps?.length 
    ? telemetryData.timestamps[telemetryData.timestamps.length - 1] 
    : 652;

  const [carProgress, setCarProgress] = useState(0);

  // Get current telemetry values
  const idx = Math.min(currentDataIndex, (telemetryData?.steering?.length || 1) - 1);
  const steeringAngle = telemetryData?.steering?.[idx] ?? 0;
  const speed = telemetryData?.speed?.[idx] ?? 42;
  const force = telemetryData?.force?.[idx] ?? 2500;
  const yawMoment = telemetryData?.yaw_moment?.[idx] ?? 450;
  const gForceX = Math.cos(currentTime * 0.5) * (speed / 40);
  const gForceY = Math.sin(currentTime * 0.3) * (speed / 60);

  // Calculate car position on track following actual line
  const getCarPosition = (progress: number) => {
    const totalPoints = actualLinePoints.length;
    const exactIndex = progress * (totalPoints - 1);
    const index = Math.floor(exactIndex);
    const nextIndex = Math.min(index + 1, totalPoints - 1);
    const t = exactIndex - index;
    
    const current = actualLinePoints[index];
    const next = actualLinePoints[nextIndex];
    
    const x = current.x + (next.x - current.x) * t;
    const y = current.y + (next.y - current.y) * t;
    
    // Calculate rotation based on direction
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { x, y, rotation };
  };

  const carPosition = getCarPosition(carProgress);

  // Get visible portion of racing lines based on car progress
  const getVisibleLinePath = (points: { x: number; y: number }[], progress: number) => {
    const visibleCount = Math.max(2, Math.ceil(progress * points.length) + 3);
    const visiblePoints = points.slice(0, Math.min(visibleCount, points.length));
    return pointsToPath(visiblePoints);
  };

  useEffect(() => {
    if (isPlaying && telemetryData) {
      const totalPoints = telemetryData.timestamps?.length || 500;
      const animate = () => {
        setCurrentDataIndex(prev => {
          const next = prev + Math.ceil(playbackSpeed);
          return next >= totalPoints ? 0 : next;
        });
        setCurrentTime(prev => {
          const next = prev + (0.02 * playbackSpeed);
          return next >= maxTime ? 0 : next;
        });
        setCarProgress(prev => {
          const next = prev + (0.002 * playbackSpeed);
          return next >= 1 ? 0 : next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, maxTime, telemetryData]);

  const handleReset = () => {
    setCurrentTime(0);
    setCarProgress(0);
    setCurrentDataIndex(0);
    setIsPlaying(false);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    setCurrentTime(percent * maxTime);
    setCarProgress(percent);
    if (telemetryData) {
      setCurrentDataIndex(Math.floor(percent * (telemetryData.timestamps?.length || 500)));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">2D Track Simulation</h2>
            <p className="text-sm text-muted-foreground">
              {currentBag?.name || `Bag #${selectedBagId}`} • Monza-style circuit with racing line comparison
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2D Track Visualization */}
            <Card className="lg:col-span-2 p-6 bg-card border-dashboard-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Track View
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative bg-dashboard-grid rounded-lg border border-dashboard-border overflow-hidden" style={{ height: '400px' }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="xMidYMid meet"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                  {/* Track surface (outer) */}
                  <path 
                    d={trackOuterPath}
                    fill="hsl(var(--muted))"
                    opacity="0.4"
                  />
                  
                  {/* Track inner cutout */}
                  <path 
                    d={trackInnerPath}
                    fill="hsl(var(--background))"
                  />
                  
                  {/* Track borders */}
                  <path 
                    d={trackOuterPath}
                    fill="none"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                  <path 
                    d={trackInnerPath}
                    fill="none"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                  
                  {/* Optimal racing line (GREEN) - full path faded */}
                  <path 
                    d={pointsToPath(optimalLinePoints) + " Z"}
                    fill="none"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                  
                  {/* Optimal racing line trail (GREEN) - visible portion */}
                  <path 
                    d={getVisibleLinePath(optimalLinePoints, carProgress)}
                    fill="none"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_4px_hsl(142,76%,36%)]"
                  />
                  
                  {/* Actual racing line (RED) - full path faded */}
                  <path 
                    d={pointsToPath(actualLinePoints) + " Z"}
                    fill="none"
                    stroke="hsl(0, 84%, 50%)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                  
                  {/* Actual racing line trail (RED) - visible portion behind car */}
                  <path 
                    d={getVisibleLinePath(actualLinePoints, carProgress)}
                    fill="none"
                    stroke="hsl(0, 84%, 50%)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_4px_hsl(0,84%,50%)]"
                  />
                  
                  {/* Start/Finish line */}
                  <line x1="18" y1="48" x2="26" y2="48" stroke="hsl(var(--foreground))" strokeWidth="1" />
                  <text x="22" y="46" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="2.5">S/F</text>
                  
                  {/* Car */}
                  <g transform={`translate(${carPosition.x}, ${carPosition.y}) rotate(${carPosition.rotation})`}>
                    {/* Car body */}
                    <rect x="-1.2" y="-2" width="2.4" height="4" rx="0.4" fill="hsl(var(--primary))" />
                    {/* Front indicator */}
                    <rect x="-0.4" y="1.5" width="0.8" height="0.6" fill="hsl(var(--foreground))" />
                    {/* Wheels */}
                    <rect x="-1.6" y="-1.5" width="0.5" height="1" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="1.1" y="-1.5" width="0.5" height="1" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="-1.6" y="0.5" width="0.5" height="1" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="1.1" y="0.5" width="0.5" height="1" fill="hsl(var(--muted-foreground))" rx="0.1" />
                  </g>
                </svg>
              </div>

              {/* Racing Line Legend */}
              <div className="mt-4 flex items-center justify-center gap-6 p-3 bg-muted/30 rounded-lg border border-dashboard-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded-full bg-[hsl(142,76%,36%)]" />
                  <span className="text-xs text-muted-foreground">Optimal Racing Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded-full bg-[hsl(0,84%,50%)]" />
                  <span className="text-xs text-muted-foreground">Actual Path Taken</span>
                </div>
              </div>
            </Card>

            {/* Right side panels */}
            <div className="space-y-6">
              {/* Speedometer */}
              <Card className="p-6 bg-card border-dashboard-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                  Speedometer
                </h3>
                <div className="relative flex items-center justify-center">
                  <svg width="160" height="100" viewBox="0 0 160 100">
                    {/* Speed arc background */}
                    <path
                      d="M 20 90 A 60 60 0 0 1 140 90"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Speed arc fill */}
                    <path
                      d="M 20 90 A 60 60 0 0 1 140 90"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(speed / 80) * 188} 188`}
                    />
                    {/* Speed text */}
                    <text x="80" y="75" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="24" fontWeight="bold" className="font-telemetry">
                      {speed.toFixed(0)}
                    </text>
                    <text x="80" y="92" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
                      m/s
                    </text>
                  </svg>
                </div>
              </Card>

              {/* G-Force Display */}
              <Card className="p-6 bg-card border-dashboard-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                  G-Force
                </h3>
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* Grid */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    <circle cx="60" cy="60" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
                    <circle cx="60" cy="60" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
                    <line x1="10" y1="60" x2="110" y2="60" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    <line x1="60" y1="10" x2="60" y2="110" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    
                    {/* G-Force indicator */}
                    <circle 
                      cx={60 + gForceX * 25} 
                      cy={60 - gForceY * 25} 
                      r="8" 
                      fill="hsl(var(--primary))"
                      className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    />
                    
                    {/* Labels */}
                    <text x="60" y="15" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">ACCEL</text>
                    <text x="60" y="115" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">BRAKE</text>
                    <text x="8" y="63" textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="8">L</text>
                    <text x="108" y="63" textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="8">R</text>
                  </svg>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground font-telemetry">
                  <span>Lat: {gForceX.toFixed(2)}g</span>
                  <span>Long: {gForceY.toFixed(2)}g</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Live Telemetry
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Steering Angle", value: steeringAngle.toFixed(1), unit: "deg" },
                { label: "Speed", value: speed.toFixed(1), unit: "m/s" },
                { label: "Force", value: force.toFixed(0), unit: "N" },
                { label: "Yaw Moment", value: yawMoment.toFixed(0), unit: "Nm" }
              ].map((metric) => (
                <div key={metric.label} className="p-4 bg-dashboard-grid rounded-lg border border-dashboard-border">
                  <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-telemetry">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div 
                  className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden cursor-pointer"
                  onClick={handleScrub}
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(currentTime / maxTime) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-telemetry text-muted-foreground min-w-[80px]">
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / 10:52
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Speed:</span>
                {[0.5, 1, 2, 4].map((s) => (
                  <Button
                    key={s}
                    variant={playbackSpeed === s ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPlaybackSpeed(s)}
                    className="h-7 text-xs"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Simulation;