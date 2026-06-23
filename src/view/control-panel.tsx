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
  Lightning,
  Magnet,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Network,
  Pause,
  Play,
  Wind,
} from "@phosphor-icons/react";
import * as RadixSelect from "@radix-ui/react-select";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import type { ReactNode } from "react";
import { ForceConfig, FunctionType, PhysicsConfig } from "@/simulation/physics-config";

const FUNCTION_LABELS: Record<FunctionType, string> = {
  step: "Step zones",
  linear: "Linear",
  inverse: "Inverse",
  logistic: "Logistic",
  logarithmic: "Logarithmic",
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function ControlSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none w-full h-4 cursor-pointer group"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
    >
      <Slider.Track className="relative grow rounded-full h-[3px] bg-sea-green/15">
        <Slider.Range className="absolute rounded-full h-full bg-sea-green/60 group-hover:bg-sea-green transition-colors" />
      </Slider.Track>
      <Slider.Thumb className="block w-3 h-3 rounded-full bg-sea-green shadow-sm hover:bg-light-green focus:outline-none focus:ring-2 focus:ring-sea-green/40 transition-colors" />
    </Slider.Root>
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
      <RadixSelect.Trigger className="flex items-center justify-between w-full bg-white/5 border border-sea-green/15 rounded-md px-2.5 py-1.5 text-[11px] text-sea-green/80 hover:bg-sea-green/10 hover:text-sea-green focus:outline-none focus:ring-1 focus:ring-sea-green/30 gap-1 transition-colors cursor-pointer">
        <RadixSelect.Value />
        <RadixSelect.Icon className="shrink-0 text-sea-green/40">
          <CaretDown size={9} weight="bold" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="bg-[#1c3530] border border-sea-green/20 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[10rem]"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {(Object.keys(FUNCTION_LABELS) as FunctionType[]).map((fn) => (
              <RadixSelect.Item
                key={fn}
                value={fn}
                className="relative flex items-center pl-6 pr-3 py-1.5 text-[11px] text-sea-green/80 rounded-md cursor-pointer outline-none data-[highlighted]:bg-sea-green/15 data-[highlighted]:text-sea-green data-[state=checked]:text-light-green"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 text-sea-green">
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
      className="relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-sea-green/20 transition-colors focus:outline-none focus:ring-2 focus:ring-sea-green/30 data-[state=checked]:bg-sea-green/70"
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
  onChange,
}: {
  icon: ReactNode;
  label: string;
  config: ForceConfig;
  onChange: (c: ForceConfig) => void;
}) {
  return (
    <div className="rounded-lg border border-sea-green/10 bg-white/[0.025] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span
          className={`shrink-0 transition-opacity ${config.enabled ? "text-sea-green opacity-90" : "text-sea-green/30"}`}
        >
          {icon}
        </span>
        <span
          className={`flex-1 text-xs font-medium leading-tight transition-colors ${config.enabled ? "text-sea-green/90" : "text-sea-green/30"}`}
        >
          {label}
        </span>
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
            className={`border-t border-sea-green/8 px-3 py-2.5 space-y-2.5 transition-opacity duration-200 ${config.enabled ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sea-green/40 w-12 shrink-0 uppercase tracking-wide">
                Strength
              </span>
              <ControlSlider
                value={config.strength}
                min={0}
                max={2}
                step={0.01}
                onChange={(v) => onChange({ ...config, strength: v })}
              />
              <span className="text-[11px] tabular-nums text-sea-green/60 w-7 text-right">
                {config.strength.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-sea-green/40 w-12 shrink-0 uppercase tracking-wide">
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
  step,
  decimals = 3,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sea-green/50">{icon}</span>
      <span className="text-[10px] text-sea-green/50 w-12 shrink-0 uppercase tracking-wide">{label}</span>
      <ControlSlider value={value} min={min} max={max} step={step} onChange={onChange} />
      <span className="text-[11px] tabular-nums text-sea-green/60 w-10 text-right">
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
          ? "border-sea-green/30 bg-sea-green/10 text-sea-green hover:bg-sea-green/20 active:bg-sea-green/30"
          : "border-sea-green/15 bg-white/[0.03] text-sea-green/70 hover:bg-sea-green/10 hover:text-sea-green active:bg-sea-green/20"
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
}

export function ControlPanel({
  config,
  onChange,
  onAddHeat,
  onReset,
  onZoomIn,
  onZoomOut,
}: ControlPanelProps) {
  const setForce = (key: keyof PhysicsConfig, fc: ForceConfig) =>
    onChange({ ...config, [key]: fc });

  return (
    <div className="h-full w-64 shrink-0 flex flex-col border-r border-sea-green/10 bg-[#1c3530]/95 shadow-2xl text-sea-green backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sea-green/10">
        <span className="text-sm font-bold tracking-[0.15em] uppercase text-sea-green/80">
          Unfurl
        </span>
      </div>

      <ScrollArea.Root className="flex-1 min-h-0">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="px-3 py-3 space-y-2.5">

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
            <div className="rounded-lg border border-sea-green/10 bg-white/[0.025] px-3 py-2.5 space-y-2.5">
              <GlobalRow
                icon={<Lightning size={12} weight="fill" />}
                label="Speed"
                value={config.simulationSpeed}
                min={0.001}
                max={0.08}
                step={0.001}
                decimals={3}
                onChange={(v) => onChange({ ...config, simulationSpeed: v })}
              />
              <GlobalRow
                icon={<Wind size={12} />}
                label="Damping"
                value={config.damping}
                min={0.8}
                max={0.995}
                step={0.001}
                decimals={3}
                onChange={(v) => onChange({ ...config, damping: v })}
              />
            </div>

            {/* Zoom controls */}
            <div className="rounded-lg border border-sea-green/10 bg-white/[0.025] px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] text-sea-green/50 uppercase tracking-wide">Zoom</span>
              <div className="flex-1" />
              <button
                onClick={onZoomOut}
                title="Zoom out"
                className="rounded-md p-1 text-sea-green/60 hover:bg-sea-green/10 hover:text-sea-green transition-colors"
              >
                <MagnifyingGlassMinus size={14} />
              </button>
              <button
                onClick={onZoomIn}
                title="Zoom in"
                className="rounded-md p-1 text-sea-green/60 hover:bg-sea-green/10 hover:text-sea-green transition-colors"
              >
                <MagnifyingGlassPlus size={14} />
              </button>
              <span className="text-[10px] text-sea-green/40 ml-0.5">scroll</span>
            </div>

            {/* Forces divider */}
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-sea-green/30">
                Forces
              </span>
              <div className="flex-1 h-px bg-sea-green/10" />
            </div>

            {/* Force sections */}
            <div className="space-y-1.5">
              <ForceSection
                icon={<ArrowsIn size={14} weight="duotone" />}
                label="Center Pull"
                config={config.centerPull}
                onChange={(fc) => setForce("centerPull", fc)}
              />
              <ForceSection
                icon={<ArrowsOut size={14} weight="duotone" />}
                label="Basic Repulsion"
                config={config.basicRepulsion}
                onChange={(fc) => setForce("basicRepulsion", fc)}
              />
              <ForceSection
                icon={<Magnet size={14} weight="duotone" />}
                label="Spring Attraction"
                config={config.springAttraction}
                onChange={(fc) => setForce("springAttraction", fc)}
              />
              <ForceSection
                icon={<Graph size={14} weight="duotone" />}
                label="Graph Distance Repulsion"
                config={config.graphDistanceRepulsion}
                onChange={(fc) => setForce("graphDistanceRepulsion", fc)}
              />
              <ForceSection
                icon={<ChartBar size={14} weight="duotone" />}
                label="Degree Centrality Drift"
                config={config.degreeDrift}
                onChange={(fc) => setForce("degreeDrift", fc)}
              />
              <ForceSection
                icon={<CirclesThree size={14} weight="duotone" />}
                label="Degree Centrality Repulsion"
                config={config.degreeRepulsion}
                onChange={(fc) => setForce("degreeRepulsion", fc)}
              />
              <ForceSection
                icon={<Network size={14} weight="duotone" />}
                label="Eigenvector Drift"
                config={config.eigenvectorDrift}
                onChange={(fc) => setForce("eigenvectorDrift", fc)}
              />
            </div>

          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex select-none touch-none p-0.5 w-1.5 transition-colors hover:bg-sea-green/5"
        >
          <ScrollArea.Thumb className="flex-1 bg-sea-green/20 rounded-full hover:bg-sea-green/30" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
}
