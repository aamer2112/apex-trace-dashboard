import { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBag } from "@/contexts/BagContext";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";

const Simulation = () => {
  const { selectedBagId } = useBag();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const maxTime = 652; // 10:52 in seconds

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Simulation Playback</h2>
            <p className="text-sm text-muted-foreground">
              Bag #{selectedBagId} • Real-time replay with synchronized telemetry
            </p>
          </div>

          {/* Vehicle Visualizer */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Vehicle State
            </h3>
            <div className="flex items-center justify-center h-64 bg-dashboard-grid rounded-lg border border-dashboard-border relative overflow-hidden">
              {/* Simple 2D Car Visualization */}
              <div className="relative">
                <svg width="200" height="100" viewBox="0 0 200 100" className="drop-shadow-[0_0_20px_hsl(var(--primary))]">
                  {/* Car body */}
                  <rect x="40" y="30" width="120" height="40" fill="hsl(var(--primary))" rx="5" />
                  {/* Wheels */}
                  <circle cx="60" cy="75" r="12" fill="hsl(var(--muted-foreground))" stroke="hsl(var(--primary))" strokeWidth="2" />
                  <circle cx="140" cy="75" r="12" fill="hsl(var(--muted-foreground))" stroke="hsl(var(--primary))" strokeWidth="2" />
                  {/* Steering indicator */}
                  <line x1="100" y1="20" x2="100" y2="35" stroke="hsl(var(--accent))" strokeWidth="3" className="transition-transform origin-center" style={{ transform: `rotate(${Math.sin(currentTime * 0.5) * 15}deg)` }} />
                </svg>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-telemetry">
                  Steering: {(Math.sin(currentTime * 0.5) * 15).toFixed(1)}°
                </div>
              </div>
            </div>
          </Card>

          {/* Synchronized Plots */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Telemetry Replay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Steering Angle", value: (Math.sin(currentTime * 0.5) * 27.3).toFixed(1), unit: "deg" },
                { label: "Speed", value: (42 + Math.sin(currentTime * 0.3) * 8).toFixed(1), unit: "m/s" },
                { label: "Torque", value: (150 + Math.sin(currentTime * 0.7) * 50).toFixed(0), unit: "Nm" }
              ].map((metric) => (
                <div key={metric.label} className="p-4 bg-dashboard-grid rounded-lg border border-dashboard-border">
                  <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-telemetry">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="space-y-4">
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
                  onClick={() => setCurrentTime(0)}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden cursor-pointer">
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
