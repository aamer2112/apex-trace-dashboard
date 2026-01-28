import { useState, useMemo } from "react";
import { Activity, Gauge, Car, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useBag } from "@/contexts/BagContext";
import { useTelemetry } from "@/hooks/useTelemetry";
import TelemetryChart from "./TelemetryChart";
import TelemetryTopicSelector from "./TelemetryTopicSelector";

interface KPICardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: string;
  isLoading?: boolean;
}

const KPICard = ({ title, value, unit, icon, trend, isLoading }: KPICardProps) => (
  <Card className="p-4 bg-card border-dashboard-border hover:border-primary/30 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      {trend && (
        <span className="text-xs text-accent font-telemetry">{trend}</span>
      )}
    </div>
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <span className="text-2xl font-bold font-telemetry">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </>
        )}
      </div>
    </div>
  </Card>
);

const QuickLookDashboard = () => {
  const { selectedTopics, setSelectedTopics } = useBag();
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const { telemetry, isLoading } = useTelemetry();

  // Compute KPIs from real telemetry data - removed Energy, replaced with driven distance
  const kpis = useMemo(() => {
    if (!telemetry || telemetry.timestamps.length === 0) {
      return {
        duration: "00:00",
        avgSpeed: 0,
        maxSpeed: 0,
        drivenDistance: 0
      };
    }

    const duration = telemetry.timestamps[telemetry.timestamps.length - 1];
    const avgSpeed = telemetry.speed.reduce((a, b) => a + b, 0) / telemetry.speed.length;
    const maxSpeed = Math.max(...telemetry.speed);
    
    // Calculate driven distance (only when speed > 0.5 m/s)
    let drivenDistance = 0;
    for (let i = 1; i < telemetry.timestamps.length; i++) {
      if (telemetry.speed[i] > 0.5) {
        const dt = telemetry.timestamps[i] - telemetry.timestamps[i - 1];
        drivenDistance += telemetry.speed[i] * dt;
      }
    }

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return {
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      avgSpeed: avgSpeed.toFixed(1),
      maxSpeed: maxSpeed.toFixed(1),
      drivenDistance: (drivenDistance / 1000).toFixed(2) // Convert to km
    };
  }, [telemetry]);

  return (
    <div className="space-y-6">
      {/* KPI Grid - Removed Energy and Max Steering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Duration"
          value={kpis.duration}
          unit="min:sec"
          icon={<Activity className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg Speed"
          value={String(kpis.avgSpeed)}
          unit="m/s"
          icon={<Gauge className="h-5 w-5" />}
          trend="+5.2%"
          isLoading={isLoading}
        />
        <KPICard
          title="Max Speed"
          value={String(kpis.maxSpeed)}
          unit="m/s"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Driven Distance"
          value={String(kpis.drivenDistance)}
          unit="km"
          icon={<Car className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Telemetry Plot Area */}
      <Card className="p-6 bg-card border-dashboard-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Synchronized Telemetry
          </h3>
        </div>

        {/* Multi-select topic dropdown */}
        <div className="mb-4">
          <TelemetryTopicSelector
            selectedTopics={selectedTopics}
            onTopicsChange={setSelectedTopics}
          />
        </div>

        {/* Interactive Telemetry Chart */}
        {selectedTopics.length > 0 ? (
          <TelemetryChart 
            topics={selectedTopics} 
            linkedZoom={true}
            zoomRange={zoomRange}
            onZoomChange={(start, end) => setZoomRange({ start, end })}
          />
        ) : (
          <div className="h-64 bg-dashboard-grid rounded-lg border border-dashboard-border flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Select topics to view telemetry data</p>
          </div>
        )}
      </Card>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Steering Activity", value: 68, color: "primary" },
          { label: "Throttle Usage", value: 82, color: "accent" },
          { label: "Brake Usage", value: 45, color: "destructive" }
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4 bg-card border-dashboard-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              {label}
            </p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={`hsl(var(--${color}))`}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${value * 2} ${200 - value * 2}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-telemetry">{value}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Peak</span>
                    <span className="font-telemetry">{value + 12}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min</span>
                    <span className="font-telemetry">{value - 25}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickLookDashboard;
