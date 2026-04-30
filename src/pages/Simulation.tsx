import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBag } from "@/contexts/BagContext";
import TopNav from "@/components/TopNav";
import BagSidebar from "@/components/BagSidebar";
import { streamBagData, generateMockTelemetry, TelemetryData } from "@/lib/api";
import {
  TRACK_PRESETS,
  CUSTOM_TRACK_ID,
  TrackPoint,
  pointsToPath,
  bandPath,
  centerFromBoundaries,
} from "@/lib/trackPresets";
import CustomTrackEditor from "@/components/CustomTrackEditor";
import carSprite from "@/assets/car-sticker.png";

const CUSTOM_TRACK_STORAGE_KEY = "apextrace.customTrack.v1";

// Convert points to SVG path
const linePath = (points: TrackPoint[]): string => pointsToPath(points);

const Simulation = () => {
  const { selectedBagId, bags } = useBag();
  const currentBag = bags.find((bag) => bag.id === selectedBagId) || bags[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number>();

  // Track preset selection
  const [trackId, setTrackId] = useState<string>(TRACK_PRESETS[0].id);
  const [editorOpen, setEditorOpen] = useState(false);
  // Custom track is isolated state — never written back to bag data.
  // Persisted in localStorage so it survives reloads.
  const [customLeft, setCustomLeft] = useState<TrackPoint[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TRACK_STORAGE_KEY);
      if (raw) return JSON.parse(raw).left ?? [];
    } catch {}
    return [];
  });
  const [customRight, setCustomRight] = useState<TrackPoint[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_TRACK_STORAGE_KEY);
      if (raw) return JSON.parse(raw).right ?? [];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_TRACK_STORAGE_KEY,
        JSON.stringify({ left: customLeft, right: customRight })
      );
    } catch {}
  }, [customLeft, customRight]);

  // Fetch telemetry data when bag changes
  const fetchTelemetryData = useCallback(async () => {
    if (!currentBag) return;
    setIsLoading(true);
    const data = await streamBagData(currentBag.name);
    if (data) setTelemetryData(data);
    else setTelemetryData(generateMockTelemetry(currentBag.name, 500));
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

  // Current telemetry values (drives car dynamics regardless of track choice)
  const idx = Math.min(currentDataIndex, (telemetryData?.steering?.length || 1) - 1);
  const steeringAngle = telemetryData?.steering?.[idx] ?? 0;
  const speed = telemetryData?.speed?.[idx] ?? 42;
  const force = telemetryData?.force?.[idx] ?? 2500;
  const yawMoment = telemetryData?.yaw_moment?.[idx] ?? 450;
  const gForceX = Math.cos(currentTime * 0.5) * (speed / 40);
  const gForceY = Math.sin(currentTime * 0.3) * (speed / 60);

  // Resolve current track geometry. Custom is isolated — does not modify bag data.
  const isCustom = trackId === CUSTOM_TRACK_ID;
  const preset = TRACK_PRESETS.find((p) => p.id === trackId);

  const customCenter = useMemo(
    () => centerFromBoundaries(customLeft, customRight),
    [customLeft, customRight]
  );
  const hasCustom = customLeft.length > 1 && customRight.length > 1;

  // Centerline that the car follows
  const centerPoints: TrackPoint[] =
    isCustom && hasCustom ? customCenter : preset?.centerPoints ?? [];

  // Car position from progress along centerline
  const getCarPosition = (progress: number) => {
    if (centerPoints.length < 2) return { x: 50, y: 50, rotation: 0 };
    const totalPoints = centerPoints.length;
    const exactIndex = progress * (totalPoints - 1);
    const index = Math.floor(exactIndex);
    const nextIndex = Math.min(index + 1, totalPoints - 1);
    const t = exactIndex - index;
    const current = centerPoints[index];
    const next = centerPoints[nextIndex];
    const x = current.x + (next.x - current.x) * t;
    const y = current.y + (next.y - current.y) * t;
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    // Sprite is oriented "nose up" → rotate so up aligns with travel direction.
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    return { x, y, rotation };
  };

  const carPosition = getCarPosition(carProgress);

  const getVisibleLinePath = (points: TrackPoint[], progress: number) => {
    const visibleCount = Math.max(2, Math.ceil(progress * points.length) + 3);
    return linePath(points.slice(0, Math.min(visibleCount, points.length)));
  };

  useEffect(() => {
    if (isPlaying && telemetryData) {
      const totalPoints = telemetryData.timestamps?.length || 500;
      const animate = () => {
        setCurrentDataIndex((prev) => {
          const next = prev + Math.ceil(playbackSpeed);
          return next >= totalPoints ? 0 : next;
        });
        setCurrentTime((prev) => {
          const next = prev + 0.02 * playbackSpeed;
          return next >= maxTime ? 0 : next;
        });
        // Speed-driven progress: faster bag speed → faster car movement on track
        setCarProgress((prev) => {
          const speedFactor = Math.max(0.2, speed / 40);
          const next = prev + 0.0015 * playbackSpeed * speedFactor;
          return next >= 1 ? 0 : next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, playbackSpeed, maxTime, telemetryData, speed]);

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

  const handleTrackChange = (value: string) => {
    if (value === CUSTOM_TRACK_ID) {
      setTrackId(CUSTOM_TRACK_ID);
      // Open editor automatically the first time if no custom track exists
      if (!hasCustom) setEditorOpen(true);
    } else {
      setTrackId(value);
    }
    setCarProgress(0);
  };

  // Car sprite size in viewBox units
  // Car sticker size in viewBox units (sticker has its own border + background)
  const CAR_W = 7;
  const CAR_H = 10;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />

      <CustomTrackEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialLeft={customLeft}
        initialRight={customRight}
        bagTrack={telemetryData?.track}
        onSave={(l, r) => {
          setCustomLeft(l);
          setCustomRight(r);
          setEditorOpen(false);
          setTrackId(CUSTOM_TRACK_ID);
          setCarProgress(0);
        }}
      />

      <main className="ml-80 mt-14 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">2D Track Simulation</h2>
              <p className="text-sm text-muted-foreground">
                {currentBag?.name || `Bag #${selectedBagId}`} •{" "}
                {isCustom ? "Custom drawn track" : preset?.name} • Telemetry-driven dynamics
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Track</label>
                <Select value={trackId} onValueChange={handleTrackChange}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_TRACK_ID}>Custom Track / Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                {hasCustom ? "Edit Custom Track" : "Open Editor"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2D Track Visualization */}
            <Card className="lg:col-span-2 p-6 bg-card border-dashboard-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Track View</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative bg-dashboard-grid rounded-lg border border-dashboard-border overflow-hidden" style={{ height: "400px" }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
                >
                  {isCustom ? (
                    <>
                      {hasCustom ? (
                        <>
                          {/* Track surface band between left/right */}
                          <path d={bandPath(customLeft, customRight)} fill="hsl(var(--muted))" opacity="0.4" />
                          {/* Left edge (yellow) */}
                          <path d={linePath(customLeft)} fill="none" stroke="hsl(48, 96%, 53%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
                          {/* Right edge (blue) */}
                          <path d={linePath(customRight)} fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
                          {/* Centerline trail */}
                          <path d={getVisibleLinePath(centerPoints, carProgress)} fill="none" stroke="hsl(0, 84%, 50%)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_hsl(0,84%,50%)]" />
                        </>
                      ) : (
                        <g>
                          <rect x="10" y="40" width="80" height="20" fill="hsl(var(--muted))" opacity="0.2" rx="2" />
                          <text x="50" y="52" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="3">
                            No custom track yet — click "Open Editor" to draw one
                          </text>
                        </g>
                      )}
                    </>
                  ) : preset ? (
                    <>
                      {/* Track surface (outer) */}
                      <path d={preset.outerPath} fill="hsl(var(--muted))" opacity="0.4" fillRule="evenodd" />
                      {/* Track inner cutout */}
                      <path d={preset.innerPath} fill="hsl(var(--background))" fillRule="evenodd" />
                      {/* Borders */}
                      <path d={preset.outerPath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.6" />
                      <path d={preset.innerPath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.6" />
                      {/* Centerline trail */}
                      <path d={getVisibleLinePath(centerPoints, carProgress)} fill="none" stroke="hsl(0, 84%, 50%)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_hsl(0,84%,50%)]" />
                    </>
                  ) : null}

                  {/* Car sprite (top-down) */}
                  {centerPoints.length > 1 && (
                    <g transform={`translate(${carPosition.x}, ${carPosition.y}) rotate(${carPosition.rotation})`}>
                      <image
                        href={carSprite}
                        x={-CAR_W / 2}
                        y={-CAR_H / 2}
                        width={CAR_W}
                        height={CAR_H}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ filter: "drop-shadow(0 0 1.5px rgba(0,0,0,0.6))" }}
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 p-3 bg-muted/30 rounded-lg border border-dashboard-border">
                {isCustom ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded-full bg-[hsl(48,96%,53%)]" />
                      <span className="text-xs text-muted-foreground">Left Edge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded-full bg-[hsl(217,91%,60%)]" />
                      <span className="text-xs text-muted-foreground">Right Edge</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 rounded-full bg-[hsl(0,84%,50%)]" />
                    <span className="text-xs text-muted-foreground">Vehicle Path</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Dynamics: speed/steering/force from ROS2 bag</span>
                </div>
              </div>
            </Card>

            {/* Right side panels */}
            <div className="space-y-6">
              {/* Speedometer */}
              <Card className="p-6 bg-card border-dashboard-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Speedometer</h3>
                <div className="relative flex items-center justify-center">
                  <svg width="160" height="100" viewBox="0 0 160 100">
                    <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(speed / 80) * 188} 188`} />
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
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">G-Force</h3>
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    <circle cx="60" cy="60" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
                    <circle cx="60" cy="60" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.2" />
                    <line x1="10" y1="60" x2="110" y2="60" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    <line x1="60" y1="10" x2="60" y2="110" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.3" />
                    <circle cx={60 + gForceX * 25} cy={60 - gForceY * 25} r="8" fill="hsl(var(--primary))" className="drop-shadow-[0_0_8px_hsl(var(--primary))]" />
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
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Live Telemetry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Steering Angle", value: steeringAngle.toFixed(1), unit: "deg" },
                { label: "Speed", value: speed.toFixed(1), unit: "m/s" },
                { label: "Force", value: force.toFixed(0), unit: "N" },
                { label: "Yaw Moment", value: yawMoment.toFixed(0), unit: "Nm" },
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
                <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)} className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden cursor-pointer" onClick={handleScrub}>
                  <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all" style={{ width: `${(currentTime / maxTime) * 100}%` }} />
                </div>
                <span className="text-xs font-telemetry text-muted-foreground min-w-[80px]">
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, "0")} / 10:52
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Speed:</span>
                {[0.5, 1, 2, 4].map((s) => (
                  <Button key={s} variant={playbackSpeed === s ? "default" : "ghost"} size="sm" onClick={() => setPlaybackSpeed(s)} className="h-7 text-xs">
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
