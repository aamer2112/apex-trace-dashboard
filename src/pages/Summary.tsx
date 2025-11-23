import { TrendingUp, Gauge, Zap, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";

const Summary = () => {
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

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Bags", value: "3", icon: <BarChart3 className="h-5 w-5" /> },
              { label: "Highest Speed", value: "52.7", unit: "m/s", icon: <Gauge className="h-5 w-5" /> },
              { label: "Max Steering", value: "31.2", unit: "deg", icon: <TrendingUp className="h-5 w-5" /> },
              { label: "Total Energy", value: "24.6", unit: "kWh", icon: <Zap className="h-5 w-5" /> }
            ].map((stat) => (
              <Card key={stat.label} className="p-4 bg-card border-dashboard-border">
                <div className="p-2 rounded-lg bg-primary/10 text-primary inline-block mb-3">
                  {stat.icon}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-telemetry">{stat.value}</span>
                  {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                </div>
              </Card>
            ))}
          </div>

          {/* Usage Distribution */}
          <Card className="p-6 bg-card border-dashboard-border mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Accumulated Usage Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Steering Activity", avg: 68, peak: 94, color: "primary" },
                { label: "Throttle Usage", avg: 75, peak: 98, color: "accent" },
                { label: "Brake Usage", avg: 42, peak: 87, color: "destructive" }
              ].map(({ label, avg, peak, color }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    {label}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="hsl(var(--muted))"
                          strokeWidth="10"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke={`hsl(var(--${color}))`}
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${avg * 2.4} ${240 - avg * 2.4}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold font-telemetry">{avg}%</span>
                      </div>
                    </div>
                    <div className="flex-1 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg</span>
                        <span className="font-telemetry">{avg}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak</span>
                        <span className="font-telemetry">{peak}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Extremes Table */}
          <Card className="p-6 bg-card border-dashboard-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Steering & Speed Extremes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dashboard-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Bag</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Max Steering</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Max Speed</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Avg Speed</th>
                  </tr>
                </thead>
                <tbody className="font-telemetry">
                  {[
                    { bag: "skidpad_run_001.db3", steering: 27.3, maxSpeed: 45.2, avgSpeed: 42.3 },
                    { bag: "autocross_lap_003.db3", steering: 31.2, maxSpeed: 52.7, avgSpeed: 38.1 },
                    { bag: "endurance_test_045.db3", steering: 24.8, maxSpeed: 48.9, avgSpeed: 41.7 }
                  ].map((row) => (
                    <tr key={row.bag} className="border-b border-dashboard-border/50 hover:bg-muted/20">
                      <td className="py-3 px-2">{row.bag}</td>
                      <td className="text-right py-3 px-2">{row.steering}°</td>
                      <td className="text-right py-3 px-2">{row.maxSpeed} m/s</td>
                      <td className="text-right py-3 px-2">{row.avgSpeed} m/s</td>
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
