import { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Button } from "@/components/ui/button";
import { Link2, Link2Off, RotateCcw, Loader2 } from "lucide-react";
import { useTelemetry } from "@/hooks/useTelemetry";

interface TelemetryChartProps {
  topics: string[];
  linkedZoom?: boolean;
  onZoomChange?: (start: number, end: number) => void;
  zoomRange?: { start: number; end: number };
}

const topicConfig: Record<string, { color: string; unit: string; label: string; dataKey: keyof import("@/lib/api").TelemetryData }> = {
  steering: { color: "#FF5400", unit: "deg", label: "Steering Angle", dataKey: "steering" },
  speed: { color: "#00C2A8", unit: "m/s", label: "Vehicle Speed", dataKey: "speed" },
  force: { color: "#FFD700", unit: "N", label: "Longitudinal Force", dataKey: "force" },
  brake: { color: "#FF4444", unit: "%", label: "Brake Pressure", dataKey: "force" },
  yaw_moment: { color: "#9B59B6", unit: "Nm", label: "Yaw Moment", dataKey: "yaw_moment" }
};

const TelemetryChart = ({ topics, linkedZoom = true, onZoomChange, zoomRange }: TelemetryChartProps) => {
  const chartRef = useRef<ReactECharts>(null);
  const [isLinked, setIsLinked] = useState(linkedZoom);
  const [internalZoom, setInternalZoom] = useState({ start: 0, end: 100 });
  const { telemetry, isLoading, error } = useTelemetry();

  const effectiveZoom = zoomRange || internalZoom;

  useEffect(() => {
    if (chartRef.current && zoomRange) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({
        type: "dataZoom",
        start: zoomRange.start,
        end: zoomRange.end
      });
    }
  }, [zoomRange]);

  // Build series from actual telemetry data
  const series = topics.map(topic => {
    const config = topicConfig[topic];
    const dataKey = config?.dataKey || "steering";
    
    // Use real data if available, otherwise generate fallback
    let data: [number, number][] = [];
    
    if (telemetry && telemetry.timestamps.length > 0) {
      const values = telemetry[dataKey] as number[];
      data = telemetry.timestamps.map((t, i) => [t, values[i] || 0]);
    } else {
      // Fallback to generated data for demo
      for (let i = 0; i < 500; i++) {
        const t = i * 0.1;
        let value = 0;
        switch (topic) {
          case "steering":
            value = Math.sin(t * 0.5) * 25 + Math.sin(t * 2) * 5;
            break;
          case "speed":
            value = 35 + Math.sin(t * 0.3) * 10 + Math.random() * 2;
            break;
          case "force":
            value = 2200 + Math.sin(t * 0.7) * 800 + Math.random() * 100;
            break;
          case "brake":
            value = Math.max(0, Math.sin(t * 0.4) * 50 + 20);
            break;
          case "yaw_moment":
            value = Math.sin(t * 0.6) * 450 + Math.random() * 30;
            break;
          default:
            value = Math.sin(t) * 10;
        }
        data.push([t, value]);
      }
    }

    return {
      name: config?.label || topic,
      type: "line" as const,
      data,
      smooth: true,
      symbol: "none",
      lineStyle: {
        width: 2,
        color: config?.color || "#FF5400"
      },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${config?.color || "#FF5400"}40` },
            { offset: 1, color: `${config?.color || "#FF5400"}00` }
          ]
        }
      }
    };
  });

  const option = {
    backgroundColor: "transparent",
    animation: true,
    animationDuration: 300,
    tooltip: {
      trigger: "axis",
      backgroundColor: "hsl(var(--card))",
      borderColor: "hsl(var(--border))",
      textStyle: {
        color: "hsl(var(--foreground))"
      },
      axisPointer: {
        type: "cross",
        lineStyle: {
          color: "hsl(var(--primary))",
          width: 1
        },
        crossStyle: {
          color: "hsl(var(--accent))"
        }
      },
      formatter: (params: any[]) => {
        let result = `<div style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">`;
        result += `<div style="margin-bottom: 4px; color: hsl(var(--muted-foreground));">Time: ${params[0]?.axisValue?.toFixed(2)}s</div>`;
        params.forEach((param: any) => {
          const topic = topics.find(t => topicConfig[t]?.label === param.seriesName);
          const unit = topic ? topicConfig[topic]?.unit : "";
          result += `<div style="color: ${param.color};">${param.seriesName}: ${param.value[1].toFixed(2)} ${unit}</div>`;
        });
        result += `</div>`;
        return result;
      }
    },
    legend: {
      data: topics.map(t => topicConfig[t]?.label || t),
      top: 10,
      textStyle: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 11
      }
    },
    grid: {
      left: 60,
      right: 40,
      top: 50,
      bottom: 60
    },
    xAxis: {
      type: "value",
      name: "Time (s)",
      nameTextStyle: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 11
      },
      axisLine: {
        lineStyle: { color: "hsl(var(--border))" }
      },
      axisLabel: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace"
      },
      splitLine: {
        lineStyle: { color: "hsl(var(--border))", opacity: 0.3 }
      }
    },
    yAxis: topics.map((topic, index) => ({
      type: "value",
      name: topicConfig[topic]?.unit || "",
      position: index % 2 === 0 ? "left" : "right",
      offset: Math.floor(index / 2) * 60,
      nameTextStyle: {
        color: topicConfig[topic]?.color || "#FF5400",
        fontSize: 11
      },
      axisLine: {
        show: true,
        lineStyle: { color: topicConfig[topic]?.color || "#FF5400" }
      },
      axisLabel: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace"
      },
      splitLine: {
        lineStyle: { color: "hsl(var(--border))", opacity: 0.2 }
      }
    })),
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        start: effectiveZoom.start,
        end: effectiveZoom.end,
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
        moveOnMouseWheel: false
      },
      {
        type: "slider",
        xAxisIndex: 0,
        start: effectiveZoom.start,
        end: effectiveZoom.end,
        height: 20,
        bottom: 10,
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--muted))",
        fillerColor: "hsl(var(--primary) / 0.3)",
        handleStyle: {
          color: "hsl(var(--primary))"
        },
        textStyle: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10
        }
      }
    ],
    series: series.map((s, i) => ({ ...s, yAxisIndex: i }))
  };

  const handleZoom = (params: any) => {
    if (params.batch) {
      const { start, end } = params.batch[0];
      setInternalZoom({ start, end });
      if (isLinked && onZoomChange) {
        onZoomChange(start, end);
      }
    } else if (params.start !== undefined) {
      setInternalZoom({ start: params.start, end: params.end });
      if (isLinked && onZoomChange) {
        onZoomChange(params.start, params.end);
      }
    }
  };

  const resetZoom = () => {
    setInternalZoom({ start: 0, end: 100 });
    if (onZoomChange) {
      onZoomChange(0, 100);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading telemetry...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsLinked(!isLinked)}
          title={isLinked ? "Unlink zoom" : "Link zoom"}
        >
          {isLinked ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={resetZoom}
          title="Reset zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-amber-500 mb-2">{error}</p>
      )}
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: "300px", width: "100%" }}
        onEvents={{
          datazoom: handleZoom
        }}
        opts={{ renderer: "canvas" }}
      />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Scroll to zoom • Drag slider to pan • Double-click to reset
      </p>
    </div>
  );
};

export default TelemetryChart;
