import type { GraphId, Theme } from "@/app";
import type { ForceConfig, FunctionType, PhysicsConfig } from "@/simulation/physics-config";

export interface AppSettings {
  physicsConfig: PhysicsConfig;
  selectedGraphId: GraphId;
  theme: Theme;
  nodeColors: boolean;
}

const CODEC_VERSION = 0;
const TOTAL_BYTES = 15; // 113 bits packed into 15 bytes (120 bits, 7 trailing zero bits padding)

// Frozen enum orderings — never reorder without bumping CODEC_VERSION
const GRAPH_IDS: GraphId[] = [
  "les-miserables", "karate", "dolphins", "polbooks", "adjnoun", "football",
];
const THEME_IDS: Theme[] = [
  "slate-dark", "warm-charcoal", "parchment", "deep-navy", "true-gray",
];
const FN_TYPES: FunctionType[] = [
  "step", "linear", "inverse", "logistic", "logarithmic", "exponential",
];

// [physicsConfig key, maxStrength, strengthBits] — order is part of the encoding contract
const FORCE_LAYOUT: [keyof PhysicsConfig, number, number][] = [
  ["centerPull",             2,  8],
  ["basicRepulsion",         2,  8],
  ["springAttraction",       2,  8],
  ["graphDistanceRepulsion", 10, 10],
  ["degreeDrift",            2,  8],
  ["degreeRepulsion",        2,  8],
  ["eigenvectorDrift",       2,  8],
];

// Bit layout (MSB-first within each byte):
// [4]  version
// [7]  simulationSpeed  — quantized as round((v - 0.001) / 0.001), range [0, 79]
// [8]  damping          — quantized as round((v - 0.8) / 0.001),   range [0, 195]
// [1]  paused
// [3]  selectedGraphId  — index into GRAPH_IDS
// [3]  theme            — index into THEME_IDS
// [1]  nodeColors
// Per force × 7 (in FORCE_LAYOUT order):
// [1]  enabled
// [8 or 10]  strength   — quantized as round(v / 0.01)
// [3]  functionType     — index into FN_TYPES
// Total: 113 bits → 15 bytes → exactly 20 base64url characters (no padding: 15 % 3 === 0)

class BitWriter {
  private bytes = new Uint8Array(TOTAL_BYTES);
  private pos = 0;

  write(value: number, bits: number): void {
    for (let i = bits - 1; i >= 0; i--) {
      if ((value >> i) & 1) this.bytes[this.pos >> 3] |= 1 << (7 - (this.pos & 7));
      this.pos++;
    }
  }

  toBase64Url(): string {
    let s = "";
    for (const b of this.bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_");
  }
}

class BitReader {
  private pos = 0;
  constructor(private bytes: Uint8Array) {}

  read(bits: number): number {
    let v = 0;
    for (let i = bits - 1; i >= 0; i--) {
      v |= ((this.bytes[this.pos >> 3] >> (7 - (this.pos & 7))) & 1) << i;
      this.pos++;
    }
    return v;
  }
}

export function encodeSettings(s: AppSettings): string {
  const w = new BitWriter();
  const p = s.physicsConfig;

  w.write(CODEC_VERSION, 4);
  w.write(Math.round((p.simulationSpeed - 0.001) / 0.001), 7);
  w.write(Math.round((p.damping - 0.8) / 0.001), 8);
  w.write(p.paused ? 1 : 0, 1);
  w.write(GRAPH_IDS.indexOf(s.selectedGraphId), 3);
  w.write(THEME_IDS.indexOf(s.theme), 3);
  w.write(s.nodeColors ? 1 : 0, 1);

  for (const [key, , strengthBits] of FORCE_LAYOUT) {
    const fc = p[key] as ForceConfig;
    w.write(fc.enabled ? 1 : 0, 1);
    w.write(Math.round(fc.strength / 0.01), strengthBits);
    w.write(FN_TYPES.indexOf(fc.functionType), 3);
  }

  return w.toBase64Url();
}

export function decodeSettings(encoded: string): AppSettings | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    if (binary.length !== TOTAL_BYTES) return null;

    const bytes = new Uint8Array(TOTAL_BYTES);
    for (let i = 0; i < TOTAL_BYTES; i++) bytes[i] = binary.charCodeAt(i);

    const r = new BitReader(bytes);

    if (r.read(4) !== CODEC_VERSION) return null;

    const simulationSpeed = +(r.read(7) * 0.001 + 0.001).toFixed(3);
    const damping = +(r.read(8) * 0.001 + 0.8).toFixed(3);
    const paused = r.read(1) === 1;

    const graphIdx = r.read(3);
    if (graphIdx >= GRAPH_IDS.length) return null;
    const selectedGraphId = GRAPH_IDS[graphIdx];

    const themeIdx = r.read(3);
    if (themeIdx >= THEME_IDS.length) return null;
    const theme = THEME_IDS[themeIdx];

    const nodeColors = r.read(1) === 1;

    const physicsConfig = { simulationSpeed, damping, paused } as PhysicsConfig;

    for (const [key, , strengthBits] of FORCE_LAYOUT) {
      const enabled = r.read(1) === 1;
      const strength = +(r.read(strengthBits) * 0.01).toFixed(2);
      const ftIdx = r.read(3);
      if (ftIdx >= FN_TYPES.length) return null;
      const functionType = FN_TYPES[ftIdx];
      (physicsConfig as Record<string, unknown>)[key] = { enabled, strength, functionType };
    }

    return { physicsConfig, selectedGraphId, theme, nodeColors };
  } catch {
    return null;
  }
}
