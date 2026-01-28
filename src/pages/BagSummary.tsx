import { useMemo } from "react";
import { Trophy, Timer, MapPin, Flag, TrendingUp, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { useBag } from "@/contexts/BagContext";
import { useTelemetry } from "@/hooks/useTelemetry";

interface LapTime {
  lap: number;
  time: string;
  timeSeconds: number;
  isFastest: boolean;
  isHighlighted: boolean;
}

const BagSummary = () => {
  const { selectedBagId, bags } = useBag();
  const { telemetry } = useTelemetry();
  
  const currentBag = bags.find(bag => bag.id === selectedBagId) || bags[0];
  const missionType = currentBag?.missionType || "demo";

  // Generate lap times based on mission type
  const lapTimes = useMemo((): LapTime[] => {
    // Demo lap times - in real implementation this would come from telemetry
    const baseTimes = [
      { lap: 1, time: "1:23.456", timeSeconds: 83.456 },
      { lap: 2, time: "1:21.789", timeSeconds: 81.789 },
      { lap: 3, time: "1:19.234", timeSeconds: 79.234 },
      { lap: 4, time: "1:20.567", timeSeconds: 80.567 },
      { lap: 5, time: "1:18.901", timeSeconds: 78.901 },
      { lap: 6, time: "1:19.876", timeSeconds: 79.876 },
    ];

    const fastestTime = Math.min(...baseTimes.map(l => l.timeSeconds));
    
    // Highlight laps based on mission type
    const highlightedLaps = missionType === "skidpad" ? [3, 5] : [];

    return baseTimes.map(lap => ({
      ...lap,
      isFastest: lap.timeSeconds === fastestTime,
      isHighlighted: highlightedLaps.includes(lap.lap)
    }));
  }, [missionType]);

  // Calculate driven distance (velocity > 0.5)
  const drivenDistance = useMemo(() => {
    if (!telemetry || telemetry.speed.length === 0) {
      return 2.34; // Demo value in km
    }
    // Sum distance where speed > 0.5 m/s
    let distance = 0;
    for (let i = 1; i < telemetry.timestamps.length; i++) {
      if (telemetry.speed[i] > 0.5) {
        const dt = telemetry.timestamps[i] - telemetry.timestamps[i - 1];
        distance += telemetry.speed[i] * dt;
      }
    }
    return distance / 1000; // Convert to km
  }, [telemetry]);

  const fastestLap = lapTimes.find(l => l.isFastest);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{currentBag?.name || "No Bag Selected"}</h2>
              <Badge variant="outline" className="capitalize">
                {missionType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentBag?.timestamp} • {currentBag?.location || "Unknown location"}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-card border-dashboard-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Driven Distance</p>
                  <p className="text-2xl font-bold font-telemetry">{drivenDistance.toFixed(2)} <span className="text-sm text-muted-foreground">km</span></p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-card border-dashboard-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Trophy className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Fastest Lap</p>
                  <p className="text-2xl font-bold font-telemetry text-accent">{fastestLap?.time || "--"}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-card border-dashboard-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Flag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Total Laps</p>
                  <p className="text-2xl font-bold font-telemetry">{lapTimes.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Lap Times Table */}
          <Card className="p-6 bg-card border-dashboard-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Lap Times (Rundenzeiten)
              </h3>
              {missionType === "skidpad" && (
                <p className="text-xs text-muted-foreground">
                  * Highlighted: Lap 3 & Lap 5 (Skidpad scoring laps)
                </p>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Lap</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Time</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Delta to Best</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="font-telemetry">
                  {lapTimes.map((lap) => {
                    const delta = lap.timeSeconds - (fastestLap?.timeSeconds || 0);
                    return (
                      <tr 
                        key={lap.lap} 
                        className={`border-b border-dashboard-border/50 transition-colors ${
                          lap.isFastest ? "bg-accent/10" : 
                          lap.isHighlighted ? "bg-primary/5" : 
                          "hover:bg-muted/20"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span>Lap {lap.lap}</span>
                            {lap.isHighlighted && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Scoring
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className={`text-right py-3 px-4 ${lap.isFastest ? "text-accent font-bold" : ""}`}>
                          {lap.time}
                        </td>
                        <td className="text-right py-3 px-4">
                          {lap.isFastest ? (
                            <span className="text-accent">Best</span>
                          ) : (
                            <span className="text-destructive">+{delta.toFixed(3)}s</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {lap.isFastest && (
                            <Trophy className="h-4 w-4 text-accent inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Track Info */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Track Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Mission Type</p>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  <span className="font-medium capitalize">{missionType}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{currentBag?.location || "Not specified"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Track Length</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-telemetry">1.2 km</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">Session Duration</p>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="font-telemetry">{currentBag?.duration || "00:00"}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BagSummary;
