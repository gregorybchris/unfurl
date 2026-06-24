import {
  ArrowCounterClockwise,
  ArrowsIn,
  ArrowsOut,
  CaretDown,
  Check,
  ChartBar,
  CirclesThree,
  Fire,
  Graph,
  VectorThree,
  Info,
  Lightning,
  Magnet,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Network,
  Palette,
  Pause,
  Play,
  Swatches,
} from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import * as RadixSelect from "@radix-ui/react-select";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Switch from "@radix-ui/react-switch";
import type { ReactNode } from "react";
import { GRAPH_OPTIONS, Theme, THEMES } from "@/app";
import { ForceConfig, FunctionType, PhysicsConfig } from "@/simulation/physics-config";
import { DimensionMode } from "@/view/graph-view";
import { ScrubSlider, SnapTier } from "@/view/scrub-slider";

const FUNCTION_LABELS: Record<FunctionType, string> = {
  step: "Step zones",
  linear: "Linear",
  inverse: "Inverse",
  logistic: "Logistic",
  logarithmic: "Logarithmic",
  exponential: "Exponential",
};

// ── Snap tiers for each slider type ──────────────────────────────────────────

const STRENGTH_SNAP_TIERS: SnapTier[] = [
  { maxYOffset: 15, step: 0.01 },
  { maxYOffset: 30, step: 0.05 },
  { maxYOffset: 45, step: 0.1 },
  { maxYOffset: Infinity, step: 0.5 },
];

const SPEED_SNAP_TIERS: SnapTier[] = [
  { maxYOffset: 15, step: 0.001 },
  { maxYOffset: 30, step: 0.005 },
  { maxYOffset: 45, step: 0.01 },
  { maxYOffset: Infinity, step: 0.02 },
];


function GraphSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger className="flex items-center justify-between w-full bg-white/5 border border-accent/15 rounded-md px-2.5 py-1.5 text-[11px] text-accent/80 hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent/30 gap-1 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 min-w-0">
          <Graph size={11} className="shrink-0 text-accent/60" />
          <RadixSelect.Value />
        </div>
        <RadixSelect.Icon className="shrink-0 text-accent/40">
          <CaretDown size={9} weight="bold" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="bg-panel border border-accent/20 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[12rem]"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {GRAPH_OPTIONS.map((g) => (
              <RadixSelect.Item
                key={g.id}
                value={g.id}
                className="relative flex items-center pl-6 pr-3 py-1.5 text-[11px] text-accent/80 rounded-md cursor-pointer outline-none data-[highlighted]:bg-accent/15 data-[highlighted]:text-accent data-[state=checked]:text-accent-soft"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 text-accent">
                  <Check size={9} weight="bold" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{g.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ThemeSelect({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (v: Theme) => void;
}) {
  const current = THEMES.find((t) => t.id === value)!;
  return (
    <RadixSelect.Root value={value} onValueChange={(v) => onChange(v as Theme)}>
      <RadixSelect.Trigger className="flex items-center justify-between w-full bg-white/5 border border-accent/15 rounded-md px-2.5 py-1.5 text-[11px] text-accent/80 hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent/30 gap-1 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 min-w-0">
          <Palette size={11} className="shrink-0 text-accent/60" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: current.swatch }}
            />
            <RadixSelect.Value />
          </div>
        </div>
        <RadixSelect.Icon className="shrink-0 text-accent/40">
          <CaretDown size={9} weight="bold" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="bg-panel border border-accent/20 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[12rem]"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {THEMES.map((t) => (
              <RadixSelect.Item
                key={t.id}
                value={t.id}
                className="relative flex items-center pl-6 pr-3 py-1.5 text-[11px] text-accent/80 rounded-md cursor-pointer outline-none data-[highlighted]:bg-accent/15 data-[highlighted]:text-accent data-[state=checked]:text-accent-soft"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 text-accent">
                  <Check size={9} weight="bold" />
                </RadixSelect.ItemIndicator>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <RadixSelect.ItemText>{t.label}</RadixSelect.ItemText>
                </div>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function CurveSelect({
  value,
  onChange,
}: {
  value: FunctionType;
  onChange: (v: FunctionType) => void;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={(v) => onChange(v as FunctionType)}>
      <RadixSelect.Trigger className="flex items-center justify-between w-full bg-white/5 border border-accent/15 rounded-md px-2.5 py-1.5 text-[11px] text-accent/80 hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent/30 gap-1 transition-colors cursor-pointer">
        <RadixSelect.Value />
        <RadixSelect.Icon className="shrink-0 text-accent/40">
          <CaretDown size={9} weight="bold" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="bg-panel border border-accent/20 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[10rem]"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {(Object.keys(FUNCTION_LABELS) as FunctionType[]).map((fn) => (
              <RadixSelect.Item
                key={fn}
                value={fn}
                className="relative flex items-center pl-6 pr-3 py-1.5 text-[11px] text-accent/80 rounded-md cursor-pointer outline-none data-[highlighted]:bg-accent/15 data-[highlighted]:text-accent data-[state=checked]:text-accent-soft"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 text-accent">
                  <Check size={9} weight="bold" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{FUNCTION_LABELS[fn]}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ForceSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      className="relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30 data-[state=checked]:bg-accent/70"
    >
      <Switch.Thumb className="pointer-events-none block h-[14px] w-[14px] translate-x-0 rounded-full bg-white/80 shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[14px]" />
    </Switch.Root>
  );
}

// ── Force section ─────────────────────────────────────────────────────────────

function ForceSection({
  icon,
  label,
  config,
  maxStrength = 2,
  onChange,
  description,
}: {
  icon: ReactNode;
  label: string;
  config: ForceConfig;
  maxStrength?: number;
  onChange: (c: ForceConfig) => void;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-accent/10 bg-white/[0.025]">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span
          className={`shrink-0 transition-opacity ${config.enabled ? "text-accent opacity-90" : "text-accent/30"}`}
        >
          {icon}
        </span>
        <span
          className={`flex-1 text-xs font-medium leading-tight transition-colors ${config.enabled ? "text-accent/90" : "text-accent/30"}`}
        >
          {label}
        </span>
        {description && (
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="shrink-0 text-accent/25 hover:text-accent/60 transition-colors focus:outline-none">
                <Info size={12} weight="bold" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="right"
                sideOffset={8}
                className="z-50 max-w-[200px] rounded-lg border border-accent/20 bg-panel/95 px-3 py-2.5 shadow-2xl backdrop-blur-sm text-[11px] text-accent/80 leading-relaxed data-[state=open]:animate-[popover-in_160ms_ease-out] data-[state=closed]:animate-[popover-out_120ms_ease-in]"
              >
                {description}
                <Popover.Arrow className="fill-accent/20" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
        <ForceSwitch
          checked={config.enabled}
          onChange={(checked) => onChange({ ...config, enabled: checked })}
        />
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: config.enabled ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-accent/8 px-3 py-2.5 space-y-2.5 transition-opacity duration-200 ${config.enabled ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-accent/40 w-12 shrink-0 uppercase tracking-wide">
                Strength
              </span>
              <ScrubSlider
                value={config.strength}
                min={0}
                max={maxStrength}
                snapTiers={STRENGTH_SNAP_TIERS}
                mobileStep={0.1}
                onChange={(v) => onChange({ ...config, strength: v })}
              />
              <span className="text-[11px] tabular-nums text-accent/60 w-7 text-right">
                {config.strength.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-accent/40 w-12 shrink-0 uppercase tracking-wide">
                Curve
              </span>
              <CurveSelect
                value={config.functionType}
                onChange={(fn) => onChange({ ...config, functionType: fn })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Global slider row ─────────────────────────────────────────────────────────

function GlobalRow({
  icon,
  label,
  value,
  min,
  max,
  snapTiers,
  mobileStep,
  decimals = 3,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  snapTiers: SnapTier[];
  mobileStep?: number;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="shrink-0 text-accent/50">{icon}</span>
      <span className="text-[10px] text-accent/50 w-12 shrink-0 uppercase tracking-wide">{label}</span>
      <ScrubSlider value={value} min={min} max={max} snapTiers={snapTiers} mobileStep={mobileStep} onChange={onChange} />
      <span className="text-[11px] tabular-nums text-accent/60 w-10 text-right">
        {value.toFixed(decimals)}
      </span>
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  children,
  title,
  accent,
}: {
  onClick: () => void;
  children: ReactNode;
  title?: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors
        ${accent
          ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 active:bg-accent/30"
          : "border-accent/15 bg-white/[0.03] text-accent/70 hover:bg-accent/10 hover:text-accent active:bg-accent/20"
        }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ControlPanelProps {
  config: PhysicsConfig;
  onChange: (config: PhysicsConfig) => void;
  onAddHeat: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedGraphId: string;
  onGraphChange: (id: string) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  nodeColors: boolean;
  onNodeColorsChange: (v: boolean) => void;
  dimensionMode: DimensionMode;
  onDimensionModeChange: (m: DimensionMode) => void;
  linkWidth: boolean;
  onLinkWidthChange: (v: boolean) => void;
}

export function ControlPanel({
  config,
  onChange,
  onAddHeat,
  onReset,
  onZoomIn,
  onZoomOut,
  selectedGraphId,
  onGraphChange,
  theme,
  onThemeChange,
  nodeColors,
  onNodeColorsChange,
  dimensionMode,
  onDimensionModeChange,
  linkWidth,
  onLinkWidthChange,
}: ControlPanelProps) {
  const setForce = (key: keyof PhysicsConfig, fc: ForceConfig) =>
    onChange({ ...config, [key]: fc });

  return (
    <div className="h-full w-64 shrink-0 flex flex-col border-r border-accent/10 bg-panel/95 shadow-2xl text-accent backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-accent/10">
        <span className="text-sm font-bold tracking-[0.15em] uppercase text-accent/80">
          Unfurl
        </span>
      </div>

      <ScrollArea.Root className="flex-1 min-h-0">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="px-3 py-3 space-y-2.5">

            {/* Graph selector */}
            <GraphSelect value={selectedGraphId} onChange={onGraphChange} />

            {/* Theme selector */}
            <ThemeSelect value={theme} onChange={onThemeChange} />

            {/* Action row */}
            <div className="flex gap-1.5">
              <IconBtn
                onClick={() => onChange({ ...config, paused: !config.paused })}
                accent={config.paused}
                title={config.paused ? "Resume simulation" : "Pause simulation"}
              >
                {config.paused ? (
                  <Play size={11} weight="fill" />
                ) : (
                  <Pause size={11} weight="fill" />
                )}
                {config.paused ? "Play" : "Pause"}
              </IconBtn>
              <IconBtn onClick={onAddHeat} title="Inject kinetic energy">
                <Fire size={11} weight="fill" className="text-orange-400/80" />
                Heat
              </IconBtn>
              <IconBtn onClick={onReset} title="Reset all controls to defaults">
                <ArrowCounterClockwise size={11} weight="bold" />
                Reset
              </IconBtn>
            </div>

            {/* Global sliders */}
            <div className="rounded-lg border border-accent/10 bg-white/[0.025] px-3 py-2.5 space-y-2.5">
              <GlobalRow
                icon={<Lightning size={12} weight="fill" />}
                label="Speed"
                value={config.simulationSpeed}
                min={0.001}
                max={0.08}
                snapTiers={SPEED_SNAP_TIERS}
                mobileStep={0.01}
                decimals={3}
                onChange={(v) => onChange({ ...config, simulationSpeed: v })}
              />
            </div>

            {/* Zoom controls */}
            <div className="rounded-lg border border-accent/10 bg-white/[0.025] px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] text-accent/50 uppercase tracking-wide">Zoom</span>
              <div className="flex-1" />
              <button
                onClick={onZoomOut}
                title="Zoom out"
                className="rounded-md p-1 text-accent/60 hover:bg-accent/10 hover:text-accent transition-colors"
              >
                <MagnifyingGlassMinus size={14} />
              </button>
              <button
                onClick={onZoomIn}
                title="Zoom in"
                className="rounded-md p-1 text-accent/60 hover:bg-accent/10 hover:text-accent transition-colors"
              >
                <MagnifyingGlassPlus size={14} />
              </button>
              <span className="text-[10px] text-accent/40 ml-0.5">scroll</span>
            </div>

            {/* Node colors toggle */}
            <div className="rounded-lg border border-accent/10 bg-white/[0.025] px-3 py-2 flex items-center gap-2">
              <Swatches size={12} className="text-accent/50 shrink-0" />
              <span className="flex-1 text-[10px] text-accent/50 uppercase tracking-wide">Node Colors</span>
              <ForceSwitch checked={nodeColors} onChange={onNodeColorsChange} />
            </div>

            {/* Link width toggle */}
            <div className="rounded-lg border border-accent/10 bg-white/[0.025] px-3 py-2 flex items-center gap-2">
              <Network size={12} className="text-accent/50 shrink-0" />
              <span className="flex-1 text-[10px] text-accent/50 uppercase tracking-wide">Link Width</span>
              <ForceSwitch checked={linkWidth} onChange={onLinkWidthChange} />
            </div>

            {/* 2D / 3D mode toggle */}
            <div className="rounded-lg border border-accent/10 bg-white/[0.025] px-3 py-2 flex items-center gap-2">
              <VectorThree size={12} className="text-accent/50 shrink-0" />
              <span className="flex-1 text-[10px] text-accent/50 uppercase tracking-wide">3D Mode</span>
              <ForceSwitch
                checked={dimensionMode === '3d'}
                onChange={(v) => onDimensionModeChange(v ? '3d' : '2d')}
              />
            </div>

            {/* Forces divider */}
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-accent/30">
                Forces
              </span>
              <div className="flex-1 h-px bg-accent/10" />
            </div>

            {/* Force sections */}
            <div className="space-y-1.5">
              <ForceSection
                icon={<ArrowsIn size={14} weight="duotone" />}
                label="Gravity"
                config={config.centerPull}
                onChange={(fc) => setForce("centerPull", fc)}
                description="Pulls every node toward the center of the canvas. Keeps the graph compact and prevents nodes from drifting off-screen."
              />
              <ForceSection
                icon={<ArrowsOut size={14} weight="duotone" />}
                label="Charge Repulsion"
                config={config.basicRepulsion}
                onChange={(fc) => setForce("basicRepulsion", fc)}
                description="Each node repels every other node like an electric charge. Spreads the graph out and prevents nodes from overlapping."
              />
              <ForceSection
                icon={<Magnet size={14} weight="duotone" />}
                label="Link Spring"
                config={config.springAttraction}
                onChange={(fc) => setForce("springAttraction", fc)}
                description="Edges act as springs that pull connected nodes toward each other. Higher strength draws linked nodes closer together."
              />
              <ForceSection
                icon={<Graph size={14} weight="duotone" />}
                label="Topological Repulsion"
                config={config.graphDistanceRepulsion}
                maxStrength={10}
                onChange={(fc) => setForce("graphDistanceRepulsion", fc)}
                description="Pushes nodes apart based on their graph distance — nodes many hops away from each other are pushed further apart, revealing the network's structure."
              />
              <ForceSection
                icon={<ChartBar size={14} weight="duotone" />}
                label="Hub Gravity"
                config={config.degreeDrift}
                onChange={(fc) => setForce("degreeDrift", fc)}
                description="Pulls nodes toward the center with force proportional to their degree. Nodes with many connections naturally migrate toward the center of the layout."
              />
              <ForceSection
                icon={<CirclesThree size={14} weight="duotone" />}
                label="Hub Repulsion"
                config={config.degreeRepulsion}
                onChange={(fc) => setForce("degreeRepulsion", fc)}
                description="Pushes nodes away from others with force proportional to their degree. Gives highly-connected nodes more visual breathing room."
              />
              <ForceSection
                icon={<Network size={14} weight="duotone" />}
                label="Centrality Gravity"
                config={config.eigenvectorDrift}
                onChange={(fc) => setForce("eigenvectorDrift", fc)}
                description="Pulls nodes toward the center weighted by eigenvector centrality — a measure of influence that accounts for the quality of a node's connections, not just the count."
              />
            </div>

          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex select-none touch-none p-0.5 w-1.5 transition-colors hover:bg-accent/5"
        >
          <ScrollArea.Thumb className="flex-1 bg-accent/20 rounded-full hover:bg-accent/30" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
}
