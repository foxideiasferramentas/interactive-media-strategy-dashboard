import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Target, Box, GripVertical, Plus, X, PenLine,
  ChevronRight, ChevronUp, ChevronDown, ImageIcon, LayoutGrid, Search, Monitor, Video,
  Maximize2, Trash2, Bookmark, Book, Link2, Zap, Pencil, Check, Eye, EyeOff, RotateCcw
} from "lucide-react";
import { MetaIcon, GoogleIcon } from "./BrandIcons";
import { Campaign, StageKey, MetaCreative, GoogleCreative, ConversionDestination } from "../data/types";
import type { MetaAudience, GoogleAudience, SavedAudience } from "../data/types";
import { MetaCreativeEditor, GoogleCreativeEditor, Field } from "./CreativeEditors";
import { useStore } from "../data/store";

export const uid = () => crypto.randomUUID();

interface AudienceNodeProps {
  audience: MetaAudience | GoogleAudience;
  channel: "meta" | "google";
  isHovered: boolean;
  isPanelOpen: boolean;
  isCreativeDropTarget: boolean;
  onClick: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDragStartAudience: () => void;
  onDragEndAudience: () => void;
  onToggleFlow: () => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface CreativeNodeProps {
  creative: MetaCreative | GoogleCreative;
  audienceId: string;
  channel: "meta" | "google";
  destinations: ConversionDestination[];
  onStartConnect: (e: React.PointerEvent) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: (event: unknown, info: { point: { x: number; y: number } }) => void;
  onReorderUp?: () => void;
  onReorderDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface CreativeFormProps {
  channel: "meta" | "google";
  onSave: (creative: { name: string; format: string }) => void;
  onCancel: () => void;
}

interface MetricPopoverProps {
  metricValue: string;
  metricUnit: string;
  onSubmit: (value: string, unit: string) => void;
  onClose: () => void;
}

interface LibraryPopoverProps {
  onSelect: (saved: SavedAudience) => void;
  onClose: () => void;
}

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;
export const GRID_SIZE = 24;

export const FLOW_STAGE_LABELS: Record<StageKey, { label: string; color: string; bg: string; accent: string }> = {
  top:    { label: "Topo",  color: "from-blue-500 to-blue-600",     bg: "bg-blue-50",    accent: "#3b82f6" },
  middle: { label: "Meio",  color: "from-violet-500 to-violet-600", bg: "bg-violet-50",  accent: "#8b5cf6" },
  bottom: { label: "Fundo", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", accent: "#10b981" },
};

export function creativeIcon(format: string) {
  switch (format?.toLowerCase()) {
    case "imagem":
    case "image":
    case "carrossel":
      return <ImageIcon className="w-4 h-4" />;
    case "vídeo":
    case "video":
    case "reels":
    case "stories":
      return <Video className="w-4 h-4" />;
    case "pesquisa":
    case "search":
      return <Search className="w-4 h-4" />;
    case "display":
      return <LayoutGrid className="w-4 h-4" />;
    case "pmax":
      return <Zap className="w-4 h-4" />;
    default:
      return <Box className="w-4 h-4" />;
  }
}

// ── Componentes de UI ─────────────────────────────────────────────────────
export function DropZone({ children, active, isTarget, accentColor, onEnter, onLeave }: {
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

export function AddButton({ label, color, onClick }: { label: string; color: "blue"|"emerald"; onClick: () => void }) {
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

export function AudienceNode({ audience, channel, isHovered, isPanelOpen, isCreativeDropTarget, onClick, onDragOver, onDragLeave, onDelete, onDuplicate, onRename, onDragStartAudience, onDragEndAudience, onToggleFlow, onReorderUp, onReorderDown, isFirst, isLast }: AudienceNodeProps) {
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
          {channel === "meta" ? <MetaIcon className="w-3.5 h-3.5" color={isPanelOpen ? "white" : undefined} /> : <GoogleIcon className="w-3.5 h-3.5" />}
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
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onReorderUp?.(); }}
              disabled={isFirst}
              className="p-0.5 rounded text-slate-200 hover:text-slate-600 disabled:opacity-20 transition-colors"
              title="Mover para cima"
            >
              <ChevronUp className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onReorderDown?.(); }}
              disabled={isLast}
              className="p-0.5 rounded text-slate-200 hover:text-slate-600 disabled:opacity-20 transition-colors"
              title="Mover para baixo"
            >
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleFlow(); }}
            className={`p-0.5 rounded transition-colors ${audience.showInFlow ? "text-amber-400" : "text-slate-200"}`}
          >
            {audience.showInFlow ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-0.5">
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>
          {creativeCount} {creativeCount === 1 ? "criativo" : "criativos"}
        </span>
      </div>
    </motion.div>
  );
}

export function CreativeNode({ creative, audienceId, channel, destinations, onStartConnect, onDuplicate, onDelete, onDragStart, onDragEnd, onReorderUp, onReorderDown, isFirst, isLast }: CreativeNodeProps) {
  const isGoogle = channel === "google";
  const accent = isGoogle ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-blue-600 bg-blue-50 border-blue-200";
  return (
    <div className="relative group/cr-wrap flex items-center gap-1">
      <div className="flex flex-col gap-0 opacity-0 group-hover/cr-wrap:opacity-100 transition-opacity shrink-0">
        <button
          onClick={e => { e.stopPropagation(); onReorderUp?.(); }}
          disabled={isFirst}
          className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
          title="Mover para cima"
        >
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onReorderDown?.(); }}
          disabled={isLast}
          className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
          title="Mover para baixo"
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>
      <div className="relative group/cr">
        <motion.div
          id={`node-cr-${creative.id}`}
          drag dragSnapToOrigin
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${accent} shadow-sm cursor-grab active:cursor-grabbing`}
          style={{ width: 152 }}
        >
          <div className="shrink-0 opacity-70">{creativeIcon(creative.format)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-slate-700 truncate leading-none">{creative.name || creative.format}</p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/cr:opacity-100 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded text-slate-300 hover:text-red-400"><X className="w-2 h-2" /></button>
          </div>
        </motion.div>
        {destinations.length > 0 && (
          <div
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onStartConnect(e); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[10px] w-4 h-4 rounded-full border-2 bg-white border-amber-400 flex items-center justify-center cursor-crosshair z-20 opacity-0 group-hover/cr:opacity-100 transition-all"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function CreativeForm({ channel, onSave, onCancel }: CreativeFormProps) {
  const formats = channel === "meta" ? ["Image", "Video", "Carousel"] : ["Search", "Display", "YouTube", "Discovery", "PMax"];
  const [name, setName] = useState("");
  const btnCls = channel === "meta" ? "bg-blue-600" : "bg-emerald-600";
  return (
    <div className="p-3 rounded-xl border-2 border-dashed bg-slate-50/40">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do criativo" className="w-full px-2 py-1.5 text-[10px] border border-slate-200 rounded-lg outline-none" />
      <div className="flex gap-1.5 mt-2">
        <button onClick={() => onSave({ name, format: formats[0] })} className={`flex-1 py-1.5 text-white text-[9px] font-bold rounded-lg ${btnCls}`}>Salvar</button>
        <button onClick={onCancel} className="px-3 text-slate-400">×</button>
      </div>
    </div>
  );
}

export function MetricPopover({ metricValue, metricUnit, onSubmit, onClose }: MetricPopoverProps) {
  const [v, setV] = useState(metricValue);
  const [u, setU] = useState(metricUnit);
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="w-28 bg-white border rounded-xl shadow-lg p-2.5 flex flex-col gap-2">
      <input value={v} onChange={e => setV(e.target.value)} className="w-full text-[10px] border rounded" />
      <input value={u} onChange={e => setU(e.target.value)} className="w-full text-[10px] border rounded" />
      <button onClick={() => onSubmit(v, u)} className="py-1 bg-blue-600 text-white text-[9px] rounded">Salvar</button>
    </motion.div>
  );
}

export function LibraryPopover({ onSelect, onClose }: LibraryPopoverProps) {
  const { savedAudiences } = useStore();
  return (
    <div className="absolute top-full left-32 mt-2 w-64 bg-white rounded-2xl shadow-2xl border p-4 z-[100]">
      <h4 className="text-[10px] font-black uppercase mb-3">Biblioteca</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {savedAudiences.map((s) => (
          <div key={s.id} onClick={() => onSelect(s)} className="p-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-blue-50">{s.label}</div>
        ))}
      </div>
    </div>
  );
}

export function DestinationsPanel({ destinations, onAdd, onUpdate, onDelete, onReorder }: {
  destinations: ConversionDestination[];
  onAdd: () => void;
  onUpdate: (id: string, data: Partial<ConversionDestination>) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex-shrink-0 w-[240px] border-l border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
            <Link2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Destinos</span>
        </div>
        <button
          onClick={onAdd}
          className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-colors"
          title="Adicionar destino"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {destinations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
              <Link2 className="w-5 h-5 text-amber-200" />
            </div>
            <p className="text-[10px] text-slate-300 font-medium">Nenhum destino</p>
            <p className="text-[9px] text-slate-200 mt-1">Clique em + para adicionar</p>
          </div>
        )}

        {destinations.map(dest => {
          const isEditing = editingId === dest.id;
          return (
            <div key={dest.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${isEditing ? "border-amber-300 ring-2 ring-amber-500/10" : "border-slate-200"}`}>
              {/* Cabeçalho do card */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="flex flex-col gap-0.5 mr-1">
                  <button onClick={() => onReorder(dest.id, "up")} className="p-0.5 text-slate-300 hover:text-slate-900 transition-colors"><ChevronRight className="w-2.5 h-2.5 -rotate-90" /></button>
                  <button onClick={() => onReorder(dest.id, "down")} className="p-0.5 text-slate-300 hover:text-slate-900 transition-colors"><ChevronRight className="w-2.5 h-2.5 rotate-90" /></button>
                </div>
                {dest.type === "retargeting"
                  ? <RotateCcw className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  : <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                }
                <span className="flex-1 text-[11px] font-bold text-slate-800 truncate">{dest.label || "Sem título"}</span>
                {dest.parentId && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400" title="Possui vínculo" />
                )}
                <button
                  title={dest.type === "retargeting" ? "Retargeting — clique para mudar para conversão" : "Conversão — clique para mudar para retargeting"}
                  onClick={() => onUpdate(dest.id, { type: dest.type === "retargeting" ? "conversion" : "retargeting" })}
                  className={`p-1 rounded-lg transition-colors text-[8px] font-black tracking-wide px-1.5 ${dest.type === "retargeting" ? "bg-violet-100 text-violet-600 hover:bg-violet-200" : "bg-amber-50 text-amber-400 hover:bg-amber-100"}`}
                >
                  {dest.type === "retargeting" ? "RTG" : "CVR"}
                </button>
                <button
                  onClick={() => setEditingId(isEditing ? null : dest.id)}
                  className={`p-1 rounded-lg transition-colors ${isEditing ? "bg-amber-500 text-white" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                >
                  {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onDelete(dest.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Formulário de edição */}
              {isEditing && (
                <div className="px-3 pb-3 space-y-2 border-t border-amber-50 pt-2 bg-slate-50/30">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nome</label>
                    <input
                      value={dest.label}
                      onChange={e => onUpdate(dest.id, { label: e.target.value })}
                      className="w-full text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-300 mt-0.5"
                      placeholder="Ex: Página de obrigado"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">URL de destino</label>
                    <input
                      value={dest.url}
                      onChange={e => onUpdate(dest.id, { url: e.target.value })}
                      className="w-full text-[10px] font-mono text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-300 mt-0.5"
                      placeholder="https://site.com/obrigado"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Evento de conversão</label>
                    <input
                      value={dest.event || ""}
                      onChange={e => onUpdate(dest.id, { event: e.target.value })}
                      className="w-full text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-300 mt-0.5"
                      placeholder="Ex: Purchase, Lead"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vincular a (Pai)</label>
                    <select
                      value={dest.parentId || ""}
                      onChange={e => onUpdate(dest.id, { parentId: e.target.value === "" ? undefined : e.target.value })}
                      className="w-full text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-300 mt-0.5 appearance-none cursor-pointer"
                    >
                      <option value="">Nenhum vínculo</option>
                      {destinations
                        .filter(d => d.id !== dest.id && d.parentId !== dest.id)
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.label || "Sem título"}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Observação</label>
                    <textarea
                      value={dest.note || ""}
                      onChange={e => onUpdate(dest.id, { note: e.target.value })}
                      rows={2}
                      className="w-full text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-300 mt-0.5 resize-none"
                      placeholder="Observações sobre este destino"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
