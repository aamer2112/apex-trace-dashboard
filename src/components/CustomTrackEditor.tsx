import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Save, Upload, Pencil, X } from "lucide-react";
import { TrackPoint, normalizeBagTrack } from "@/lib/trackPresets";
import type { TelemetryData } from "@/lib/api";

interface CustomTrackEditorProps {
  open: boolean;
  onClose: () => void;
  initialLeft?: TrackPoint[];
  initialRight?: TrackPoint[];
  bagTrack?: TelemetryData["track"];
  onSave: (left: TrackPoint[], right: TrackPoint[]) => void;
}

type Tool = "left" | "right";

const SVG_SIZE = 100;

export const CustomTrackEditor = ({
  open,
  onClose,
  initialLeft = [],
  initialRight = [],
  bagTrack,
  onSave,
}: CustomTrackEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [left, setLeft] = useState<TrackPoint[]>(initialLeft);
  const [right, setRight] = useState<TrackPoint[]>(initialRight);
  const [tool, setTool] = useState<Tool>("left");
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    if (open) {
      setLeft(initialLeft);
      setRight(initialRight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const addPoint = (p: TrackPoint) => {
    if (tool === "left") setLeft((arr) => [...arr, p]);
    else setRight((arr) => [...arr, p]);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setDrawing(true);
    const p = toSvgCoords(e);
    if (p) addPoint(p);
  };
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const p = toSvgCoords(e);
    if (!p) return;
    // throttle: only add if far enough from last point
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
      // No left/right typing — use all points as a guideline on the left layer
      setLeft(all);
      setRight([]);
    }
  };

  const polyToPath = (pts: TrackPoint[]) =>
    pts.length === 0
      ? ""
      : pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <Card className="p-6 bg-card border-dashboard-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Custom Track Editor</h2>
              <p className="text-xs text-muted-foreground">
                Draw with your mouse. The custom track is stored only in this session and never modifies the uploaded ROS2 bag.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant={tool === "left" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("left")}
              className="gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Draw Left Edge
            </Button>
            <Button
              variant={tool === "right" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("right")}
              className="gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Draw Right Edge
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="outline" size="sm" onClick={() => setLeft([])} className="gap-2">
              <Eraser className="h-3.5 w-3.5" />
              Clear Left
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRight([])} className="gap-2">
              <Eraser className="h-3.5 w-3.5" />
              Clear Right
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={loadFromBag}
              disabled={!bagTrack || bagTrack.length === 0}
              className="gap-2"
            >
              <Upload className="h-3.5 w-3.5" />
              Load from Bag
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => onSave(left, right)}
                disabled={left.length < 2 || right.length < 2}
                className="gap-2"
              >
                <Save className="h-3.5 w-3.5" />
                Save & Use
              </Button>
            </div>
          </div>

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
              style={{ cursor: "crosshair", touchAction: "none" }}
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
            </svg>

            <div className="absolute bottom-3 left-3 text-xs bg-background/80 backdrop-blur px-3 py-2 rounded border border-dashboard-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-1 rounded-full bg-[hsl(48,96%,53%)]" /> Left edge ({left.length} pts)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-full bg-[hsl(217,91%,60%)]" /> Right edge ({right.length} pts)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomTrackEditor;
