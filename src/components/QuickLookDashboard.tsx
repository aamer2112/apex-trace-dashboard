import { useState } from "react";
import { Activity, Gauge, Zap, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBag } from "@/contexts/BagContext";
import TelemetryChart from "./TelemetryChart";

interface KPICardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: string;
}

const KPICard = ({ title, value, unit, icon, trend }: KPICardProps) => (
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
        <span className="text-2xl font-bold font-telemetry">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  </Card>
);

const QuickLookDashboard = () => {
  const { selectedTopics, setSelectedTopics } = useBag();
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });

  const toggleTopic = (topic: string) => {
    setSelectedTopics(
      selectedTopics.includes(topic)
        ? selectedTopics.filter(t => t !== topic)
        : [...selectedTopics, topic]
    );
  };

  const topics = [
    { id: "steering", label: "Steering" },
    { id: "speed", label: "Speed" },
    { id: "force", label: "Force" },
    { id: "brake", label: "Brake" },
    { id: "yaw_moment", label: "Yaw Moment" }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Duration"
          value="10:52"
          unit="min:sec"
          icon={<Activity className="h-5 w-5" />}
        />
        <KPICard
          title="Avg Speed"
          value="42.3"
          unit="m/s"
          icon={<Gauge className="h-5 w-5" />}
          trend="+5.2%"
        />
        <KPICard
          title="Max Steering"
          value="27.3"
          unit="deg"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          title="Total Energy"
          value="8.4"
          unit="kWh"
          icon={<Zap className="h-5 w-5" />}
          trend="-2.1%"
        />
      </div>

      {/* Main Telemetry Plot Area */}
      <Card className="p-6 bg-card border-dashboard-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Synchronized Telemetry
          </h3>
          <div className="flex gap-2 text-xs flex-wrap">
            {topics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopics.includes(topic.id) ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleTopic(topic.id)}
                className="h-7"
              >
                {topic.label}
              </Button>
            ))}
          </div>
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
