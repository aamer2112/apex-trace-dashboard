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
    { id: "torque", label: "Torque" },
    { id: "brake", label: "Brake" },
    { id: "throttle", label: "Throttle" }
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
          <div className="flex gap-2 text-xs">
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

        {/* Plot placeholder - will be replaced with Recharts */}
        <div className="h-64 bg-dashboard-grid rounded-lg border border-dashboard-border relative overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(var(--dashboard-border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--dashboard-border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
          
          {/* Sample waveform */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="none">
            <path
              d="M 0,128 Q 100,80 200,128 T 400,128 Q 500,160 600,128 T 800,128"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
            />
            <path
              d="M 0,128 Q 100,80 200,128 T 400,128 Q 500,160 600,128 T 800,128"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              fill="url(#gradient)"
              opacity="0.2"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Cursor line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
        </div>

        {/* Playback controls */}
        <div className="mt-4 flex items-center gap-4">
          <button className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div className="flex-1 h-1 bg-muted rounded-full relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-primary rounded-full" />
          </div>
          <span className="text-xs font-telemetry text-muted-foreground">
            03:42 / 10:52
          </span>
        </div>
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
