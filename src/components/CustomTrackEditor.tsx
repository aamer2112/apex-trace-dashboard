import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Save, Upload, Pencil, X, Flag, Plus, Minus } from "lucide-react";
import {
  TrackPoint,
  normalizeBagTrack,
  centerFromBoundaries,
  pointsToPath,
  SECTOR_COLORS,
} from "@/lib/trackPresets";
import type { TelemetryData } from "@/lib/api";

interface CustomTrackEditorProps {
  open: boolean;
  onClose: () => void;
  initialLeft?: TrackPoint[];
  initialRight?: TrackPoint[];
  initialSectors?: number[];
  bagTrack?: TelemetryData["track"];
  onSave: (left: TrackPoint[], right: TrackPoint[], sectors?: number[]) => void;
}

type Tool = "left" | "right" | "sector";

const SVG_SIZE = 100;

export const CustomTrackEditor = ({
  open,
  onClose,
  initialLeft = [],
  initialRight = [],
  initialSectors,
  bagTrack,
  onSave,
}: CustomTrackEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [left, setLeft] = useState<TrackPoint[]>(initialLeft);
  const [right, setRight] = useState<TrackPoint[]>(initialRight);
  const [sectors, setSectors] = useState<number[]>(initialSectors ?? [1 / 3, 2 / 3]);
  const [tool, setTool] = useState<Tool>("left");
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (open) {
      setLeft(initialLeft);
      setRight(initialRight);
      setSectors(initialSectors ?? [1 / 3, 2 / 3]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const center = useMemo(() => centerFromBoundaries(left, right), [left, right]);

  if (!open) return null;

  const toSvgCoords = (e: React.PointerEvent<SVGSVGElement>): TrackPoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: Math.max(0, Math.min(SVG_SIZE, local.x)), y: Math.max(0, Math.min(SVG_SIZE, local.y)) };
  };

  // Project a clicked point onto the centerline → returns progress fraction 0..1
  const projectToCenter = (p: TrackPoint): number | null => {
    if (center.length < 2) return null;
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < center.length; i++) {
      const d = Math.hypot(center[i].x - p.x, center[i].y - p.y);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    return bestI / (center.length - 1);
  };

  const addPoint = (p: TrackPoint) => {
    if (tool === "left") setLeft((arr) => [...arr, p]);
    else if (tool === "right") setRight((arr) => [...arr, p]);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toSvgCoords(e);
    if (!p) return;
    if (tool === "sector") {
      const frac = projectToCenter(p);
      if (frac !== null && frac > 0.02 && frac < 0.98) {
        setSectors((arr) =>
          [...arr, frac].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
        );
      }
      return;
    }
    setDrawing(true);
    addPoint(p);
  };
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing || tool === "sector") return;
    const p = toSvgCoords(e);
    if (!p) return;
    const arr = tool === "left" ? left : right;
    const last = arr[arr.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.6) addPoint(p);
  };
  const handlePointerUp = () => setDrawing(false);

  const loadFromBag = () => {
    if (!bagTrack || bagTrack.length === 0) return;
    const { left: l, right: r, all } = normalizeBagTrack(bagTrack);
    if (l.length > 1 || r.length > 1) {
      setLeft(l);
      setRight(r);
    } else if (all.length > 1) {
      setLeft(all);
      setRight([]);
    }
  };

  const polyToPath = (pts: TrackPoint[]) => pointsToPath(pts);

  // For drawing the sector dividers we need the centerline point at a fraction
  const pointAt = (frac: number): TrackPoint | null => {
    if (center.length < 2) return null;
    const exact = frac * (center.length - 1);
    const i = Math.floor(exact);
    const j = Math.min(i + 1, center.length - 1);
    const t = exact - i;
    return {
      x: center[i].x + (center[j].x - center[i].x) * t,
      y: center[i].y + (center[j].y - center[i].y) * t,
    };
  };

  // Sector ranges for preview colouring of the centerline
  const sectorRanges: Array<[number, number]> = (() => {
    const splits = [0, ...sectors.filter((s) => s > 0 && s < 1).sort((a, b) => a - b), 1];
    const ranges: Array<[number, number]> = [];
    for (let i = 0; i < splits.length - 1; i++) ranges.push([splits[i], splits[i + 1]]);
    return ranges;
  })();

  const sliceCenter = (a: number, b: number) => {
    if (center.length < 2) return "";
    const i0 = Math.floor(a * (center.length - 1));
    const i1 = Math.ceil(b * (center.length - 1));
    return polyToPath(center.slice(i0, i1 + 1));
  };

  // Cycle through preview colors for sectors so the user can see the splits.
  const previewColors = [SECTOR_COLORS.purple, SECTOR_COLORS.green, SECTOR_COLORS.yellow, SECTOR_COLORS.pending];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <Card className="p-6 bg-card border-dashboard-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Custom Track Editor</h2>
              <p className="text-xs text-muted-foreground">
                Draw boundaries with your mouse and click along the centerline to add sector splits.
                The custom track is stored only in this session and never modifies the uploaded ROS2 bag.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button variant={tool === "left" ? "default" : "outline"} size="sm" onClick={() => setTool("left")} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Draw Left Edge
            </Button>
            <Button variant={tool === "right" ? "default" : "outline"} size="sm" onClick={() => setTool("right")} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Draw Right Edge
            </Button>
            <Button
              variant={tool === "sector" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("sector")}
              disabled={center.length < 2}
              className="gap-2"
              title={center.length < 2 ? "Draw both edges first" : "Click on centerline to add sector split"}
            >
              <Flag className="h-3.5 w-3.5" /> Add Sector Split
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={() => setLeft([])} className="gap-2">
              <Eraser className="h-3.5 w-3.5" /> Clear Left
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRight([])} className="gap-2">
              <Eraser className="h-3.5 w-3.5" /> Clear Right
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSectors([])} className="gap-2">
              <Eraser className="h-3.5 w-3.5" /> Clear Sectors
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={loadFromBag} disabled={!bagTrack || bagTrack.length === 0} className="gap-2">
              <Upload className="h-3.5 w-3.5" /> Load from Bag
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => onSave(left, right, sectors)}
                disabled={left.length < 2 || right.length < 2}
                className="gap-2"
              >
                <Save className="h-3.5 w-3.5" /> Save & Use
              </Button>
            </div>
          </div>

          {/* Sector list */}
          {sectors.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground uppercase tracking-wider">
                Sectors ({sectors.length + 1}):
              </span>
              {sectors.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-dashboard-border bg-muted/40 font-telemetry"
                >
                  Split {i + 1} @ {(s * 100).toFixed(0)}%
                  <button
                    type="button"
                    onClick={() => setSectors((arr) => arr.filter((_, j) => j !== i))}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove split ${i + 1}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1 text-xs"
                onClick={() => setSectors([1 / 3, 2 / 3])}
              >
                <Plus className="h-3 w-3" /> Reset 3 Sectors
              </Button>
            </div>
          )}

          <div className="relative bg-dashboard-grid rounded-lg border border-dashboard-border overflow-hidden" style={{ height: "70vh" }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ cursor: tool === "sector" ? "pointer" : "crosshair", touchAction: "none" }}
            >
              {/* Grid */}
              {Array.from({ length: 11 }).map((_, i) => (
                <g key={i}>
                  <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="hsl(var(--border))" strokeWidth="0.1" opacity="0.5" />
                  <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="hsl(var(--border))" strokeWidth="0.1" opacity="0.5" />
                </g>
              ))}

              {/* Right boundary (blue) */}
              <path d={polyToPath(right)} fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
              {right.map((p, i) => (
                <circle key={`r${i}`} cx={p.x} cy={p.y} r="0.5" fill="hsl(217, 91%, 60%)" />
              ))}

              {/* Left boundary (yellow) */}
              <path d={polyToPath(left)} fill="none" stroke="hsl(48, 96%, 53%)" strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round" />
              {left.map((p, i) => (
                <circle key={`l${i}`} cx={p.x} cy={p.y} r="0.5" fill="hsl(48, 96%, 53%)" />
              ))}

              {/* Centerline coloured by sector preview */}
              {center.length > 1 &&
                sectorRanges.map(([a, b], i) => (
                  <path
                    key={`csec-${i}`}
                    d={sliceCenter(a, b)}
                    fill="none"
                    stroke={previewColors[i % previewColors.length]}
                    strokeWidth="0.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                ))}

              {/* Sector split markers */}
              {sectors.map((s, i) => {
                const p = pointAt(s);
                if (!p) return null;
                return (
                  <g key={`split-${i}`}>
                    <circle cx={p.x} cy={p.y} r="1.4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
                    <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="2.4" fill="hsl(var(--foreground))" fontWeight="bold">
                      S{i + 1}/S{i + 2}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-3 left-3 text-xs bg-background/80 backdrop-blur px-3 py-2 rounded border border-dashboard-border space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-[hsl(48,96%,53%)]" /> Left edge ({left.length} pts)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-[hsl(217,91%,60%)]" /> Right edge ({right.length} pts)
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-3 w-3" /> Sectors: {sectors.length + 1}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomTrackEditor;
