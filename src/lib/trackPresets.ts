// Track preset definitions used by the Simulation page.
// Each preset provides outer/inner SVG paths plus a centerline used to drive the car.
// Tracks are also split into 3 sectors (F1-style) with timing colors.

export interface TrackPoint { x: number; y: number; }

export interface TrackPreset {
  id: string;
  name: string;
  outerPath: string;
  innerPath: string;
  /** Centerline points the car will follow (proportional to viewBox 0..100) */
  centerPoints: TrackPoint[];
  /** Optional ideal racing line; defaults to centerPoints when omitted */
  optimalLine?: TrackPoint[];
  /**
   * Sector split positions as progress fractions (0..1) along centerPoints.
   * 2 splits = 3 sectors. Always defaults to thirds when not specified.
   */
  defaultSectors?: number[];
}

// =====================================================================
// "Custom GP" — replaces Monza. Layout traced from the user's reference
// image: top straight, kink chicane, long back straight, hairpin, twisty
// infield, final corner onto start/finish straight.
// =====================================================================
const customGpCenter: TrackPoint[] = [
  // Sector 1: bottom start/finish straight + first complex (red sector)
  { x: 35, y: 88 }, { x: 45, y: 88 }, { x: 55, y: 88 }, { x: 62, y: 86 },
  { x: 65, y: 82 }, { x: 60, y: 80 }, { x: 50, y: 82 }, { x: 38, y: 84 },
  { x: 28, y: 82 }, { x: 22, y: 78 }, { x: 18, y: 70 },
  // Sector 2: left/back loop up to top corner (blue sector)
  { x: 16, y: 60 }, { x: 14, y: 50 }, { x: 14, y: 40 }, { x: 16, y: 30 },
  { x: 20, y: 22 }, { x: 26, y: 16 }, { x: 32, y: 12 }, { x: 38, y: 10 },
  { x: 44, y: 10 }, { x: 48, y: 14 }, { x: 46, y: 22 }, { x: 42, y: 28 },
  { x: 38, y: 36 }, { x: 36, y: 44 }, { x: 40, y: 50 },
  // Sector 3: long top straight + final right loop back to start (yellow sector)
  { x: 50, y: 50 }, { x: 60, y: 48 }, { x: 70, y: 46 }, { x: 78, y: 44 },
  { x: 84, y: 42 }, { x: 88, y: 46 }, { x: 90, y: 54 }, { x: 90, y: 64 },
  { x: 88, y: 74 }, { x: 84, y: 82 }, { x: 76, y: 88 }, { x: 60, y: 90 },
  { x: 45, y: 90 }, { x: 35, y: 88 },
];
// Outer/inner SVG paths roughly framing the centerline so the surface band reads as a track.
const customGpOuter = `
  M 30 92 L 65 92 Q 72 92 72 87 Q 70 76 60 76 Q 50 78 38 80 Q 28 78 24 74 Q 20 68 20 60
  L 18 50 L 18 40 Q 18 28 24 20 Q 30 12 38 8 Q 46 6 50 12 Q 52 22 46 30 Q 40 40 40 48
  Q 42 54 50 54 L 80 50 Q 92 48 92 56 L 94 70 Q 92 82 84 88 Q 76 94 60 94 L 30 94 Z
`;
const customGpInner = `
  M 36 84 L 60 84 Q 64 84 64 80 Q 60 80 50 82 Q 40 82 32 80 Q 26 76 26 70 L 24 60
  L 24 44 Q 24 32 30 26 Q 36 22 40 22 Q 42 28 38 34 Q 32 42 32 50 Q 32 58 44 58
  L 78 54 Q 86 54 86 60 L 86 70 Q 84 78 78 82 Q 70 86 60 86 L 36 86 Z
`;

// =====================================================================
// Skidpad (figure-eight)
// =====================================================================
const skidpadCenter: TrackPoint[] = (() => {
  const pts: TrackPoint[] = [];
  const r = 18;
  for (let a = 180; a >= -180; a -= 20) {
    const rad = (a * Math.PI) / 180;
    pts.push({ x: 65 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) });
  }
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

// =====================================================================
// Hockenheim-style oval-ish
// =====================================================================
const hockOuter = `M 15 30 L 85 30 Q 95 30 95 50 Q 95 70 85 70 L 60 70 Q 50 70 50 80 Q 50 90 40 90 L 25 90 Q 15 90 15 80 Z`;
const hockInner = `M 25 40 L 78 40 Q 85 40 85 50 Q 85 60 78 60 L 55 60 Q 45 60 45 75 Q 45 80 40 80 L 30 80 Q 25 80 25 75 Z`;
const hockCenter: TrackPoint[] = [
  { x: 20, y: 35 }, { x: 40, y: 35 }, { x: 60, y: 35 }, { x: 80, y: 35 },
  { x: 90, y: 50 }, { x: 80, y: 65 }, { x: 60, y: 65 }, { x: 52, y: 75 },
  { x: 40, y: 85 }, { x: 25, y: 85 }, { x: 20, y: 70 }, { x: 20, y: 50 },
];

export const TRACK_PRESETS: TrackPreset[] = [
  {
    id: "custom-gp",
    name: "Custom GP Circuit",
    outerPath: customGpOuter,
    innerPath: customGpInner,
    centerPoints: customGpCenter,
    defaultSectors: [0.34, 0.67],
  },
  {
    id: "skidpad",
    name: "Skidpad (Figure-8)",
    outerPath: skidpadOuter,
    innerPath: skidpadInner,
    centerPoints: skidpadCenter,
    defaultSectors: [1 / 3, 2 / 3],
  },
  {
    id: "hockenheim",
    name: "Hockenheim Style",
    outerPath: hockOuter,
    innerPath: hockInner,
    centerPoints: hockCenter,
    defaultSectors: [1 / 3, 2 / 3],
  },
];

export const CUSTOM_TRACK_ID = "custom";

export const pointsToPath = (points: TrackPoint[]): string => {
  if (points.length === 0) return "";
  return points.reduce((path, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`), "");
};

/**
 * Build an SVG path covering only a slice of the points array (by progress range).
 * Used to render each sector in its own color.
 */
export const pointsToPathSlice = (
  points: TrackPoint[],
  startFrac: number,
  endFrac: number
): string => {
  if (points.length < 2) return "";
  const a = Math.max(0, Math.min(1, startFrac));
  const b = Math.max(a, Math.min(1, endFrac));
  const i0 = Math.floor(a * (points.length - 1));
  const i1 = Math.ceil(b * (points.length - 1));
  const slice = points.slice(i0, i1 + 1);
  return pointsToPath(slice);
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

// =====================================================================
// F1-style sector timing colors
// =====================================================================
export type SectorStatus = "pending" | "purple" | "green" | "yellow";

export const SECTOR_COLORS: Record<SectorStatus, string> = {
  // Neutral grey track when not yet driven this lap
  pending: "hsl(0, 0%, 35%)",
  // Personal best — purple
  purple: "hsl(280, 85%, 60%)",
  // Improved over previous time but not best — green
  green: "hsl(140, 70%, 45%)",
  // Slower than previous time — yellow
  yellow: "hsl(48, 96%, 53%)",
};
