import { useMemo } from "react";
import { Car, Trophy, Calendar, TrendingUp, BarChart3, Flag, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { useBag } from "@/contexts/BagContext";
import { useTelemetry } from "@/hooks/useTelemetry";

const Summary = () => {
  const { bags } = useBag();
  const { telemetry } = useTelemetry();

  // Calculate aggregate stats across all bags
  const aggregateStats = useMemo(() => {
    // Demo values - in real implementation these would come from all bags
    const totalBags = bags.length;
    
    // Calculate total driven distance (where velocity > 0.5)
    let totalDrivenKm = 0;
    if (telemetry && telemetry.speed.length > 0) {
      let distance = 0;
      for (let i = 1; i < telemetry.timestamps.length; i++) {
        if (telemetry.speed[i] > 0.5) {
          const dt = telemetry.timestamps[i] - telemetry.timestamps[i - 1];
          distance += telemetry.speed[i] * dt;
        }
      }
      totalDrivenKm = distance / 1000;
    } else {
      // Demo value
      totalDrivenKm = 45.7;
    }

    return {
      totalBags,
      totalDrivenKm: totalDrivenKm.toFixed(1),
      monthlyDistance: "30.2",
      avgSpeed: "38.4",
    };
  }, [bags, telemetry]);

  // Best laps per mission type
  const bestLaps = [
    { mission: "Skidpad", bestTime: "1:18.901", bag: "skidpad_run_001.db3", date: "Nov 22" },
    { mission: "Autocross", bestTime: "1:05.234", bag: "autocross_lap_003.db3", date: "Nov 22" },
    { mission: "Acceleration", bestTime: "0:04.567", bag: "acceleration_test.db3", date: "Nov 21" },
  ];

  // Monthly stats
  const monthlyStats = [
    { month: "January", distance: 30.2, runs: 12 },
    { month: "December", distance: 28.5, runs: 10 },
    { month: "November", distance: 45.7, runs: 18 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />
      
      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Summary & Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Aggregate statistics across all processed bags
            </p>
          </div>

          {/* Overall Stats - Removed Energy and Max Steering */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-card border-dashboard-border">
              <div className="p-2 rounded-lg bg-primary/10 text-primary inline-block mb-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Bags
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-telemetry">{aggregateStats.totalBags}</span>
              </div>
            </Card>

            <Card className="p-4 bg-card border-dashboard-border">
              <div className="p-2 rounded-lg bg-accent/10 text-accent inline-block mb-3">
                <Car className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Distance
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-telemetry">{aggregateStats.totalDrivenKm}</span>
                <span className="text-sm text-muted-foreground">km</span>
              </div>
            </Card>

            <Card className="p-4 bg-card border-dashboard-border">
              <div className="p-2 rounded-lg bg-primary/10 text-primary inline-block mb-3">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                This Month
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-telemetry">{aggregateStats.monthlyDistance}</span>
                <span className="text-sm text-muted-foreground">km</span>
              </div>
            </Card>

            <Card className="p-4 bg-card border-dashboard-border">
              <div className="p-2 rounded-lg bg-accent/10 text-accent inline-block mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Avg Speed
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-telemetry">{aggregateStats.avgSpeed}</span>
                <span className="text-sm text-muted-foreground">m/s</span>
              </div>
            </Card>
          </div>

          {/* Best Laps Per Mission */}
          <Card className="p-6 bg-card border-dashboard-border mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Best Laps Per Mission
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestLaps.map((lap) => (
                <div 
                  key={lap.mission} 
                  className="p-4 rounded-lg bg-muted/30 border border-dashboard-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {lap.mission}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lap.date}</span>
                  </div>
                  <p className="text-2xl font-bold font-telemetry text-accent mb-1">
                    {lap.bestTime}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lap.bag}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Distance Stats */}
          <Card className="p-6 bg-card border-dashboard-border mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Monthly Driving Statistics
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Month</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Distance</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Runs</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody className="font-telemetry">
                  {monthlyStats.map((stat) => (
                    <tr key={stat.month} className="border-b border-dashboard-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4">{stat.month}</td>
                      <td className="text-right py-3 px-4">{stat.distance} km</td>
                      <td className="text-right py-3 px-4">{stat.runs}</td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((stat.distance / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Lap Times by Bag */}
          <Card className="p-6 bg-card border-dashboard-border">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Recent Lap Times
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bag</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mission</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Best Lap</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Distance</th>
                  </tr>
                </thead>
                <tbody className="font-telemetry">
                  {bags.slice(0, 5).map((bag) => (
                    <tr key={bag.id} className="border-b border-dashboard-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4 truncate max-w-[200px]">{bag.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize text-xs">
                          {bag.missionType || "demo"}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4 text-accent">1:19.234</td>
                      <td className="text-right py-3 px-4">2.3 km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Summary;
