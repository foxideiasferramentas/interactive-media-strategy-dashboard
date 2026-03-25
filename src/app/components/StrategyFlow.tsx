import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Share2,
  Globe,
  Target,
  Box,
  GripVertical,
  Plus,
  X,
  RotateCcw,
  PenLine,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ImageIcon,
  LayoutGrid,
  Search,
  Monitor,
  Video,
  Maximize2,
  Trash2,
  Bookmark,
  Book,
  Copy,
} from "lucide-react";
import { Campaign, StageKey, MetaCreative, GoogleCreative, SavedAudience } from "../data/types";
import { MetaCreativeEditor, GoogleCreativeEditor, Field } from "./CreativeEditors";
import { useIsMobile } from "./ui/use-mobile";
import { useStore } from "../data/store";

interface StrategyFlowProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
}

const FLOW_STAGE_LABELS: Record<StageKey, { label: string; color: string; bg: string; accent: string }> = {
  top:    { label: "Topo",  color: "from-blue-500 to-blue-600",     bg: "bg-blue-50",    accent: "#3b82f6" },
  middle: { label: "Meio",  color: "from-violet-500 to-violet-600", bg: "bg-violet-50",  accent: "#8b5cf6" },
  bottom: { label: "Fundo", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", accent: "#10b981" },
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const GRID_SIZE = 24; // tamanho da célula do grid em px (espaço do canvas, antes do zoom)

function creativeIcon(format: string) {
  const cls = "w-3 h-3";
  if (format === "Image" || format === "Display") return <ImageIcon className={cls} />;
  if (format === "Video" || format === "YouTube") return <Video className={cls} />;
  if (format === "Carousel") return <LayoutGrid className={cls} />;
  if (format === "Search") return <Search className={cls} />;
  if (format === "PMax") return <Maximize2 className={cls} />;
  return <Monitor className={cls} />;
}

export function StrategyFlow({ campaign, onUpdate }: StrategyFlowProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLDivElement>(null);
  const gridRef      = useRef<SVGSVGElement>(null);
  const { savedAudiences, saveAudience } = useStore();

  const [activeAudienceId, setActiveAudienceId]   = useState<string | null>(null);
  const [connections, setConnections]               = useState<any[]>([]);
  const [hoveredAudienceId, setHoveredAudienceId] = useState<string | null>(null);
  const [history, setHistory]                       = useState<Campaign[]>([]);
  const [expandedStageKey, setExpandedStageKey]   = useState<StageKey | null>(null);
  const [collapsedStages, setCollapsedStages]     = useState<Set<StageKey>>(new Set());
  const [libraryStageKey, setLibraryStageKey]     = useState<StageKey | null>(null); // para mostrar popover de biblioteca
  const [libraryChannel, setLibraryChannel]       = useState<"meta"|"google" | null>(null);
  const [draggingAudience, setDraggingAudience]   = useState<{ audienceId: string; channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [audienceDropTarget, setAudienceDropTarget] = useState<{ channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [draggingCreative, setDraggingCreative]   = useState<{ creativeId: string; fromAudienceId: string; channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [creativeDropTarget, setCreativeDropTarget] = useState<string | null>(null); // audienceId alvo
  const draggingCreativeRef = useRef<{ creativeId: string; fromAudienceId: string } | null>(null);

  // Painel lateral
  const [panelAudience, setPanelAudience] = useState<{ id: string; channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);

  // Pan & Zoom em refs para evitar stale closures e re-renders desnecessários
  const zoom      = useRef(0.75);
  const pan       = useRef({ x: 40, y: 40 });
  const isPanning = useRef(false);
  const panStart  = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const didPan    = useRef(false);
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // Aplica transform no canvas E atualiza o grid
  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom.current})`;
    }
    // Grid: move com o pan e escala os pontos com o zoom
    const grid = gridRef.current;
    if (grid) {
      const z = zoom.current;
      const cellSize = GRID_SIZE * z;
      const offsetX  = pan.current.x % cellSize;
      const offsetY  = pan.current.y % cellSize;
      const pattern = grid.querySelector("pattern");
      if (pattern) {
        pattern.setAttribute("width",  String(cellSize));
        pattern.setAttribute("height", String(cellSize));
        pattern.setAttribute("x", String(offsetX));
        pattern.setAttribute("y", String(offsetY));
        const circle = pattern.querySelector("circle");
        if (circle) {
          const r = Math.min(1.2, Math.max(0.5, z * 0.9));
          circle.setAttribute("r", String(r));
          circle.setAttribute("cx", String(cellSize / 2));
          circle.setAttribute("cy", String(cellSize / 2));
        }
      }
    }
  }, []);

  // Auto-fit: ajusta zoom e pan para que todo o canvas caiba na tela ao montar
  const autoFit = useCallback(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    // reset temporário para medir tamanho natural do conteúdo
    canvas.style.transform = "translate(0px,0px) scale(1)";
    const { width: contentW, height: contentH } = canvas.getBoundingClientRect();
    const padding = 48;
    const fitZoom = Math.min(
      (cw - padding * 2) / contentW,
      (ch - padding * 2) / contentH,
      0.9 // não ultra-ampliar
    );
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fitZoom));
    zoom.current = z;
    pan.current  = {
      x: (cw - contentW * z) / 2,
      y: (ch - contentH * z) / 2,
    };
    applyTransform();
    rerender();
  }, [applyTransform, rerender]);

  // Pan via pointer events nativos
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, a")) return;
      if (target.closest("[data-draggable]")) return;
      isPanning.current = true;
      didPan.current    = false;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan.current };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        didPan.current = true;
        el.style.cursor = "grabbing";
      }
      if (didPan.current) {
        pan.current = { x: panOrigin.current.x + dx, y: panOrigin.current.y + dy };
        applyTransform();
      }
    };

    const onPointerUp = () => {
      isPanning.current = false;
      didPan.current    = false;
      el.style.cursor   = "default";
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect    = el.getBoundingClientRect();
      const mouseX  = e.clientX - rect.left;
      const mouseY  = e.clientY - rect.top;
      const oldZ    = zoom.current;
      const delta   = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const newZ    = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((oldZ + delta).toFixed(2))));
      zoom.current  = newZ;
      pan.current   = {
        x: mouseX - (mouseX - pan.current.x) * (newZ / oldZ),
        y: mouseY - (mouseY - pan.current.y) * (newZ / oldZ),
      };
      applyTransform();
      rerender();
    };

    el.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup",   onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup",   onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [applyTransform, rerender]);

  // Auto-fit na montagem (após o DOM renderizar)
  useEffect(() => {
    const timer = setTimeout(autoFit, 80);
    return () => clearTimeout(timer);
  }, [autoFit]);

  // Canais ativos
  const channels = useMemo(() => {
    const list: ("meta"|"google")[] = [];
    if (campaign.budgetAllocation.metaEnabled)   list.push("meta");
    if (campaign.budgetAllocation.googleEnabled) list.push("google");
    return list;
  }, [campaign.budgetAllocation]);

  // Calcula SVG de conexões
  const calculatePaths = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    const z  = zoom.current;
    const newConns: any[] = [];

    const getCenter = (id: string, side: "left"|"right") => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: (side === "right" ? r.right - cr.left : r.left - cr.left) / z,
        y: (r.top + r.height / 2 - cr.top) / z,
      };
    };

    channels.forEach(ch => {
      const s = getCenter("node-campaign", "right");
      const e = getCenter(`node-channel-${ch}`, "left");
      if (s && e) newConns.push({ start: s, end: e, id: `camp-${ch}`, color: "#94a3b8" });
    });
    channels.forEach(ch => {
      (["top","middle","bottom"] as StageKey[]).forEach(st => {
        const s = getCenter(`node-channel-${ch}`, "right");
        const e = getCenter(`node-stage-${st}`, "left");
        if (s && e) newConns.push({ start: s, end: e, id: `${ch}-${st}`, color: ch === "meta" ? "#3b82f6" : "#10b981" });
      });
    });
    channels.forEach(ch => {
      (["top","middle","bottom"] as StageKey[]).forEach(st => {
        const auds = ch === "meta" ? campaign.meta[st] : campaign.google[st];
        auds.forEach((a: any) => {
          const s = getCenter(`node-stage-${st}`, "right");
          const e = getCenter(`node-aud-${a.id}`, "left");
          if (s && e) newConns.push({ start: s, end: e, id: `${st}-${a.id}`, color: "#cbd5e1" });

          // Conexões público → criativo
          a.creatives?.forEach((cr: any) => {
            const cs = getCenter(`node-aud-${a.id}`, "right");
            const ce = getCenter(`node-cr-${cr.id}`, "left");
            if (cs && ce) newConns.push({ start: cs, end: ce, id: `aud-cr-${cr.id}`, color: ch === "meta" ? "#bfdbfe" : "#a7f3d0" });
          });
        });
      });
    });
    setConnections(newConns);
  }, [campaign, channels]);

  useEffect(() => {
    const t = setTimeout(calculatePaths, 50);
    window.addEventListener("resize", calculatePaths);
    return () => { clearTimeout(t); window.removeEventListener("resize", calculatePaths); };
  }, [calculatePaths]);

  // Ctrl+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistory(prev => {
          if (!prev.length) return prev;
          onUpdate(prev[prev.length - 1]);
          return prev.slice(0, -1);
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUpdate]);

  // ── Helpers de mutação ───────────────────────────────────────────────────

  const pushUpdate = useCallback((updated: Campaign) => {
    setHistory(prev => [...prev.slice(-9), campaign]);
    onUpdate(updated);
  }, [campaign, onUpdate]);

  const moveCreative = useCallback((creativeId: string, srcId: string, tgtId: string) => {
    if (srcId === tgtId) return;
    const STAGES: StageKey[] = ["top","middle","bottom"];
    let srcCh: "meta"|"google"|null = null, tgtCh: "meta"|"google"|null = null;
    STAGES.forEach(s => {
      if (campaign.meta[s].find((a: any) => a.id === srcId))   srcCh = "meta";
      if (campaign.google[s].find((a: any) => a.id === srcId)) srcCh = "google";
      if (campaign.meta[s].find((a: any) => a.id === tgtId))   tgtCh = "meta";
      if (campaign.google[s].find((a: any) => a.id === tgtId)) tgtCh = "google";
    });
    if (srcCh !== tgtCh) return;
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    let cr: any = null;
    STAGES.forEach(s => {
      [...clone.meta[s], ...clone.google[s]].forEach((a: any) => {
        if (a.id === srcId) { const i = a.creatives.findIndex((c: any) => c.id === creativeId); if (i !== -1) cr = a.creatives.splice(i, 1)[0]; }
      });
    });
    if (!cr) return;
    STAGES.forEach(s => {
      [...clone.meta[s], ...clone.google[s]].forEach((a: any) => { if (a.id === tgtId) a.creatives.push(cr); });
    });
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const toggleChannel = useCallback((channel: "meta"|"google") => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    if (channel === "meta") clone.budgetAllocation.metaEnabled   = !clone.budgetAllocation.metaEnabled;
    else                    clone.budgetAllocation.googleEnabled = !clone.budgetAllocation.googleEnabled;
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const updateStageMetric = useCallback((stage: StageKey, v: string, u: string) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    clone.funnel[stage].metricValue = v;
    clone.funnel[stage].metricUnit  = u;
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const addAudience = useCallback((channel: "meta"|"google", stage: StageKey) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const newId = uid();
    (clone[channel][stage] as any[]).push({ id: newId, title: channel === "meta" ? "Novo Público Meta" : "Novo Público Google", description: "", tag: "Segmentação", creatives: [] });
    pushUpdate(clone);
    // Abre o painel para o novo público automaticamente
    setPanelAudience({ id: newId, channel, stage });
    setActiveAudienceId(newId);
  }, [campaign, pushUpdate]);

  const addCreative = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey, creative: any) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (aud) {
      const newCr = { ...creative, id: uid() };
      aud.creatives.push(newCr);
    }
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const updateCreative = useCallback((creativeId: string, audienceId: string, channel: "meta"|"google", stage: StageKey, updated: any) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (aud) {
      const idx = aud.creatives.findIndex((c: any) => c.id === creativeId);
      if (idx !== -1) aud.creatives[idx] = { ...updated, id: creativeId };
    }
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const deleteCreative = useCallback((creativeId: string, audienceId: string, channel: "meta"|"google", stage: StageKey) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (aud) aud.creatives = aud.creatives.filter((c: any) => c.id !== creativeId);
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const deleteAudience = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    (clone[channel] as any)[stage] = (clone[channel][stage] as any[]).filter((a: any) => a.id !== audienceId);
    if (activeAudienceId === audienceId)        setActiveAudienceId(null);
    if (panelAudience?.id === audienceId)       setPanelAudience(null);
    pushUpdate(clone);
  }, [campaign, pushUpdate, activeAudienceId, panelAudience]);

  const duplicateAudience = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const src = clone[channel][stage] as any[];
    const orig = src.find((a: any) => a.id === audienceId);
    if (!orig) return;
    const newId = uid();
    const copy = { ...JSON.parse(JSON.stringify(orig)), id: newId, title: `${orig.title} (cópia)`, creatives: orig.creatives.map((c: any) => ({ ...c, id: uid() })) };
    src.splice(src.findIndex((a: any) => a.id === audienceId) + 1, 0, copy);
    pushUpdate(clone);
    setPanelAudience({ id: newId, channel, stage });
    setActiveAudienceId(newId);
  }, [campaign, pushUpdate]);

  const duplicateCreative = useCallback((creativeId: string, audienceId: string, channel: "meta"|"google", stage: StageKey) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (!aud) return;
    const idx = aud.creatives.findIndex((c: any) => c.id === creativeId);
    if (idx === -1) return;
    const copy = { ...JSON.parse(JSON.stringify(aud.creatives[idx])), id: uid(), name: `${aud.creatives[idx].name} (cópia)` };
    aud.creatives.splice(idx + 1, 0, copy);
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const renameAudience = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey, title: string) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const a = (clone[channel][stage] as any[]).find((x: any) => x.id === audienceId);
    if (a) a.title = title;
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const updateAudience = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey, data: any) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const auds = (clone[channel][stage] as any[]);
    const idx = auds.findIndex((x: any) => x.id === audienceId);
    if (idx !== -1) {
      auds[idx] = { ...auds[idx], ...data };
    }
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const moveAudience = useCallback((
    audienceId: string, fromCh: "meta"|"google", fromStage: StageKey, toCh: "meta"|"google", toStage: StageKey
  ) => {
    if (fromCh !== toCh || fromStage === toStage) return;
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const src   = clone[fromCh][fromStage] as any[];
    const idx   = src.findIndex((a: any) => a.id === audienceId);
    if (idx === -1) return;
    const [aud] = src.splice(idx, 1);
    (clone[fromCh] as any)[fromStage] = src;
    (clone[toCh] as any)[toStage]     = [...(clone[toCh][toStage] as any[]), aud];
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const addAudienceFromLibrary = useCallback((channel: "meta"|"google", stage: StageKey, saved: any) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const newId = uid();
    const base = saved.audience;
    (clone[channel][stage] as any[]).push({
      ...base,
      id: newId,
      creatives: []
    });
    pushUpdate(clone);
    setPanelAudience({ id: newId, channel, stage });
    setActiveAudienceId(newId);
  }, [campaign, pushUpdate]);

  // Encontra público e criativos dado um id
  const findAudience = useCallback((id: string) => {
    for (const s of ["top","middle","bottom"] as StageKey[]) {
      const m = (campaign.meta?.[s] || []).find((a: any) => a.id === id);
      if (m) return { audience: m, channel: "meta" as const, stage: s };
      const g = (campaign.google?.[s] || []).find((a: any) => a.id === id);
      if (g) return { audience: g, channel: "google" as const, stage: s };
    }
    return null;
  }, [campaign]);

  // Abre o painel lateral ao clicar num card
  const handleAudienceClick = useCallback((id: string, channel: "meta"|"google", stage: StageKey) => {
    setPanelAudience(prev => prev?.id === id ? null : { id, channel, stage });
    setActiveAudienceId(id);
  }, []);

  const zoomBy = (delta: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx   = rect.width  / 2;
    const cy   = rect.height / 2;
    const oldZ = zoom.current;
    const newZ = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((oldZ + delta).toFixed(2))));
    zoom.current = newZ;
    pan.current  = { x: cx - (cx - pan.current.x) * (newZ / oldZ), y: cy - (cy - pan.current.y) * (newZ / oldZ) };
    applyTransform();
    rerender();
    setTimeout(calculatePaths, 50);
  };

  const resetView = () => { autoFit(); setTimeout(calculatePaths, 120); };

  const [showCreativeForm, setShowCreativeForm] = useState(false);

  // Fecha o formulário quando o painel troca de público
  useEffect(() => { 
    setShowCreativeForm(false); 
    setEditingCreativeId(null);
  }, [panelAudience?.id]);

  const panelData = panelAudience ? findAudience(panelAudience.id) : null;
  const currentZoom = zoom.current;

  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm" style={{ minHeight: 600, height: isMobile ? "auto" : 680 }}>

      {/* ── CANVAS ─────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden pointer-events-auto h-[500px] lg:h-full"
        style={{ cursor: "default" }}
      >
        {/* Grid de fundo pontilhado */}
        <svg
          ref={gridRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        >
          <defs>
            <pattern id="dot-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <circle cx={GRID_SIZE / 2} cy={GRID_SIZE / 2} r="0.9" fill="#cbd5e1" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Controles de zoom */}
        <div className="absolute top-3 right-3 z-50 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm">
          <button onClick={() => zoomBy(ZOOM_STEP)}  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"><ZoomIn  className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums w-8 text-center select-none">{Math.round(currentZoom * 100)}%</span>
          <button onClick={() => zoomBy(-ZOOM_STEP)} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
          <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
          <button onClick={resetView} title="Ajustar à tela" className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><Maximize2 className="w-3 h-3" /></button>
        </div>

        {/* Atalhos */}
        <div className="absolute bottom-3 left-3 z-50 text-[9px] text-slate-300 font-medium select-none pointer-events-none leading-relaxed">
          Scroll para zoom · Arrastar para navegar · Ctrl+Z desfaz · 2× clique renomeia
        </div>

        {/* Canvas transformável */}
        <div
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, transformOrigin: "0 0", willChange: "transform" }}
        >
          {/* SVG de conexões */}
          <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" style={{ width: "100%", height: "100%" }}>
            {connections.map(conn => {
              const r   = 12; // raio do canto arredondado
              const mx  = conn.start.x + (conn.end.x - conn.start.x) * 0.5; // ponto médio x
              const sy  = conn.start.y;
              const ey  = conn.end.y;
              const dySign = ey > sy ? 1 : -1;
              // Linha reta horizontal → cotovelo Q → linha vertical → cotovelo Q → linha horizontal
              const path = [
                `M ${conn.start.x} ${sy}`,
                `L ${mx - r} ${sy}`,
                `Q ${mx} ${sy} ${mx} ${sy + dySign * r}`,
                `L ${mx} ${ey - dySign * r}`,
                `Q ${mx} ${ey} ${mx + r} ${ey}`,
                `L ${conn.end.x} ${ey}`,
              ].join(" ");
              return (
                <motion.path key={conn.id} d={path} fill="none" stroke={conn.color} strokeWidth="1.5" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          <div className="flex items-start relative z-10" style={{ gap: 44, padding: "64px 56px" }}>

            {/* COLUNA 0: CAMPANHA */}
            <div className="flex flex-col pt-20">
              <div id="node-campaign" className="w-36 p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2.5 shadow">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{campaign.name}</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Estratégia Global</p>
              </div>
            </div>

            {/* COLUNA 1: CANAIS */}
            <div className="flex flex-col pt-10" style={{ gap: 80 }}>
              {(["meta","google"] as const).map(channel => {
                const isEnabled = channel === "meta" ? campaign.budgetAllocation.metaEnabled : campaign.budgetAllocation.googleEnabled;
                return (
                  <motion.div
                    key={channel}
                    id={`node-channel-${channel}`}
                    onClick={() => toggleChannel(channel)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={`w-32 p-3 rounded-xl border-2 shadow cursor-pointer select-none transition-all ${
                      isEnabled
                        ? channel === "meta" ? "bg-white border-blue-200" : "bg-white border-emerald-200"
                        : "bg-slate-50 border-slate-200 opacity-40 grayscale"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${channel === "meta" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                      {channel === "meta" ? <Share2 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-[11px] font-bold text-slate-900">{channel === "meta" ? "Meta Ads" : "Google Ads"}</p>
                    <span className={`text-[8px] font-bold mt-1 block ${isEnabled ? "text-emerald-500" : "text-slate-300"}`}>{isEnabled ? "ATIVO" : "INATIVO"}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* COLUNA 2: ESTÁGIOS + PÚBLICOS */}
            <div className="flex flex-col" style={{ gap: 28 }}>
              {(["top","middle","bottom"] as StageKey[]).map(stageKey => {
                const metaAuds   = campaign.budgetAllocation.metaEnabled   ? (campaign.meta?.[stageKey]   || []) : [];
                const googleAuds = campaign.budgetAllocation.googleEnabled ? (campaign.google?.[stageKey] || []) : [];
                const isCollapsed = collapsedStages.has(stageKey);
                const toggleCollapse = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setCollapsedStages(prev => {
                    const next = new Set(prev);
                    next.has(stageKey) ? next.delete(stageKey) : next.add(stageKey);
                    return next;
                  });
                  setTimeout(calculatePaths, 80);
                };

                return (
                  <div key={stageKey} className="flex items-start relative" style={{ gap: 28 }}>
                    {/* Nó de estágio */}
                    <div className="flex flex-col items-start gap-1.5 pt-1">
                      <motion.div
                        id={`node-stage-${stageKey}`}
                        onClick={() => setExpandedStageKey(p => p === stageKey ? null : stageKey)}
                        whileHover={{ scale: 1.02 }}
                        className={`w-28 p-2.5 rounded-xl border-2 shadow-sm bg-white cursor-pointer select-none ${FLOW_STAGE_LABELS[stageKey].bg} border-slate-200`}
                      >
                        <div className={`text-[7px] font-black uppercase tracking-widest mb-0.5 bg-gradient-to-r ${FLOW_STAGE_LABELS[stageKey].color} bg-clip-text text-transparent`}>
                          {stageKey.toUpperCase()}
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-900">{FLOW_STAGE_LABELS[stageKey].label}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[8px] font-bold text-slate-500 truncate flex-1">{campaign.funnel[stageKey]?.metricValue || "—"}</span>
                          <PenLine className="w-2 h-2 text-slate-300 flex-shrink-0" />
                        </div>
                        {/* Botão recolher */}
                        <button
                          onClick={toggleCollapse}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 text-[8px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <motion.span
                            animate={{ rotate: isCollapsed ? -90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="inline-flex"
                          >
                            <ChevronRight className="w-2.5 h-2.5" />
                          </motion.span>
                          {isCollapsed ? "Expandir" : "Recolher"}
                        </button>
                      </motion.div>
                      <AnimatePresence>
                        {expandedStageKey === stageKey && (
                          <MetricPopover
                            metricValue={campaign.funnel[stageKey]?.metricValue ?? ""}
                            metricUnit={campaign.funnel[stageKey]?.metricUnit ?? ""}
                            onSubmit={(v, u) => { updateStageMetric(stageKey, v, u); setExpandedStageKey(null); }}
                            onClose={() => setExpandedStageKey(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Popovers de biblioteca (fora do overflow:hidden do collapse) */}
                    <AnimatePresence>
                      {libraryStageKey === stageKey && libraryChannel === "meta" && (
                        <LibraryPopover
                          onSelect={(saved) => { addAudienceFromLibrary("meta", stageKey, saved); setLibraryStageKey(null); setLibraryChannel(null); }}
                          onClose={() => { setLibraryStageKey(null); setLibraryChannel(null); }}
                        />
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {libraryStageKey === stageKey && libraryChannel === "google" && (
                        <LibraryPopover
                          onSelect={(saved) => { addAudienceFromLibrary("google", stageKey, saved); setLibraryStageKey(null); setLibraryChannel(null); }}
                          onClose={() => { setLibraryStageKey(null); setLibraryChannel(null); }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Sub-grupos de públicos + criativos */}
                    <AnimatePresence initial={false}>
                    {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                    <div className="flex flex-col" style={{ gap: 12 }}>

                      {/* ── Meta ── */}
                      {campaign.budgetAllocation.metaEnabled && (
                        <DropZone
                          active={draggingAudience?.channel === "meta" && draggingAudience?.stage !== stageKey}
                          isTarget={audienceDropTarget?.channel === "meta" && audienceDropTarget?.stage === stageKey}
                          accentColor="blue"
                          onEnter={() => { if (draggingAudience?.channel === "meta") setAudienceDropTarget({ channel: "meta", stage: stageKey }); }}
                          onLeave={() => { if (draggingAudience?.channel === "meta") setAudienceDropTarget(null); }}
                        >
                          {metaAuds.map((aud: any) => (
                            <div key={aud.id} className="flex items-start" style={{ gap: 20 }}>
                              <AudienceNode
                                audience={aud}
                                channel="meta"
                                isHovered={hoveredAudienceId === aud.id}
                                isPanelOpen={panelAudience?.id === aud.id}
                                isCreativeDropTarget={draggingCreative !== null && hoveredAudienceId === aud.id}
                                onClick={() => handleAudienceClick(aud.id, "meta", stageKey)}
                                onDragOver={() => { if (!draggingAudience) setHoveredAudienceId(aud.id); }}
                                onDragLeave={() => { if (!draggingAudience) setHoveredAudienceId(null); }}
                                onDelete={() => deleteAudience(aud.id, "meta", stageKey)}
                                onDuplicate={() => duplicateAudience(aud.id, "meta", stageKey)}
                                onRename={t => renameAudience(aud.id, "meta", stageKey, t)}
                                onDragStartAudience={() => setDraggingAudience({ audienceId: aud.id, channel: "meta", stage: stageKey })}
                                onDragEndAudience={() => {
                                  if (audienceDropTarget && draggingAudience && !(audienceDropTarget.channel === draggingAudience.channel && audienceDropTarget.stage === draggingAudience.stage))
                                    moveAudience(draggingAudience.audienceId, draggingAudience.channel, draggingAudience.stage, audienceDropTarget.channel, audienceDropTarget.stage);
                                  setDraggingAudience(null); setAudienceDropTarget(null);
                                }}
                              />
                              {aud.creatives.length > 0 && (
                                <div className="flex flex-col" style={{ gap: 6 }}>
                                  {aud.creatives.map((cr: any) => (
                                    <CreativeNode key={cr.id} creative={cr} audienceId={aud.id} channel="meta"
                                      onDuplicate={() => duplicateCreative(cr.id, aud.id, "meta", stageKey)}
                                      onDelete={() => deleteCreative(cr.id, aud.id, "meta", stageKey)}
                                      onDragStart={() => { draggingCreativeRef.current = { creativeId: cr.id, fromAudienceId: aud.id }; setDraggingCreative({ creativeId: cr.id, fromAudienceId: aud.id, channel: "meta", stage: stageKey }); }}
                                      onDragEnd={(_, info) => {
                                        const el = document.elementFromPoint(info.point.x, info.point.y);
                                        const audNode = el?.closest("[data-audience-id]") as HTMLElement | null;
                                        const toId = audNode?.dataset.audienceId;
                                        const ref = draggingCreativeRef.current;
                                        if (toId && ref && toId !== ref.fromAudienceId) moveCreative(ref.creativeId, ref.fromAudienceId, toId);
                                        draggingCreativeRef.current = null;
                                        setDraggingCreative(null); setCreativeDropTarget(null);
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <AddButton label="Público Meta" color="blue" onClick={() => addAudience("meta", stageKey)} />
                            <button
                              onClick={() => { setLibraryStageKey(stageKey); setLibraryChannel("meta"); }}
                               className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                              title="Biblioteca"
                            >
                              <Book className="w-4 h-4" />
                            </button>
                          </div>
                        </DropZone>
                      )}

                      {/* ── Google ── */}
                      {campaign.budgetAllocation.googleEnabled && (
                        <DropZone
                          active={draggingAudience?.channel === "google" && draggingAudience?.stage !== stageKey}
                          isTarget={audienceDropTarget?.channel === "google" && audienceDropTarget?.stage === stageKey}
                          accentColor="emerald"
                          onEnter={() => { if (draggingAudience?.channel === "google") setAudienceDropTarget({ channel: "google", stage: stageKey }); }}
                          onLeave={() => { if (draggingAudience?.channel === "google") setAudienceDropTarget(null); }}
                        >
                          {googleAuds.map((aud: any) => (
                            <div key={aud.id} className="flex items-start" style={{ gap: 20 }}>
                              <AudienceNode
                                audience={aud}
                                channel="google"
                                isHovered={hoveredAudienceId === aud.id}
                                isPanelOpen={panelAudience?.id === aud.id}
                                isCreativeDropTarget={draggingCreative !== null && hoveredAudienceId === aud.id}
                                onClick={() => handleAudienceClick(aud.id, "google", stageKey)}
                                onDragOver={() => { if (!draggingAudience) setHoveredAudienceId(aud.id); }}
                                onDragLeave={() => { if (!draggingAudience) setHoveredAudienceId(null); }}
                                onDelete={() => deleteAudience(aud.id, "google", stageKey)}
                                onDuplicate={() => duplicateAudience(aud.id, "google", stageKey)}
                                onRename={t => renameAudience(aud.id, "google", stageKey, t)}
                                onDragStartAudience={() => setDraggingAudience({ audienceId: aud.id, channel: "google", stage: stageKey })}
                                onDragEndAudience={() => {
                                  if (audienceDropTarget && draggingAudience && !(audienceDropTarget.channel === draggingAudience.channel && audienceDropTarget.stage === draggingAudience.stage))
                                    moveAudience(draggingAudience.audienceId, draggingAudience.channel, draggingAudience.stage, audienceDropTarget.channel, audienceDropTarget.stage);
                                  setDraggingAudience(null); setAudienceDropTarget(null);
                                }}
                              />
                              {aud.creatives.length > 0 && (
                                <div className="flex flex-col" style={{ gap: 6 }}>
                                  {aud.creatives.map((cr: any) => (
                                    <CreativeNode key={cr.id} creative={cr} audienceId={aud.id} channel="google"
                                      onDuplicate={() => duplicateCreative(cr.id, aud.id, "google", stageKey)}
                                      onDelete={() => deleteCreative(cr.id, aud.id, "google", stageKey)}
                                      onDragStart={() => { draggingCreativeRef.current = { creativeId: cr.id, fromAudienceId: aud.id }; setDraggingCreative({ creativeId: cr.id, fromAudienceId: aud.id, channel: "google", stage: stageKey }); }}
                                      onDragEnd={(_, info) => {
                                        const el = document.elementFromPoint(info.point.x, info.point.y);
                                        const audNode = el?.closest("[data-audience-id]") as HTMLElement | null;
                                        const toId = audNode?.dataset.audienceId;
                                        const ref = draggingCreativeRef.current;
                                        if (toId && ref && toId !== ref.fromAudienceId) moveCreative(ref.creativeId, ref.fromAudienceId, toId);
                                        draggingCreativeRef.current = null;
                                        setDraggingCreative(null); setCreativeDropTarget(null);
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <AddButton label="Público Google" color="emerald" onClick={() => addAudience("google", stageKey)} />
                            <button
                              onClick={() => { setLibraryStageKey(stageKey); setLibraryChannel("google"); }}
                               className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-400 hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
                              title="Biblioteca"
                            >
                              <Book className="w-4 h-4" />
                            </button>
                          </div>
                        </DropZone>
                      )}
                    </div>
                    </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botão Desfazer */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              onClick={() => setHistory(prev => { if (!prev.length) return prev; onUpdate(prev[prev.length - 1]); return prev.slice(0, -1); })}
              className="absolute bottom-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-xl hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {panelData && (
          <motion.div
            key={panelData.audience.id}
            initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { height: "auto", opacity: 1 } : { width: 280, opacity: 1 }}
            exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className={`flex-shrink-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200 bg-white z-50 ${isMobile ? "w-full" : ""}`}
          >
            <div className={`${isMobile ? "w-full" : "w-[280px]"} h-full flex flex-col overflow-hidden`}>
              {/* Cabeçalho / Edição de Público */}
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-slate-200 bg-slate-50/30">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className={`text-[8px] font-black uppercase tracking-widest ${panelData.channel === "meta" ? "text-blue-500" : "text-emerald-500"}`}>
                    {panelData.channel === "meta" ? "Meta Ads" : "Google Ads"} · {FLOW_STAGE_LABELS[panelData.stage].label}
                  </div>
                  <input
                    value={panelData.audience.title}
                    onChange={(e) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { title: e.target.value })}
                    className="text-sm font-bold text-slate-900 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-100 rounded px-1 -ml-1 h-6 hover:bg-white"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    <input
                      value={panelData.audience.tag || ""}
                      placeholder="Tag (ex: Lookalike)"
                      onChange={(e) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { tag: e.target.value })}
                       className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 outline-none w-24 focus:border-blue-200"
                    />
                  </div>

                  <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-50">
                    <Field 
                      label="Sobre" 
                      value={panelData.audience.about || ""} 
                      onChange={(v) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { about: v })}
                      placeholder="Descrição detalhada do público"
                      multiline
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Field 
                        label="Gênero" 
                        value={panelData.audience.gender || ""} 
                        onChange={(v) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { gender: v })}
                        placeholder="Ex: Ambos"
                      />
                      <Field 
                        label="Idade" 
                        value={panelData.audience.ageRange || ""} 
                        onChange={(v) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { ageRange: v })}
                        placeholder="Ex: 25-45"
                      />
                    </div>
                    <Field 
                      label="Interesses" 
                      value={panelData.audience.interests || ""} 
                      onChange={(v) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { interests: v })}
                      placeholder="Ex: Tecnologia, Imóveis"
                    />
                    <Field 
                      label="Palavras-chave" 
                      value={panelData.audience.keywords || ""} 
                      onChange={(v) => updateAudience(panelData.audience.id, panelData.channel, panelData.stage, { keywords: v })}
                      placeholder="Ex: comprar casa, financiamento"
                    />
                  </div>
                </div>
                  <button 
                    onClick={() => saveAudience(`${panelData.audience.title} (${panelData.channel})`, panelData.channel, panelData.audience)}
                    className="p-1 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0"
                    title="Salvar na biblioteca"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setPanelAudience(null); setActiveAudienceId(null); }} className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
              </div>

              {/* Criativos */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {panelData.audience.creatives.length} Criativos
                  </p>
                  <button
                    onClick={() => setShowCreativeForm(p => !p)}
                    className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg transition-colors ${
                      showCreativeForm
                        ? "bg-slate-200 text-slate-600"
                        : panelData.channel === "meta"
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    {showCreativeForm ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    {showCreativeForm ? "Cancelar" : "Criativo"}
                  </button>
                </div>

                {/* Formulário inline de novo criativo */}
                <AnimatePresence>
                  {showCreativeForm && (
                    <CreativeForm
                      channel={panelData.channel}
                      onSave={(creative) => {
                        addCreative(panelData.audience.id, panelData.channel, panelData.stage, creative);
                        setShowCreativeForm(false);
                      }}
                      onCancel={() => setShowCreativeForm(false)}
                    />
                  )}
                </AnimatePresence>

                {panelData.audience.creatives.length === 0 && !showCreativeForm && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                      <Box className="w-5 h-5 text-slate-200" />
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium">Nenhum criativo vinculado</p>
                    <p className="text-[9px] text-slate-200 mt-1">Crie ou arraste criativos para cá</p>
                  </div>
                )}

                {panelData.audience.creatives.map((cr: any, idx: number) => {
                  const isEditing = editingCreativeId === cr.id;
                  
                  return (
                    <div key={cr.id} className="space-y-2">
                      <motion.div
                        drag={!isEditing}
                        dragSnapToOrigin
                        onDragEnd={() => {
                          if (hoveredAudienceId && hoveredAudienceId !== panelData.audience.id) {
                            moveCreative(cr.id, panelData.audience.id, hoveredAudienceId);
                          }
                          setHoveredAudienceId(null);
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                        whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 12px 20px -4px rgb(0 0 0 / 0.12)" }}
                        className={`flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-white border transition-all group ${
                          isEditing 
                            ? "bg-white border-blue-200" 
                            : "border-transparent hover:border-slate-200 cursor-grab active:cursor-grabbing"
                        } rounded-xl`}
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                          {cr.imageUrl
                            ? <img src={cr.imageUrl} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center text-slate-200">{creativeIcon(cr.format)}</div>
                          }
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{cr.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[8px] font-bold ${panelData.channel === "meta" ? "text-blue-500" : "text-emerald-500"}`}>{cr.format}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingCreativeId(isEditing ? null : cr.id); setShowCreativeForm(false); }}
                            className={`p-1.5 rounded-lg transition-colors ${isEditing ? "bg-blue-600 text-white" : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"}`}
                            title="Editar criativo"
                          >
                            <PenLine className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteCreative(cr.id, panelData.audience.id, panelData.channel, panelData.stage); }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {!isEditing && <GripVertical className="w-3 h-3 text-slate-200" />}
                      </motion.div>

                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                             className="border border-blue-200 rounded-2xl bg-white overflow-hidden shadow-sm"
                          >
                            <div className="p-1">
                              {panelData.channel === "meta" ? (
                                <MetaCreativeEditor
                                  creative={cr as MetaCreative}
                                  collapsible={false}
                                  onChange={(updated) => updateCreative(cr.id, panelData.audience.id, "meta", panelData.stage, updated)}
                                  onRemove={() => deleteCreative(cr.id, panelData.audience.id, "meta", panelData.stage)}
                                />
                              ) : (
                                <GoogleCreativeEditor
                                  creative={cr as GoogleCreative}
                                  collapsible={false}
                                  onChange={(updated) => updateCreative(cr.id, panelData.audience.id, "google", panelData.stage, updated)}
                                  onRemove={() => deleteCreative(cr.id, panelData.audience.id, "google", panelData.stage)}
                                />
                              )}
                              <div className="px-4 pb-4 flex justify-end">
                                <button 
                                  onClick={() => setEditingCreativeId(null)}
                                  className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                  Concluir Edição
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function DropZone({ children, active, isTarget, accentColor, onEnter, onLeave }: {
  children: React.ReactNode;
  active: boolean;
  isTarget: boolean;
  accentColor: "blue" | "emerald";
  onEnter: () => void;
  onLeave: () => void;
}) {
  const colors = {
    blue:    { target: "bg-blue-50/80 ring-2 ring-blue-300 ring-dashed",    idle: "ring-1 ring-dashed ring-slate-200" },
    emerald: { target: "bg-emerald-50/80 ring-2 ring-emerald-300 ring-dashed", idle: "ring-1 ring-dashed ring-slate-200" },
  };
  return (
    <div
      className={`flex flex-col rounded-xl p-1.5 -m-1.5 transition-all ${active ? (isTarget ? colors[accentColor].target : colors[accentColor].idle) : ""}`}
      style={{ gap: 8 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

function AddButton({ label, color, onClick }: { label: string; color: "blue"|"emerald"; onClick: () => void }) {
  const cls = color === "blue"
    ? "hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40"
    : "hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/40";
  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`w-48 py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 transition-all flex items-center justify-center gap-1.5 ${cls}`}
    >
      <Plus className="w-3 h-3" /> {label}
    </motion.button>
  );
}

interface AudienceNodeProps {
  audience: any;
  channel: "meta"|"google";
  isHovered: boolean;
  isPanelOpen: boolean;
  isCreativeDropTarget: boolean;
  onClick: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (title: string) => void;
  onDragStartAudience: () => void;
  onDragEndAudience: () => void;
}

function AudienceNode({ audience, channel, isHovered, isPanelOpen, isCreativeDropTarget, onClick, onDragOver, onDragLeave, onDelete, onDuplicate, onRename, onDragStartAudience, onDragEndAudience }: AudienceNodeProps) {
  const [editing, setEditing] = useState(false);
  const creativeCount = audience.creatives.length;
  const statusColor = creativeCount === 0 ? "bg-red-100 text-red-400" : creativeCount < 3 ? "bg-amber-100 text-amber-500" : "bg-emerald-100 text-emerald-600";

  return (
    <motion.div
      id={`node-aud-${audience.id}`}
      data-audience-id={audience.id}
      drag dragSnapToOrigin
      onDragStart={onDragStartAudience}
      onDragEnd={onDragEndAudience}
      onMouseEnter={onDragOver}
      onMouseLeave={onDragLeave}
      onClick={onClick}
      data-draggable="true"
      whileDrag={{ scale: 1.04, zIndex: 100, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.13)" }}
      className={`w-48 p-2.5 rounded-xl border-2 transition-all cursor-pointer relative group ${
        isCreativeDropTarget
          ? channel === "meta" ? "bg-blue-50 border-blue-400 border-dashed shadow-md ring-2 ring-blue-300/40" : "bg-emerald-50 border-emerald-400 border-dashed shadow-md ring-2 ring-emerald-300/40"
          : isPanelOpen
          ? channel === "meta" ? "bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-500/10" : "bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-500/10"
          : isHovered
          ? "bg-blue-50 border-blue-400 border-dashed shadow-md"
           : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
          channel === "meta"
            ? isPanelOpen ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-500"
            : isPanelOpen ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-500"
        }`}>
          <Users className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              defaultValue={audience.title}
              onBlur={e => { onRename(e.target.value); setEditing(false); }}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }}
              onClick={e => e.stopPropagation()}
              className="text-[11px] font-bold text-slate-900 bg-transparent border-b border-blue-400 outline-none w-full"
            />
          ) : (
            <p className="text-[11px] font-bold text-slate-900 truncate" onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}>
              {audience.title || "Público sem nome"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-0.5 rounded text-slate-300 hover:text-blue-400">
            <Copy className="w-2.5 h-2.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded text-slate-300 hover:text-red-400">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Badge de criativos + indicador de status */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>
          {creativeCount} {creativeCount === 1 ? "criativo" : "criativos"}
        </span>
        {isPanelOpen && <ChevronRight className="w-2.5 h-2.5 text-slate-400" />}
      </div>

      <div className="absolute right-1.5 bottom-1.5 text-slate-200 group-hover:text-slate-300 transition-colors">
        <GripVertical className="w-2.5 h-2.5" />
      </div>
    </motion.div>
  );
}

function CreativeNode({ creative, audienceId, channel, onDuplicate, onDelete, onDragStart, onDragEnd }: {
  creative: any; audienceId: string; channel: "meta" | "google";
  onDuplicate: () => void; onDelete: () => void;
  onDragStart: () => void; onDragEnd: (e: any, info: any) => void;
}) {
  const isGoogle = channel === "google";
  const accent = isGoogle ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-blue-600 bg-blue-50 border-blue-200";
  return (
    <motion.div
      id={`node-cr-${creative.id}`}
      drag dragSnapToOrigin
      data-draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      whileDrag={{ scale: 1.08, zIndex: 100, boxShadow: "0 12px 20px -4px rgb(0 0 0 / 0.15)", opacity: 0.9 }}
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${accent} shadow-sm cursor-grab active:cursor-grabbing`}
      style={{ width: 152 }}
    >
      <div className="shrink-0 opacity-70">{creativeIcon(creative.format)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-700 truncate leading-none">{creative.name || creative.format}</p>
        <p className="text-[8px] text-slate-400 mt-0.5 leading-none">{creative.format}</p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-0.5 rounded text-slate-300 hover:text-blue-400">
          <Copy className="w-2 h-2" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded text-slate-300 hover:text-red-400">
          <X className="w-2 h-2" />
        </button>
      </div>
    </motion.div>
  );
}

function CreativeForm({ channel, onSave, onCancel }: {
  channel: "meta" | "google";
  onSave: (creative: any) => void;
  onCancel: () => void;
}) {
  const metaFormats = ["Image", "Video", "Carousel"] as const;
  const googleFormats = ["Search", "Display", "YouTube", "Discovery", "PMax"] as const;
  const formats = channel === "meta" ? metaFormats : googleFormats;

  const [name, setName]           = useState("");
  const [format, setFormat]       = useState(formats[0] as string);
  const [imageUrl, setImageUrl]   = useState("");
  const [headline, setHeadline]   = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [cta, setCta]             = useState("");
  const [description, setDescription] = useState("");

  const btnCls   = channel === "meta" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700";
  const inputCls = `w-full px-2 py-1.5 text-[10px] border border-slate-200 rounded-lg outline-none ${
    channel === "meta" ? "focus:border-blue-400" : "focus:border-emerald-400"
  } placeholder:text-slate-300`;

  const handleSave = () => {
    if (!name.trim()) return;
    const base = { name: name.trim(), format, imageUrl, headline };
    const creative = channel === "meta"
      ? { ...base, primaryText, cta }
      : { ...base, description };
    onSave(creative);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className={`flex flex-col gap-2 p-3 rounded-xl border-2 border-dashed mb-2 ${
        channel === "meta" ? "border-blue-200 bg-blue-50/40" : "border-emerald-200 bg-emerald-50/40"
      }`}>
        <p className={`text-[8px] font-black uppercase tracking-widest ${channel === "meta" ? "text-blue-500" : "text-emerald-500"}`}>
          Novo Criativo
        </p>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do criativo *"
          className={inputCls}
        />

        <select
          value={format}
          onChange={e => setFormat(e.target.value)}
          className={inputCls}
        >
          {formats.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {(format === "Image" || format === "Display" || format === "Carousel" || format === "Discovery" || format === "PMax") && (
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="URL da imagem"
            className={inputCls}
          />
        )}

        <input
          value={headline}
          onChange={e => setHeadline(e.target.value)}
          placeholder="Título / Headline"
          className={inputCls}
        />

        {channel === "meta" ? (
          <>
            <textarea
              value={primaryText}
              onChange={e => setPrimaryText(e.target.value)}
              placeholder="Texto principal"
              rows={2}
              className={`${inputCls} resize-none`}
            />
            <input
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="CTA (ex: Saiba mais)"
              className={inputCls}
            />
          </>
        ) : (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        )}

        <div className="flex gap-1.5 mt-1">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`flex-1 py-1.5 text-white text-[9px] font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnCls}`}
          >
            Salvar
          </button>
          <button
            onClick={onCancel}
            className="px-3 text-slate-400 text-[10px] rounded-lg hover:bg-slate-100 transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MetricPopover({ metricValue, metricUnit, onSubmit, onClose }: {
  metricValue: string; metricUnit: string;
  onSubmit: (v: string, u: string) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState(metricValue);
  const [u, setU] = useState(metricUnit);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.13 }}
      className="w-28 bg-white rounded-xl border border-slate-200 shadow-lg p-2.5 flex flex-col gap-2 overflow-hidden"
    >
      <input value={v} onChange={e => setV(e.target.value)} placeholder="Valor" className="w-full px-2 py-1 text-[10px] border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
      <input value={u} onChange={e => setU(e.target.value)} placeholder="Unidade" className="w-full px-2 py-1 text-[10px] border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
      <div className="flex gap-1">
        <button onClick={() => onSubmit(v, u)} className="flex-1 py-1 bg-blue-600 text-white text-[9px] font-bold rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
        <button onClick={onClose} className="px-2 text-slate-400 text-[11px] rounded-lg hover:bg-slate-100 transition-colors">×</button>
      </div>
    </motion.div>
  );
}

function LibraryPopover({ onSelect, onClose }: { onSelect: (s: any) => void; onClose: () => void }) {
  const { savedAudiences, deleteSavedAudience } = useStore();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
       className="absolute top-full left-32 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] p-4 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biblioteca da Agência</h4>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {savedAudiences.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl">
            <Book className="w-6 h-6 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400">Nenhum público salvo</p>
          </div>
        ) : (
          savedAudiences.map((saved) => (
            <div 
              key={saved.id}
               className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onSelect(saved)}
            >
              <div className="flex-1 min-w-0 pr-6 text-left">
                <p className="text-[11px] font-bold text-slate-700 truncate">{saved.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${saved.type === 'meta' ? 'text-blue-500' : 'text-emerald-500'}`}>
                    {saved.type === 'meta' ? 'META' : 'GOOGLE'}
                  </span>
                  {saved.audience.gender && <span className="text-[8px] text-slate-300">· {saved.audience.gender}</span>}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteSavedAudience(saved.id); }}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
