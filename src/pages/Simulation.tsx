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
  pointsToPathSlice,
  bandPath,
  centerFromBoundaries,
  SECTOR_COLORS,
  SectorStatus,
} from "@/lib/trackPresets";
import CustomTrackEditor from "@/components/CustomTrackEditor";
import carSprite from "@/assets/car-orange.png";

const CUSTOM_TRACK_STORAGE_KEY = "apextrace.customTrack.v1";

// Convert points to SVG path
const linePath = (points: TrackPoint[]): string => pointsToPath(points);

interface CustomTrackStored {
  left: TrackPoint[];
  right: TrackPoint[];
  sectors?: number[]; // progress fractions in (0..1), sorted
}

const readCustomTrack = (): CustomTrackStored => {
  try {
    const raw = localStorage.getItem(CUSTOM_TRACK_STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return {
        left: obj.left ?? [],
        right: obj.right ?? [],
        sectors: Array.isArray(obj.sectors) ? obj.sectors : undefined,
      };
    }
  } catch {}
  return { left: [], right: [] };
};

const Simulation = () => {
  const { selectedBagId, bags } = useBag();
  const currentBag = bags.find((bag) => bag.id === selectedBagId) || bags[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [, setIsLoading] = useState(false);
  const animationRef = useRef<number>();

  // Track preset selection
  const [trackId, setTrackId] = useState<string>(TRACK_PRESETS[0].id);
  const [editorOpen, setEditorOpen] = useState(false);

  // Custom track state — isolated, never written back to bag data
  const initial = readCustomTrack();
  const [customLeft, setCustomLeft] = useState<TrackPoint[]>(initial.left);
  const [customRight, setCustomRight] = useState<TrackPoint[]>(initial.right);
  const [customSectors, setCustomSectors] = useState<number[]>(
    initial.sectors ?? [1 / 3, 2 / 3]
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_TRACK_STORAGE_KEY,
        JSON.stringify({ left: customLeft, right: customRight, sectors: customSectors })
      );
    } catch {}
  }, [customLeft, customRight, customSectors]);

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

  // Active sector splits (sorted, in 0..1)
  const sectorSplits: number[] = useMemo(() => {
    const raw = isCustom
      ? customSectors
      : preset?.defaultSectors ?? [1 / 3, 2 / 3];
    return [...raw].filter((s) => s > 0 && s < 1).sort((a, b) => a - b);
  }, [isCustom, customSectors, preset]);

  // Sector ranges as [start, end] pairs
  const sectorRanges: Array<[number, number]> = useMemo(() => {
    const splits = [0, ...sectorSplits, 1];
    const ranges: Array<[number, number]> = [];
    for (let i = 0; i < splits.length - 1; i++) ranges.push([splits[i], splits[i + 1]]);
    return ranges;
  }, [sectorSplits]);

  // ===== F1-style sector timing =====
  // Best (personal best) and previous-lap times per sector.
  const sectorCount = sectorRanges.length;
  const [sectorBest, setSectorBest] = useState<number[]>(() =>
    Array(sectorCount).fill(Infinity)
  );
  const [sectorPrev, setSectorPrev] = useState<number[]>(() =>
    Array(sectorCount).fill(Infinity)
  );
  // Times for the lap currently being driven
  const [sectorCurrent, setSectorCurrent] = useState<number[]>(() =>
    Array(sectorCount).fill(0)
  );
  // Status per sector (drives the colour of the centerline slice)
  const [sectorStatus, setSectorStatus] = useState<SectorStatus[]>(() =>
    Array(sectorCount).fill("pending")
  );
  // Track which sector the car is in & when it entered
  const [activeSector, setActiveSector] = useState(0);
  const sectorEnterTimeRef = useRef(0);
  const lastProgressRef = useRef(0);

  // Resize sector arrays when split count changes (e.g. user edits sectors).
  useEffect(() => {
    setSectorBest((arr) =>
      arr.length === sectorCount ? arr : Array(sectorCount).fill(Infinity)
    );
    setSectorPrev((arr) =>
      arr.length === sectorCount ? arr : Array(sectorCount).fill(Infinity)
    );
    setSectorCurrent((arr) =>
      arr.length === sectorCount ? arr : Array(sectorCount).fill(0)
    );
    setSectorStatus((arr) =>
      arr.length === sectorCount ? arr : Array(sectorCount).fill("pending")
    );
  }, [sectorCount]);

  // Resolve current sector index from progress
  const progressToSector = useCallback(
    (p: number) => {
      for (let i = 0; i < sectorRanges.length; i++) {
        const [a, b] = sectorRanges[i];
        if (p >= a && p < b) return i;
      }
      return sectorRanges.length - 1;
    },
    [sectorRanges]
  );

  // Watch progress: when car crosses into a new sector OR completes a lap,
  // record the time for the sector we just left and pick the F1 colour.
  useEffect(() => {
    const prevProgress = lastProgressRef.current;
    lastProgressRef.current = carProgress;

    const newSector = progressToSector(carProgress);

    // Lap rollover: progress jumped backwards past the start line
    const lapRollover = carProgress + 0.5 < prevProgress;

    if (lapRollover) {
      // Close the final sector
      const closing = activeSector;
      const elapsed = currentTime - sectorEnterTimeRef.current;
      finalizeSector(closing, elapsed);
      // Reset for new lap
      setSectorCurrent(Array(sectorCount).fill(0));
      setSectorStatus(Array(sectorCount).fill("pending"));
      setActiveSector(0);
      sectorEnterTimeRef.current = currentTime;
      return;
    }

    if (newSector !== activeSector) {
      const closing = activeSector;
      const elapsed = currentTime - sectorEnterTimeRef.current;
      finalizeSector(closing, elapsed);
      setActiveSector(newSector);
      sectorEnterTimeRef.current = currentTime;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carProgress, progressToSector]);

  const finalizeSector = (sectorIdx: number, elapsed: number) => {
    if (elapsed <= 0.05) return; // ignore noisy transitions
    setSectorCurrent((arr) => {
      const next = [...arr];
      next[sectorIdx] = elapsed;
      return next;
    });
    setSectorBest((bestArr) => {
      const prevBest = bestArr[sectorIdx] ?? Infinity;
      const prevTime = sectorPrev[sectorIdx] ?? Infinity;
      let status: SectorStatus = "yellow";
      if (elapsed < prevBest) status = "purple";
      else if (elapsed < prevTime) status = "green";
      else status = "yellow";

      setSectorStatus((stat) => {
        const next = [...stat];
        next[sectorIdx] = status;
        return next;
      });
      const nextBest = [...bestArr];
      if (elapsed < prevBest) nextBest[sectorIdx] = elapsed;
      return nextBest;
    });
    setSectorPrev((arr) => {
      const next = [...arr];
      next[sectorIdx] = elapsed;
      return next;
    });
  };

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
    setSectorStatus(Array(sectorCount).fill("pending"));
    setSectorCurrent(Array(sectorCount).fill(0));
    setActiveSector(0);
    sectorEnterTimeRef.current = 0;
    lastProgressRef.current = 0;
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
      if (!hasCustom) setEditorOpen(true);
    } else {
      setTrackId(value);
    }
    setCarProgress(0);
    setSectorStatus(Array(sectorCount).fill("pending"));
  };

  // Find a point along the centerline at a given progress fraction
  const pointAt = (frac: number): TrackPoint | null => {
    if (centerPoints.length < 2) return null;
    const exactIndex = frac * (centerPoints.length - 1);
    const i = Math.floor(exactIndex);
    const j = Math.min(i + 1, centerPoints.length - 1);
    const t = exactIndex - i;
    return {
      x: centerPoints[i].x + (centerPoints[j].x - centerPoints[i].x) * t,
      y: centerPoints[i].y + (centerPoints[j].y - centerPoints[i].y) * t,
    };
  };

  // Car sticker size in viewBox units
  const CAR_W = 5;
  const CAR_H = 7;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <BagSidebar />

      <CustomTrackEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialLeft={customLeft}
        initialRight={customRight}
        initialSectors={customSectors}
        bagTrack={telemetryData?.track}
        onSave={(l, r, s) => {
          setCustomLeft(l);
          setCustomRight(r);
          if (s) setCustomSectors(s);
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
                  {/* Track surface */}
                  {isCustom ? (
                    hasCustom ? (
                      <>
                        <path d={bandPath(customLeft, customRight)} fill="hsl(var(--muted))" opacity="0.4" />
                        <path d={linePath(customLeft)} fill="none" stroke="hsl(48, 96%, 53%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
                        <path d={linePath(customRight)} fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    ) : (
                      <g>
                        <rect x="10" y="40" width="80" height="20" fill="hsl(var(--muted))" opacity="0.2" rx="2" />
                        <text x="50" y="52" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="3">
                          No custom track yet — click "Open Editor" to draw one
                        </text>
                      </g>
                    )
                  ) : preset ? (
                    <>
                      <path d={preset.outerPath} fill="hsl(var(--muted))" opacity="0.4" fillRule="evenodd" />
                      <path d={preset.innerPath} fill="hsl(var(--background))" fillRule="evenodd" />
                      <path d={preset.outerPath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.6" />
                      <path d={preset.innerPath} fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.6" />
                    </>
                  ) : null}

                  {/* Sector-coloured centerline (F1 timing colours) */}
                  {centerPoints.length > 1 &&
                    sectorRanges.map(([a, b], i) => (
                      <path
                        key={`sector-${i}`}
                        d={pointsToPathSlice(centerPoints, a, b)}
                        fill="none"
                        stroke={SECTOR_COLORS[sectorStatus[i] ?? "pending"]}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={sectorStatus[i] === "pending" ? 0.55 : 1}
                        style={{
                          filter:
                            sectorStatus[i] && sectorStatus[i] !== "pending"
                              ? `drop-shadow(0 0 3px ${SECTOR_COLORS[sectorStatus[i]!]})`
                              : undefined,
                        }}
                      />
                    ))}

                  {/* Sector split markers */}
                  {sectorSplits.map((s, i) => {
                    const p = pointAt(s);
                    if (!p) return null;
                    return (
                      <g key={`split-${i}`}>
                        <circle cx={p.x} cy={p.y} r="1.2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
                        <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2.2" fill="hsl(var(--foreground))" fontWeight="bold">
                          S{i + 1}/S{i + 2}
                        </text>
                      </g>
                    );
                  })}

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

              {/* Sector legend / live timing */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {sectorRanges.map((_, i) => {
                  const status = sectorStatus[i] ?? "pending";
                  return (
                    <div
                      key={`leg-${i}`}
                      className="p-3 rounded-lg border border-dashboard-border bg-muted/30 flex items-center gap-3"
                      style={{ borderLeft: `3px solid ${SECTOR_COLORS[status]}` }}
                    >
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Sector {i + 1}
                      </span>
                      <span className="ml-auto font-telemetry text-sm">
                        {sectorCurrent[i] && sectorCurrent[i] > 0
                          ? `${sectorCurrent[i].toFixed(2)}s`
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 p-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-1 rounded-full" style={{ background: SECTOR_COLORS.purple }} /> Personal best
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-1 rounded-full" style={{ background: SECTOR_COLORS.green }} /> Improved
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-1 rounded-full" style={{ background: SECTOR_COLORS.yellow }} /> Slower
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-1 rounded-full" style={{ background: SECTOR_COLORS.pending }} /> Pending
                </span>
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
