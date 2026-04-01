import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MetaIcon, GoogleIcon } from "./BrandIcons";
import {
  Users,
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
  Link2,
  ExternalLink,
  Zap,
  Pencil,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Campaign, StageKey, MetaCreative, GoogleCreative, SavedAudience, ConversionDestination } from "../data/types";
import { MetaCreativeEditor, GoogleCreativeEditor, Field } from "./CreativeEditors";
import { useIsMobile } from "./ui/use-mobile";
import { useStore } from "../data/store";

import { 
  DropZone, AddButton, AudienceNode, CreativeNode, CreativeForm, 
  MetricPopover, LibraryPopover, DestinationsPanel, FLOW_STAGE_LABELS,
  uid, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, GRID_SIZE, creativeIcon
} from "./StrategyFlowNodes";

const STAGES: StageKey[] = ["top", "middle", "bottom"];

interface StrategyFlowProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
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

  // Drag de conexÃ£o criativo â†’ destino
  const [connectingFrom, setConnectingFrom] = useState<{ creativeId: string; audienceId: string; channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [connectingLine, setConnectingLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [hoveredDestId, setHoveredDestId] = useState<string | null>(null);
  const connectingFromRef = useRef<typeof connectingFrom>(null);

  // Painel lateral
  const [panelAudience, setPanelAudience] = useState<{ id: string; channel: "meta"|"google"; stage: StageKey } | null>(null);
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);

  // Pan & Zoom em refs para evitar stale closures e re-renders desnecessÃ¡rios
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
    // reset temporÃ¡rio para medir tamanho natural do conteÃºdo
    canvas.style.transform = "translate(0px,0px) scale(1)";
    const { width: contentW, height: contentH } = canvas.getBoundingClientRect();
    const padding = 48;
    const fitZoom = Math.min(
      (cw - padding * 2) / contentW,
      (ch - padding * 2) / contentH,
      0.9 // nÃ£o ultra-ampliar
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
      if (target.closest("[data-connect-handle]")) return;
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

  // Auto-fit na montagem (apÃ³s o DOM renderizar)
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

  // Calcula SVG de conexÃµes
  const calculatePaths = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    const z  = zoom.current;
    const newConns: any[] = [];

    const getCenter = (id: string, side: "left"|"right"|"top"|"bottom") => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = side === "right" ? r.right - cr.left : side === "left" ? r.left - cr.left : (r.left + r.width / 2 - cr.left);
      const y = side === "bottom" ? r.bottom - cr.top : side === "top" ? r.top - cr.top : (r.top + r.height / 2 - cr.top);
      return { x: x / z, y: y / z };
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

          // ConexÃµes criativo â†’ destinos (somente os explicitamente vinculados de conversÃ£o)
          a.creatives?.forEach((cr: any) => {
            const cs = getCenter(`node-aud-${a.id}`, "right");
            const ce = getCenter(`node-cr-${cr.id}`, "left");
            if (cs && ce) newConns.push({ start: cs, end: ce, id: `aud-cr-${cr.id}`, color: ch === "meta" ? "#bfdbfe" : "#a7f3d0" });

            (cr.destinationIds || []).forEach((destId: string) => {
              const destObj = (campaign.destinations || []).find(d => d.id === destId);
              if (destObj && destObj.type !== "retargeting") {
                const ds = getCenter(`node-cr-${cr.id}`, "right");
                const de = getCenter(`node-dest-${destId}`, "left");
                if (ds && de) newConns.push({ start: ds, end: de, id: `cr-dest-${cr.id}-${destId}`, color: "#10b981", dashed: true });
              }
            });
          });

          // ConexÃ£o Ãšnica de Retargeting EstratÃ©gico (Hub -> RtgNode)
          const hasRtg = (campaign.destinations || []).some(d => d.type === "retargeting");
          if (hasRtg) {
            const hNode = getCenter(`node-stage-bottom`, "bottom");
            const rNode = getCenter(`node-retargeting-loop`, "top");
            if (hNode && rNode) {
              newConns.push({ start: hNode, end: rNode, id: `hub-rtg-loop`, color: "#7c3aed" });
              
              // RtgNode -> Canal
              const targetCh = campaign.budgetAllocation.metaEnabled ? "meta" : "google";
              const sNode = getCenter(`node-channel-${targetCh}`, "bottom");
              if (sNode) {
                const dropY = 680;
                const radius = 24;
                const path = `M ${rNode.x},${rNode.y + 20} 
                             L ${rNode.x},${dropY - radius} 
                             Q ${rNode.x},${dropY} ${rNode.x - radius},${dropY} 
                             L ${sNode.x + radius},${dropY} 
                             Q ${sNode.x},${dropY} ${sNode.x},${dropY - radius} 
                             L ${sNode.x},${sNode.y}`;

                newConns.push({ 
                  id: `rtg-feedback-loop`, 
                  color: "#fbbf24", 
                  dashed: true, 
                  customPath: path 
                } as any);
              }
            }
          }

          // VÃ­nculos entre destinos de conversÃ£o
          (campaign.destinations || []).forEach((dest) => {
            if (dest.parentId && dest.type !== "retargeting") {
              const childPos = getCenter(`node-dest-${dest.id}`, "top");
              const parentPos = getCenter(`node-dest-${dest.parentId}`, "bottom");
              if (childPos && parentPos) {
                newConns.push({
                  start: parentPos,
                  end: childPos,
                  id: `dest-link-${dest.id}`,
                  color: "#fbbf24",
                  dashed: false
                });
              }
            }
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

  // â”€â”€ Helpers de mutaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const pushUpdate = useCallback((updated: Campaign) => {
    setHistory(prev => [...prev.slice(-9), campaign]);
    onUpdate(updated);
  }, [campaign, onUpdate]);

  const moveCreative = useCallback((creativeId: string, srcId: string, tgtId: string) => {
    if (srcId === tgtId) return;
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
    (clone[channel][stage] as any[]).push({ id: newId, title: channel === "meta" ? "Novo PÃºblico Meta" : "Novo PÃºblico Google", description: "", tag: "SegmentaÃ§Ã£o", creatives: [] });
    pushUpdate(clone);
    // Abre o painel para o novo pÃºblico automaticamente
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
    const copy = { ...JSON.parse(JSON.stringify(orig)), id: newId, title: `${orig.title} (cÃ³pia)`, creatives: orig.creatives.map((c: any) => ({ ...c, id: uid() })) };
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
    const copy = { ...JSON.parse(JSON.stringify(aud.creatives[idx])), id: uid(), name: `${aud.creatives[idx].name} (cÃ³pia)` };
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

  const reorderAudience = useCallback((audienceId: string, channel: "meta"|"google", stage: StageKey, dir: "up"|"down") => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const list = clone[channel][stage] as any[];
    const idx = list.findIndex((a: any) => a.id === audienceId);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(newIdx, 0, item);
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const reorderCreative = useCallback((creativeId: string, audienceId: string, channel: "meta"|"google", stage: StageKey, dir: "up"|"down") => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (!aud) return;
    const idx = aud.creatives.findIndex((c: any) => c.id === creativeId);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= aud.creatives.length) return;
    const [item] = aud.creatives.splice(idx, 1);
    aud.creatives.splice(newIdx, 0, item);
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

  // Encontra pÃºblico e criativos dado um id
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

  // Fecha o formulÃ¡rio quando o painel troca de pÃºblico
  useEffect(() => {
    setShowCreativeForm(false);
    setEditingCreativeId(null);
  }, [panelAudience?.id]);

  // â”€â”€ Destinos de conversÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const destinations: ConversionDestination[] = campaign.destinations || [];

  const addDestination = useCallback(() => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    if (!clone.destinations) clone.destinations = [];
    clone.destinations.push({ id: uid(), label: "Novo Destino", url: "", type: "conversion", event: "", note: "" });
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const updateDestination = useCallback((id: string, data: Partial<ConversionDestination>) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    if (!clone.destinations) return;
    const idx = clone.destinations.findIndex(d => d.id === id);
    if (idx !== -1) clone.destinations[idx] = { ...clone.destinations[idx], ...data };
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const deleteDestination = useCallback((id: string) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    if (!clone.destinations) return;
    clone.destinations = clone.destinations.filter(d => d.id !== id);
    // Remove tambÃ©m os vÃ­nculos nos criativos e de parentId
    ([...clone.destinations]).forEach((d: any) => { if (d.parentId === id) delete d.parentId; });
    (["top","middle","bottom"] as StageKey[]).forEach(st => {
      [...clone.meta[st], ...clone.google[st]].forEach((a: any) => {
        a.creatives?.forEach((cr: any) => {
          if (cr.destinationIds) cr.destinationIds = cr.destinationIds.filter((did: string) => did !== id);
        });
      });
    });
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const reorderDestination = useCallback((id: string, dir: "up" | "down") => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    if (!clone.destinations) return;
    const idx = clone.destinations.findIndex(d => d.id === id);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= clone.destinations.length) return;
    const [item] = clone.destinations.splice(idx, 1);
    clone.destinations.splice(newIdx, 0, item);
    pushUpdate(clone);
  }, [campaign, pushUpdate]);

  const toggleCreativeDestination = useCallback((
    creativeId: string, audienceId: string, channel: "meta"|"google", stage: StageKey, destId: string
  ) => {
    const clone = JSON.parse(JSON.stringify(campaign)) as Campaign;
    const aud = (clone[channel][stage] as any[]).find((a: any) => a.id === audienceId);
    if (!aud) return;
    const cr = aud.creatives.find((c: any) => c.id === creativeId);
    if (!cr) return;
    if (!cr.destinationIds) cr.destinationIds = [];
    const idx = cr.destinationIds.indexOf(destId);
    if (idx === -1) cr.destinationIds.push(destId);
    else cr.destinationIds.splice(idx, 1);
    pushUpdate(clone);
    setTimeout(calculatePaths, 50);
  }, [campaign, pushUpdate, calculatePaths]);

  // Handler global para o drag de conexÃ£o criativo â†’ destino
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!connectingFromRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const srcEl = document.getElementById(`node-cr-${connectingFromRef.current.creativeId}`);
      if (!srcEl) return;
      const srcRect = srcEl.getBoundingClientRect();
      setConnectingLine({
        x1: srcRect.right - rect.left,
        y1: srcRect.top + srcRect.height / 2 - rect.top,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top,
      });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const destNode = el?.closest("[data-dest-id]") as HTMLElement | null;
      setHoveredDestId(destNode?.dataset.destId ?? null);
    };
    const onUp = (e: PointerEvent) => {
      if (!connectingFromRef.current) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const destNode = el?.closest("[data-dest-id]") as HTMLElement | null;
      const destId = destNode?.dataset.destId;
      if (destId) {
        const { creativeId, audienceId, channel, stage } = connectingFromRef.current;
        toggleCreativeDestination(creativeId, audienceId, channel, stage, destId);
      }
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setConnectingLine(null);
      setHoveredDestId(null);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [toggleCreativeDestination]);

  const panelData = panelAudience ? findAudience(panelAudience.id) : null;
  const currentZoom = zoom.current;

  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm" style={{ minHeight: 600, height: isMobile ? "auto" : 680 }}>

      {/* â”€â”€ CANVAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
          <button onClick={resetView} title="Ajustar Ã  tela" className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><Maximize2 className="w-3 h-3" /></button>
        </div>

        {/* Atalhos */}
        <div className="absolute bottom-3 left-3 z-50 text-[9px] text-slate-300 font-medium select-none pointer-events-none leading-relaxed">
          Scroll para zoom Â· Arrastar para navegar Â· Ctrl+Z desfaz Â· 2Ã— clique renomeia
        </div>

        {/* Canvas transformÃ¡vel */}
        <div
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, transformOrigin: "0 0", willChange: "transform" }}
        >
          {/* SVG de conexÃµes */}
          <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" style={{ width: "100%", height: "100%" }}>
            {connections.map(conn => {
              if (conn.customPath) {
                return (
                  <motion.path key={conn.id} d={conn.customPath} fill="none" stroke={conn.color} strokeWidth="2" strokeLinecap="round"
                    strokeDasharray="3 2"
                    initial={{ pathLength: 0, opacity: 0 }} 
                    animate={{ 
                      pathLength: 1, 
                      opacity: 0.6,
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                );
              }

              const r   = 12; // raio do canto arredondado
              const mx  = conn.start.x + (conn.end.x - conn.start.x) * 0.5; // ponto mÃ©dio x
              const sy  = conn.start.y;
              const ey  = conn.end.y;
              const dySign = ey > sy ? 1 : -1;
              // Linha reta horizontal â†’ cotovelo Q â†’ linha vertical â†’ cotovelo Q â†’ linha horizontal
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
                  strokeDasharray={conn.dashed ? "5 4" : undefined}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: conn.dashed ? 0.5 : 0.4 }}
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
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">EstratÃ©gia Global</p>
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
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 bg-white shadow-sm">
                      {channel === "meta" ? <MetaIcon className="w-4 h-4" /> : <GoogleIcon className="w-4 h-4" />}
                    </div>
                    <p className="text-[11px] font-bold text-slate-900">{channel === "meta" ? "Meta Ads" : "Google Ads"}</p>
                    <span className={`text-[8px] font-bold mt-1 block ${isEnabled ? "text-emerald-500" : "text-slate-300"}`}>{isEnabled ? "ATIVO" : "INATIVO"}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* COLUNA 2: ESTÃGIOS + PÃšBLICOS */}
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
                    {/* NÃ³ de estÃ¡gio */}
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
                          <span className="text-[8px] font-bold text-slate-500 truncate flex-1">{campaign.funnel[stageKey]?.metricValue || "â€”"}</span>
                          <PenLine className="w-2.5 h-2.5 text-slate-300 flex-shrink-0" />
                        </div>
                        {/* BotÃ£o recolher */}
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

                    {/* Sub-grupos de pÃºblicos + criativos */}
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

                      {/* â”€â”€ Meta â”€â”€ */}
                      {campaign.budgetAllocation.metaEnabled && (
                        <DropZone
                          active={draggingAudience?.channel === "meta" && draggingAudience?.stage !== stageKey}
                          isTarget={audienceDropTarget?.channel === "meta" && audienceDropTarget?.stage === stageKey}
                          accentColor="blue"
                          onEnter={() => { if (draggingAudience?.channel === "meta") setAudienceDropTarget({ channel: "meta", stage: stageKey }); }}
                          onLeave={() => { if (draggingAudience?.channel === "meta") setAudienceDropTarget(null); }}
                        >
                          {metaAuds.map((aud: any, audIdx: number) => (
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
                                onToggleFlow={() => updateAudience(aud.id, "meta", stageKey, { showInFlow: !aud.showInFlow })}
                                onDragStartAudience={() => setDraggingAudience({ audienceId: aud.id, channel: "meta", stage: stageKey })}
                                onDragEndAudience={() => {
                                  if (audienceDropTarget && draggingAudience && !(audienceDropTarget.channel === draggingAudience.channel && audienceDropTarget.stage === draggingAudience.stage))
                                    moveAudience(draggingAudience.audienceId, draggingAudience.channel, draggingAudience.stage, audienceDropTarget.channel, audienceDropTarget.stage);
                                  setDraggingAudience(null); setAudienceDropTarget(null);
                                }}
                                onReorderUp={() => reorderAudience(aud.id, "meta", stageKey, "up")}
                                onReorderDown={() => reorderAudience(aud.id, "meta", stageKey, "down")}
                                isFirst={audIdx === 0}
                                isLast={audIdx === metaAuds.length - 1}
                              />
                              {aud.creatives.length > 0 && (
                                <div className="flex flex-col" style={{ gap: 6 }}>
                                  {aud.creatives.map((cr: any, crIdx: number) => (
                                    <CreativeNode key={cr.id} creative={cr} audienceId={aud.id} channel="meta"
                                      destinations={destinations}
                                      onStartConnect={(e) => { connectingFromRef.current = { creativeId: cr.id, audienceId: aud.id, channel: "meta", stage: stageKey }; setConnectingFrom({ creativeId: cr.id, audienceId: aud.id, channel: "meta", stage: stageKey }); }}
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
                                      onReorderUp={() => reorderCreative(cr.id, aud.id, "meta", stageKey, "up")}
                                      onReorderDown={() => reorderCreative(cr.id, aud.id, "meta", stageKey, "down")}
                                      isFirst={crIdx === 0}
                                      isLast={crIdx === aud.creatives.length - 1}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <AddButton label="PÃºblico Meta" color="blue" onClick={() => addAudience("meta", stageKey)} />
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

                      {/* â”€â”€ Google â”€â”€ */}
                      {campaign.budgetAllocation.googleEnabled && (
                        <DropZone
                          active={draggingAudience?.channel === "google" && draggingAudience?.stage !== stageKey}
                          isTarget={audienceDropTarget?.channel === "google" && audienceDropTarget?.stage === stageKey}
                          accentColor="emerald"
                          onEnter={() => { if (draggingAudience?.channel === "google") setAudienceDropTarget({ channel: "google", stage: stageKey }); }}
                          onLeave={() => { if (draggingAudience?.channel === "google") setAudienceDropTarget(null); }}
                        >
                          {googleAuds.map((aud: any, audIdx: number) => (
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
                                onToggleFlow={() => updateAudience(aud.id, "google", stageKey, { showInFlow: !aud.showInFlow })}
                                onDragStartAudience={() => setDraggingAudience({ audienceId: aud.id, channel: "google", stage: stageKey })}
                                onDragEndAudience={() => {
                                  if (audienceDropTarget && draggingAudience && !(audienceDropTarget.channel === draggingAudience.channel && audienceDropTarget.stage === draggingAudience.stage))
                                    moveAudience(draggingAudience.audienceId, draggingAudience.channel, draggingAudience.stage, audienceDropTarget.channel, audienceDropTarget.stage);
                                  setDraggingAudience(null); setAudienceDropTarget(null);
                                }}
                                onReorderUp={() => reorderAudience(aud.id, "google", stageKey, "up")}
                                onReorderDown={() => reorderAudience(aud.id, "google", stageKey, "down")}
                                isFirst={audIdx === 0}
                                isLast={audIdx === googleAuds.length - 1}
                              />
                              {aud.creatives.length > 0 && (
                                <div className="flex flex-col" style={{ gap: 6 }}>
                                  {aud.creatives.map((cr: any, crIdx: number) => (
                                    <CreativeNode key={cr.id} creative={cr} audienceId={aud.id} channel="google"
                                      destinations={destinations}
                                      onStartConnect={(e) => { connectingFromRef.current = { creativeId: cr.id, audienceId: aud.id, channel: "google", stage: stageKey }; setConnectingFrom({ creativeId: cr.id, audienceId: aud.id, channel: "google", stage: stageKey }); }}
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
                                      onReorderUp={() => reorderCreative(cr.id, aud.id, "google", stageKey, "up")}
                                      onReorderDown={() => reorderCreative(cr.id, aud.id, "google", stageKey, "down")}
                                      isFirst={crIdx === 0}
                                      isLast={crIdx === aud.creatives.length - 1}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <AddButton label="PÃºblico Google" color="emerald" onClick={() => addAudience("google", stageKey)} />
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
              
              {/* LOOP DE RETARGETING ESTRATÃ‰GICO */}
              {(campaign.destinations || []).some(d => d.type === "retargeting") && (
                <div id="node-retargeting-loop" className="mx-auto mt-4 group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center shadow-sm group-hover:border-violet-400 transition-colors" title="Strategic Loop">
                      <RefreshCw className="w-4 h-4 text-violet-500 animate-[spin_6s_linear_infinite]" />
                    </div>
                    <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest text-center">Loop de<br/>Retargeting</span>
                  </div>
                </div>
              )}
            </div>

            {/* COLUNA 3: DESTINOS DE CONVERSÃƒO */}
            {(campaign.destinations || []).filter(d => d.type !== "retargeting").length > 0 && (
              <div className="flex flex-col justify-center pt-20" style={{ gap: 16 }}>
                <div className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1 text-center font-black">Destinos de ConversÃ£o</div>
                {(campaign.destinations || []).filter(d => d.type !== "retargeting").map(dest => (
                  <div
                    key={dest.id}
                    id={`node-dest-${dest.id}`}
                    className="w-36 p-3 rounded-2xl shadow-sm border-2 bg-white border-slate-200 hover:border-emerald-300 transition-all cursor-default group"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm border border-emerald-400">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 truncate">{dest.label || "Sem tÃ­tulo"}</span>
                    </div>
                    {dest.event && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{dest.event}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linha temporÃ¡ria de conexÃ£o */}
          {connectingLine && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
              <defs>
                <marker id="arrow-tmp" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
                </marker>
              </defs>
              <line
                x1={connectingLine.x1} y1={connectingLine.y1}
                x2={connectingLine.x2} y2={connectingLine.y2}
                stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4"
                markerEnd="url(#arrow-tmp)"
              />
            </svg>
          )}
        </div>

        {/* BotÃ£o Desfazer */}
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
              {/* CabeÃ§alho / EdiÃ§Ã£o de PÃºblico */}
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-slate-200 bg-slate-50/30">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className={`text-[8px] font-black uppercase tracking-widest ${panelData.channel === "meta" ? "text-blue-500" : "text-emerald-500"}`}>
                    {panelData.channel === "meta" ? "Meta Ads" : "Google Ads"} Â· {FLOW_STAGE_LABELS[panelData.stage].label}
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
                      placeholder="DescriÃ§Ã£o detalhada do pÃºblico"
                      multiline
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Field 
                        label="GÃªnero" 
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
                      placeholder="Ex: Tecnologia, ImÃ³veis"
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

                {/* FormulÃ¡rio inline de novo criativo */}
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
                    <p className="text-[9px] text-slate-200 mt-1">Crie ou arraste criativos para cÃ¡</p>
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
                                  Concluir EdiÃ§Ã£o
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

      <DestinationsPanel
        destinations={destinations}
        onAdd={addDestination}
        onUpdate={updateDestination}
        onDelete={deleteDestination}
        onReorder={reorderDestination}
      />
    </div>
  );
}
