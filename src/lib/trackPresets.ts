// Track preset definitions used by the Simulation page.
// Each preset provides outer/inner SVG paths plus a centerline used to drive the car.

export interface TrackPoint { x: number; y: number; }

export interface TrackPreset {
  id: string;
  name: string;
  outerPath: string;
  innerPath: string;
  // Centerline points the car will follow (proportional to viewBox 0..100)
  centerPoints: TrackPoint[];
  // Optional ideal racing line; defaults to centerPoints when omitted
  optimalLine?: TrackPoint[];
}

// ---- Monza-style (existing) ----
const monzaOuter = `
  M 50 85 L 85 85 Q 92 85 92 78 L 92 70 Q 92 65 88 62 L 75 55
  Q 70 52 65 55 L 55 62 Q 50 65 45 62 L 35 55 Q 30 52 25 55 L 18 62
  Q 12 68 12 75 L 12 82 Q 12 90 20 92 L 25 92 Q 28 92 30 88 L 32 80
  Q 34 75 38 73 L 45 73 Q 50 73 50 78 L 50 85 Z
`;
const monzaInner = `
  M 55 80 L 80 80 Q 85 80 85 75 L 85 70 Q 85 67 82 65 L 72 60
  Q 68 58 64 60 L 56 65 Q 52 67 48 65 L 40 60 Q 36 58 32 60 L 25 65
  Q 20 68 20 73 L 20 78 Q 20 82 25 84 L 30 84 Q 33 84 35 81 L 37 77
  Q 39 74 43 73 L 48 73 Q 52 73 54 76 L 55 80 Z
`;
const monzaCenter: TrackPoint[] = [
  { x: 52, y: 82 }, { x: 68, y: 82 }, { x: 82, y: 80 }, { x: 87, y: 72 },
  { x: 82, y: 60 }, { x: 70, y: 56 }, { x: 60, y: 62 }, { x: 50, y: 64 },
  { x: 42, y: 60 }, { x: 32, y: 58 }, { x: 22, y: 65 }, { x: 18, y: 76 },
  { x: 24, y: 86 }, { x: 32, y: 82 }, { x: 40, y: 76 }, { x: 48, y: 76 },
];

// ---- Skidpad (figure-eight) ----
const skidpadCenter: TrackPoint[] = (() => {
  const pts: TrackPoint[] = [];
  const r = 18;
  // Right circle
  for (let a = 180; a >= -180; a -= 20) {
    const rad = (a * Math.PI) / 180;
    pts.push({ x: 65 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) });
  }
  // Left circle
  for (let a = 0; a >= -360; a -= 20) {
    const rad = (a * Math.PI) / 180;
    pts.push({ x: 35 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) });
  }
  return pts;
})();
const skidpadOuter =
  `M 47 30 A 22 22 0 1 1 47 70 A 22 22 0 1 1 47 30 Z ` +
  `M 53 30 A 22 22 0 1 0 53 70 A 22 22 0 1 0 53 30 Z`;
const skidpadInner =
  `M 51 35 A 14 14 0 1 1 51 65 A 14 14 0 1 1 51 35 Z ` +
  `M 49 35 A 14 14 0 1 0 49 65 A 14 14 0 1 0 49 35 Z`;

// ---- Hockenheim-style oval-ish ----
const hockOuter = `M 15 30 L 85 30 Q 95 30 95 50 Q 95 70 85 70 L 60 70 Q 50 70 50 80 Q 50 90 40 90 L 25 90 Q 15 90 15 80 Z`;
const hockInner = `M 25 40 L 78 40 Q 85 40 85 50 Q 85 60 78 60 L 55 60 Q 45 60 45 75 Q 45 80 40 80 L 30 80 Q 25 80 25 75 Z`;
const hockCenter: TrackPoint[] = [
  { x: 20, y: 35 }, { x: 40, y: 35 }, { x: 60, y: 35 }, { x: 80, y: 35 },
  { x: 90, y: 50 }, { x: 80, y: 65 }, { x: 60, y: 65 }, { x: 52, y: 75 },
  { x: 40, y: 85 }, { x: 25, y: 85 }, { x: 20, y: 70 }, { x: 20, y: 50 },
];

export const TRACK_PRESETS: TrackPreset[] = [
  { id: "monza", name: "Monza Style", outerPath: monzaOuter, innerPath: monzaInner, centerPoints: monzaCenter },
  { id: "skidpad", name: "Skidpad (Figure-8)", outerPath: skidpadOuter, innerPath: skidpadInner, centerPoints: skidpadCenter },
  { id: "hockenheim", name: "Hockenheim Style", outerPath: hockOuter, innerPath: hockInner, centerPoints: hockCenter },
];

export const CUSTOM_TRACK_ID = "custom";

export const pointsToPath = (points: TrackPoint[]): string => {
  if (points.length === 0) return "";
  return points.reduce((path, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`), "");
};

// Build a closed band path between left & right boundaries (for fill).
export const bandPath = (left: TrackPoint[], right: TrackPoint[]): string => {
  if (left.length < 2 || right.length < 2) return "";
  const fwd = left.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const back = [...right].reverse().map((p) => `L ${p.x} ${p.y}`).join(" ");
  return `${fwd} ${back} Z`;
};

// Compute centerline from two boundary arrays by averaging the closer point pairs.
export const centerFromBoundaries = (left: TrackPoint[], right: TrackPoint[]): TrackPoint[] => {
  if (left.length < 2 || right.length < 2) return [];
  const n = Math.min(left.length, right.length);
  const out: TrackPoint[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ x: (left[i].x + right[i].x) / 2, y: (left[i].y + right[i].y) / 2 });
  }
  return out;
};

// Convert raw bag track points (world coords) into normalized 0..100 viewBox space.
export const normalizeBagTrack = (
  points: Array<{ x: number; y: number; type?: string }>
): { left: TrackPoint[]; right: TrackPoint[]; all: TrackPoint[] } => {
  if (!points || points.length === 0) return { left: [], right: [], all: [] };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = Math.max(1e-6, maxX - minX);
  const h = Math.max(1e-6, maxY - minY);
  const scale = 80 / Math.max(w, h);
  const offX = 50 - ((minX + w / 2) * scale);
  const offY = 50 - ((minY + h / 2) * scale);
  const norm = (p: { x: number; y: number }) => ({
    x: p.x * scale + offX,
    y: p.y * scale + offY,
  });
  const left = points.filter((p) => p.type === "left" || p.type === "yellow").map(norm);
  const right = points.filter((p) => p.type === "right" || p.type === "blue").map(norm);
  const all = points.map(norm);
  return { left, right, all };
};
