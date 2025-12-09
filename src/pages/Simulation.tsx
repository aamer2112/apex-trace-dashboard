import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBag } from "@/contexts/BagContext";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";

// Cone positions for the track (relative coordinates 0-100)
const blueCones = [
  { x: 15, y: 20 }, { x: 25, y: 15 }, { x: 40, y: 12 }, { x: 55, y: 15 },
  { x: 70, y: 22 }, { x: 80, y: 35 }, { x: 85, y: 50 }, { x: 82, y: 65 },
  { x: 72, y: 78 }, { x: 55, y: 85 }, { x: 38, y: 82 }, { x: 22, y: 72 },
  { x: 12, y: 55 }, { x: 10, y: 38 }
];

const yellowCones = [
  { x: 25, y: 30 }, { x: 35, y: 25 }, { x: 50, y: 22 }, { x: 62, y: 28 },
  { x: 72, y: 40 }, { x: 75, y: 52 }, { x: 70, y: 65 }, { x: 60, y: 75 },
  { x: 45, y: 78 }, { x: 32, y: 72 }, { x: 22, y: 60 }, { x: 20, y: 45 }
];

// Racing line path
const racingLinePath = "M 20 35 Q 30 20 50 18 Q 75 20 80 45 Q 82 70 60 80 Q 35 85 20 60 Q 15 45 20 35";

const Simulation = () => {
  const { selectedBagId, bags } = useBag();
  const currentBag = bags.find(bag => bag.id === selectedBagId) || bags[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const maxTime = 652; // 10:52 in seconds
  const animationRef = useRef<number>();

  // Car position along the track (0-1)
  const [carProgress, setCarProgress] = useState(0);

  // Simulated telemetry based on time
  const speed = 42 + Math.sin(currentTime * 0.3) * 12;
  const steeringAngle = Math.sin(currentTime * 0.5) * 25;
  const gForceX = Math.cos(currentTime * 0.5) * 1.5;
  const gForceY = Math.sin(currentTime * 0.3) * 0.8;
  const force = 2500 + Math.sin(currentTime * 0.4) * 800;
  const yawMoment = Math.sin(currentTime * 0.6) * 450;

  // Calculate car position on track
  const getCarPosition = (progress: number) => {
    const angle = progress * Math.PI * 2;
    const centerX = 50;
    const centerY = 50;
    const radiusX = 30;
    const radiusY = 25;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      rotation: (angle * 180 / Math.PI) + 90
    };
  };

  const carPosition = getCarPosition(carProgress);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setCurrentTime(prev => {
          const next = prev + (0.016 * playbackSpeed);
          return next >= maxTime ? 0 : next;
        });
        setCarProgress(prev => {
          const next = prev + (0.0005 * playbackSpeed);
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
  }, [isPlaying, playbackSpeed, maxTime]);

  const handleReset = () => {
    setCurrentTime(0);
    setCarProgress(0);
    setIsPlaying(false);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    setCurrentTime(percent * maxTime);
    setCarProgress(percent);
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
              {currentBag?.name || `Bag #${selectedBagId}`} • Real-time replay with synchronized telemetry
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
                  {/* Track surface */}
                  <ellipse cx="50" cy="50" rx="35" ry="30" fill="hsl(var(--muted))" opacity="0.3" />
                  <ellipse cx="50" cy="50" rx="25" ry="20" fill="hsl(var(--background))" />
                  
                  {/* Racing line */}
                  <path 
                    d={racingLinePath} 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="0.5" 
                    strokeDasharray="2,1"
                    opacity="0.6"
                  />
                  
                  {/* Blue cones (left side) */}
                  {blueCones.map((cone, i) => (
                    <g key={`blue-${i}`}>
                      <polygon 
                        points={`${cone.x},${cone.y - 1.5} ${cone.x - 1},${cone.y + 1} ${cone.x + 1},${cone.y + 1}`}
                        fill="hsl(210, 100%, 50%)"
                      />
                    </g>
                  ))}
                  
                  {/* Yellow cones (right side) */}
                  {yellowCones.map((cone, i) => (
                    <g key={`yellow-${i}`}>
                      <polygon 
                        points={`${cone.x},${cone.y - 1.5} ${cone.x - 1},${cone.y + 1} ${cone.x + 1},${cone.y + 1}`}
                        fill="hsl(45, 100%, 50%)"
                      />
                    </g>
                  ))}
                  
                  {/* Car path trail */}
                  <ellipse 
                    cx="50" 
                    cy="50" 
                    rx="30" 
                    ry="25" 
                    fill="none" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth="0.3"
                    strokeDasharray="1,2"
                    opacity="0.4"
                  />
                  
                  {/* Car */}
                  <g transform={`translate(${carPosition.x}, ${carPosition.y}) rotate(${carPosition.rotation})`}>
                    {/* Car body */}
                    <rect x="-1.5" y="-3" width="3" height="6" rx="0.5" fill="hsl(var(--primary))" />
                    {/* Front indicator */}
                    <rect x="-0.5" y="-3.5" width="1" height="1" fill="hsl(var(--foreground))" />
                    {/* Wheels */}
                    <rect x="-2" y="-2.5" width="0.6" height="1.5" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="1.4" y="-2.5" width="0.6" height="1.5" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="-2" y="1" width="0.6" height="1.5" fill="hsl(var(--muted-foreground))" rx="0.1" />
                    <rect x="1.4" y="1" width="0.6" height="1.5" fill="hsl(var(--muted-foreground))" rx="0.1" />
                  </g>
                  
                  {/* Start/Finish line */}
                  <line x1="20" y1="33" x2="20" y2="37" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                </svg>
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
                {[0.5, 1, 2, 4].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPlaybackSpeed(speed)}
                    className="h-7 text-xs"
                  >
                    {speed}x
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