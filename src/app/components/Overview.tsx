import { Link, useParams, useLocation } from "react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  Zap,
  Globe,
  BarChart2,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  Layers,
  MessageCircle,
  Share2,
  FileText,
  ShoppingBag,
  Phone,
} from "lucide-react";
import { Campaign, StageKey, ConversionDestination } from "../data/types";
import { useStore } from "../data/store";
import { MetaIcon, GoogleIcon } from "./BrandIcons";

const Tooltip = ({ text, children, position = "top" }: { text: string; children: React.ReactNode; position?: "top" | "bottom" | "left" | "right" }) => {
  const [show, setShow] = useState(false);
  
  const posClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900/95",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900/95",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900/95"
  };

  return (
    <div className="relative group/tt flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.98, 
              y: position === "top" ? 5 : position === "bottom" ? -5 : 0,
              x: position === "left" ? 5 : position === "right" ? -5 : 0 
            }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute ${posClasses[position]} px-2 py-1.5 bg-slate-900/90 text-slate-100 text-[10px] leading-snug rounded-md shadow-lg z-[100] w-36 md:w-40 text-center pointer-events-none border border-slate-700/50 backdrop-blur-md font-normal`}
          >
            {text}
            <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const channels = [
  {
    path: "/meta-ads",
    logo: (
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
        <MetaIcon className="w-6 h-6" color="white" />
      </div>
    ),
    name: "Meta Ads",
    platform: "Facebook & Instagram",
    description:
      "Segmentação por comportamento e interesses. Formatos visuais impactantes para cada etapa do funil",
    highlights: [
      "Públicos personalizados e Lookalike",
      "Feed, Stories, Reels e Carrossel",
      "Remarketing comportamental",
    ],
    accent: "blue",
  },
  {
    path: "/google-ads",
    logo: (
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden">
        <GoogleIcon className="w-6 h-6" />
      </div>
    ),
    name: "Google Ads",
    platform: "Search, Display & YouTube",
    description:
      "Captura de intenção ativa nas buscas e presença visual em toda a web. Estratégia multi-formato para dominar cada etapa da jornada do usuário.",
    highlights: [
      "Pesquisa por intenção de compra (palavras-chave)",
      "Display em sites parceiros",
      "Anúncios no YouTube",
    ],
    accent: "slate",
  },
];

// --- New Component: MediaFlowMap ---
function FlowLine({ color, delay = 0, duration = 3 }: { color: string; delay?: number; duration?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        initial={{ left: "-10%", opacity: 0 }}
        animate={{ 
          left: "110%", 
          opacity: [0, 1, 1, 0] 
        }}
        transition={{ 
          duration, 
          repeat: Infinity, 
          ease: "linear",
          delay 
        }}
        className={`absolute w-12 h-[1px] ${color} blur-[1px] z-10`}
      />
    </div>
  );
}

function DestIcon({ dest }: { dest: any }) {
  const label = (dest.label ?? "").toLowerCase();
  const url   = (dest.url   ?? "").toLowerCase();
  const event = (dest.event ?? "").toLowerCase();
  if (label.includes("whatsapp") || url.includes("whatsapp") || url.includes("wa.me"))
    return <MessageCircle className="w-4 h-4 text-emerald-600" />;
  if (label.includes("instagram") || url.includes("instagram"))
    return <Share2 className="w-4 h-4 text-pink-500" />;
  if (label.includes("formulário") || label.includes("form") || event.includes("lead"))
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (label.includes("loja") || label.includes("shop") || event.includes("venda") || event.includes("purchase"))
    return <ShoppingBag className="w-4 h-4 text-violet-500" />;
  if (label.includes("site") || label.includes("landing") || url.includes("http"))
    return <Globe className="w-4 h-4 text-sky-500" />;
  if (label.includes("ligação") || label.includes("telefone") || label.includes("call"))
    return <Phone className="w-4 h-4 text-amber-500" />;
  return <Target className="w-4 h-4 text-gray-500" />;
}

function MediaFlowMap({ campaign }: { campaign: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; color: string; key: string; retargeting?: boolean; weight?: number }[]>([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const metaOn   = campaign ? (["top","middle","bottom"] as const).some(st => (campaign.meta?.[st]?.length ?? 0) > 0) : true;
  const googleOn = campaign ? (["top","middle","bottom"] as const).some(st => (campaign.google?.[st]?.length ?? 0) > 0) : true;
  const metaCount   = campaign ? (["top","middle","bottom"] as const).reduce((a, st) => a + (campaign.meta?.[st]?.length ?? 0), 0) : 3;
  const googleCount = campaign ? (["top","middle","bottom"] as const).reduce((a, st) => a + (campaign.google?.[st]?.length ?? 0), 0) : 2;
  const maxCount = Math.max(metaCount, googleCount, 1);

  const sources = campaign ? [
    metaOn   && { name: "Meta Ads",   icon: MetaIcon,   bg: "bg-pink-50",    border: "border-pink-200",    hex: "#ec4899", weight: 1 + metaCount / maxCount },
    googleOn && { name: "Google Ads", icon: GoogleIcon, bg: "bg-blue-50",    border: "border-blue-200",    hex: "#3b82f6", weight: 1 + googleCount / maxCount },
  ].filter(Boolean) : [
    { name: "Meta Ads",   icon: MetaIcon,   bg: "bg-pink-50",    border: "border-pink-200",    hex: "#ec4899", weight: 2 },
    { name: "Google Ads", icon: GoogleIcon, bg: "bg-blue-50",    border: "border-blue-200",    hex: "#3b82f6", weight: 1.5 },
    { name: "Orgânico",   icon: Users,      bg: "bg-emerald-50", border: "border-emerald-200", hex: "#10b981", weight: 1 },
  ] as any[];

  const allAudiences: { name: string; channel: string; hex: string; showInFlow?: boolean }[] = [];
  if (campaign) {
    (["top", "middle", "bottom"] as const).forEach(st => {
      (campaign.meta?.[st]   || []).forEach((a: any) => allAudiences.push({ name: a.title, channel: "meta",   hex: "#ec4899", showInFlow: a.showInFlow }));
      (campaign.google?.[st] || []).forEach((a: any) => allAudiences.push({ name: a.title, channel: "google", hex: "#3b82f6", showInFlow: a.showInFlow }));
    });
  }
  const hasFlowFilter = allAudiences.some(a => a.showInFlow);
  const audiences = (hasFlowFilter ? allAudiences.filter(a => a.showInFlow) : allAudiences).slice(0, 6);

  const destinationsRaw: any[] = campaign?.destinations?.length
    ? campaign.destinations
    : [{ id: "default", label: "Conversão", event: "Venda ou Lead" }];

  const conversionDestinations = destinationsRaw.filter(d => d.type !== "retargeting");
  const hasRetargeting = destinationsRaw.some(d => d.type === "retargeting");

  const calcPaths = useCallback(() => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const getEl = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - rect.left, cy: r.top + r.height / 2 - rect.top, right: r.right - rect.left, left: r.left - rect.left, top: r.top - rect.top, bottom: r.bottom - rect.top };
    };

    const hub = getEl("flow-hub");
    const newPaths: { d: string; color: string; key: string; retargeting?: boolean; weight?: number }[] = [];

    if (!hub) { setPaths(newPaths); return; }

    const rtgNode = getEl("flow-retargeting-node");

    // Canal → hub
    sources.forEach((src: any, si: number) => {
      const s = getEl(`flow-src-${si}`);
      if (!s) return;

      if (isMobile) {
        // Orthogonal (stepped) with rounded corners
        const r = 12; // radius
        const midY = s.bottom + 24; 
        const sign = s.cx < hub.cx ? 1 : -1;
        
        const d = `M${s.cx},${s.bottom} 
                   L${s.cx},${midY - r} 
                   Q${s.cx},${midY} ${s.cx + (sign * r)},${midY} 
                   L${hub.cx - (sign * r)},${midY} 
                   Q${hub.cx},${midY} ${hub.cx},${midY + r} 
                   L${hub.cx},${hub.top}`;
        
        newPaths.push({ key: `src${si}-hub`, color: src.hex, d });
      } else {
        const mx = s.right + (hub.left - s.right) / 2;
        newPaths.push({
          key: `src${si}-hub`,
          color: src.hex,
          d: `M${s.right},${s.cy} C${mx},${s.cy} ${mx},${hub.cy} ${hub.left},${hub.cy}`,
        });
      }
    });

    // Hub → cada destino
    conversionDestinations.forEach((dest: any, di: number) => {
      const e = getEl(`flow-dest-icon-${di}`);
      if (!e) return;
      
      if (isMobile) {
        // Orthogonal (stepped) with rounded corners
        const r = 12; // radius
        const midY = hub.bottom + 20;
        const sign = hub.cx < e.cx ? 1 : -1;

        const d = `M${hub.cx},${hub.bottom} 
                   L${hub.cx},${midY - r} 
                   Q${hub.cx},${midY} ${hub.cx + (sign * r)},${midY} 
                   L${e.cx - (sign * r)},${midY} 
                   Q${e.cx},${midY} ${e.cx},${midY + r} 
                   L${e.cx},${e.top}`;
        
        newPaths.push({ key: `hub-dest${di}`, color: "#10b981", d });
      } else {
        const mx = hub.right + (e.left - hub.right) / 2;
        newPaths.push({
          key: `hub-dest${di}`,
          color: "#10b981", // Verde de conversão
          d: `M${hub.right},${hub.cy} C${mx},${hub.cy} ${mx},${e.cy} ${e.left},${e.cy}`,
        });
      }

      // NOVO: Conexão Hierárquica entre Destinos (apenas entre conversion)
      // Ocultado no mobile para evitar sobreposição já que estão lado a lado
      if (dest.parentId && !isMobile) {
        const parentIndex = conversionDestinations.findIndex(d => d.id === dest.parentId);
        if (parentIndex !== -1) {
          const p = getEl(`flow-dest-icon-${parentIndex}`);
          if (p && e && Math.abs(e.top - p.bottom) > 10) {
            // Conexão vertical centrada no ícone
            const midY = p.bottom + (e.top - p.bottom) / 2;
            (newPaths as any).push({
              key: `dest-link-${dest.id}`,
              color: "#1e293b",
              weight: 0.8,
              isLink: true,
              d: `M${p.cx},${p.bottom} C${p.cx},${midY} ${e.cx},${midY} ${e.cx},${e.top}`
            });
          }
        }
      }
    });

    // Retargeting Loop: Hub <-> Node -> Canais
    if (hasRetargeting && rtgNode) {
      const radius = 16;
      
      if (isMobile) {
        // Hub para Retargeting (Horizontal no mobile)
        newPaths.push({
          key: `hub-rtg`,
          color: "#7c3aed",
          d: `M${hub.left},${hub.cy} L${rtgNode.right},${rtgNode.cy}`,
          weight: 1.2
        });

        // Retargeting -> Canais (Sobe pela esquerda e entra por cima)
        sources.forEach((src: any, si: number) => {
          const s = getEl(`flow-src-${si}`);
          if (!s) return;
          const cornerR = 12;
          // Usa um recuo fixo de -12px em relação ao contêiner para não sangrar pela tela
          const leftEdge = -12; 
          // O arco superior agora usa o espaço seguro de pt-10
          const archY = s.top - 24; 
          const d = `M${rtgNode.left},${rtgNode.cy} 
                     L${leftEdge + cornerR},${rtgNode.cy} 
                     Q${leftEdge},${rtgNode.cy} ${leftEdge},${rtgNode.cy - cornerR} 
                     L${leftEdge},${archY + cornerR} 
                     Q${leftEdge},${archY} ${leftEdge + cornerR},${archY}
                     L${s.cx - cornerR},${archY}
                     Q${s.cx},${archY} ${s.cx},${archY + cornerR}
                     L${s.cx},${s.top}`;
          newPaths.push({ key: `rtg-src-${si}`, color: "#fbbf24", retargeting: true, d });
        });
      } else {
        // Desktop: Hub -> RtgNode (Vertical)
        newPaths.push({
          key: `hub-rtg`,
          color: "#7c3aed",
          d: `M${hub.cx},${hub.bottom} L${rtgNode.cx},${rtgNode.top}`,
        });

        sources.forEach((src: any, si: number) => {
          const s = getEl(`flow-src-${si}`);
          if (!s) return;
          const midX = s.right + (rtgNode.left - s.right) / 2;
          const dropY = Math.max(rtgNode.bottom, s.bottom) + 40;
          const d = `M${rtgNode.cx},${rtgNode.bottom} 
                     L${rtgNode.cx},${dropY - radius} 
                     Q${rtgNode.cx},${dropY} ${rtgNode.cx - radius},${dropY} 
                     L${s.cx + radius},${dropY} 
                     Q${s.cx},${dropY} ${s.cx},${dropY - radius} 
                     L${s.cx},${s.bottom}`;
          newPaths.push({ key: `rtg-src-${si}`, color: "#fbbf24", retargeting: true, d });
        });
      }
    }

    setPaths(newPaths);
  }, [sources, audiences, conversionDestinations, hasRetargeting]);

  useEffect(() => {
    const t = setTimeout(calcPaths, 80);
    window.addEventListener("resize", calcPaths);
    return () => { clearTimeout(t); window.removeEventListener("resize", calcPaths); };
  }, [calcPaths]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8 relative overflow-hidden shadow-sm"
    >
      <div className="flex items-start justify-between mb-4 md:mb-8 gap-2 relative z-20">
        <div>
          <h3 className="text-gray-900 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "clamp(0.95rem, 3vw, 1.1rem)" }}>
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-500 flex-shrink-0" />
            Mapa de Fluxo de Mídia
          </h3>
          <p className="text-xs md:text-sm text-gray-400">Visualização da jornada do tráfego e ecossistema de conversão</p>
        </div>
        <span className="flex-shrink-0 flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-200 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">{campaign ? "Dados da Campanha" : "Fluxo Padrão"}</span>
        </span>
      </div>

      {/* Layout Principal (Desktop: Row, Mobile: Col) */}
      <div
        ref={containerRef}
        className={`relative flex flex-col md:flex-row items-center justify-between gap-16 md:gap-10 ${isMobile ? 'pt-10' : ''}`}
        style={isMobile
          ? { paddingBottom: "16px" }
          : { minHeight: hasRetargeting ? "320px" : "220px", paddingBottom: hasRetargeting ? "120px" : "64px" }
        }
      >
        {/* SVG de conexões */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <style>{`
              @keyframes dashflow {
                from { stroke-dashoffset: 0.18; }
                to   { stroke-dashoffset: 0; }
              }
              @keyframes dashflow-rtg {
                from { stroke-dashoffset: 0.18; }
                to   { stroke-dashoffset: 0; }
              }
            `}</style>
            <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" opacity="0.6" />
            </marker>
            <marker id="arrowRtg" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#facc15" opacity="0.8" />
            </marker>
            <marker id="arrowDest" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L5,2.5 z" fill="#10b981" />
            </marker>
            <marker id="arrowLink" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L5,2.5 z" fill="#1e293b" />
            </marker>
          </defs>
          {paths.map((p, i) => {
            const isRtg = (p as any).retargeting;
            const delay = (i * 0.5) % 3;
            const sw = p.weight ?? 1.5;
            if (isRtg) {
              return (
                <g key={p.key}>
                  <path d={p.d} fill="none" stroke="#fef9c3" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 2" />
                  <path
                    d={p.d} fill="none" stroke="#facc15"
                    strokeWidth={2} strokeLinecap="round"
                    pathLength="1" strokeDasharray="0.02 0.04" opacity={0.8}
                    markerEnd="url(#arrowRtg)"
                    style={{ animation: `dashflow-rtg 3s linear infinite`, animationDelay: `${delay}s` }}
                  />
                </g>
              );
            }
            const isLink = (p as any).isLink;
            const markerId = isRtg ? "url(#arrowRtg)" : isLink ? "url(#arrowLink)" : (p.color === "#10b981" ? "url(#arrowDest)" : "url(#arrowHead)");
            return (
              <g key={p.key}>
                <path d={p.d} fill="none" stroke={isLink ? "#f1f5f9" : "#e2e8f0"} strokeWidth={sw * 0.8} strokeLinecap="round" />
                <path
                  d={p.d} fill="none" stroke={p.color}
                  strokeWidth={sw} strokeLinecap="round"
                  pathLength="1" strokeDasharray="0.06 0.12" opacity={0.9}
                  markerEnd={markerId}
                  style={{ animation: `dashflow 2s linear infinite`, animationDelay: `${delay}s` }}
                />
              </g>
            );
          })}
        </svg>

        {/* CANAIS */}
        <div className="flex flex-row md:flex-col gap-5 z-10 shrink-0 self-center">
          {sources.map((src: any, i: number) => (
            <Tooltip key={src.name} position="bottom" text={`${src.name}: Canal de aquisição responsável por atrair novos usuários para o funil.`}>
              <div
                id={`flow-src-${i}`}
                className={`${src.bg} ${src.border} border rounded-xl px-3 md:px-5 py-2.5 md:py-3.5 flex items-center gap-2 md:gap-4 w-[136px] sm:w-[160px] md:w-48 shadow-sm cursor-help transition-all hover:border-slate-300`}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <src.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-base font-semibold text-gray-700 truncate">{src.name}</span>
              </div>
            </Tooltip>
          ))}
        </div>

        {/* CENTRO: HUB DE PÚBLICOS E RETARGETING */}
        <div className={`relative flex ${isMobile ? 'flex-row' : 'flex-col'} items-center justify-center gap-6 md:gap-0 z-10 shrink-0 self-center`}>
          {/* Nó de Retargeting — apenas no mobile nesta posição lateral */}
          {hasRetargeting && isMobile && (
            <Tooltip position="bottom" text="Retargeting: Estratégia de re-impacto para converter usuários que não concluíram a ação desejada.">
              <motion.div
                id="flow-retargeting-node"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-1 group cursor-help z-10 shrink-0"
              >
                <div className="w-10 h-10 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center shadow-sm group-hover:border-violet-400 transition-colors">
                  <RefreshCw className="w-5 h-5 text-violet-500 animate-[spin_4s_linear_infinite]" />
                </div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-tighter">Retargeting</span>
              </motion.div>
            </Tooltip>
          )}

          {/* Hub de Públicos (com RTG absoluto para Desktop) */}
          <div className="relative flex flex-col items-center">
            <Tooltip position="top" text="Segmentação: Agrupamento de públicos estratégicos impactados pelos anúncios.">
              <div
                id="flow-hub"
                className="border border-dashed border-gray-300 rounded-xl p-2 flex flex-col gap-1.5 bg-gray-50/50 cursor-help transition-all hover:border-slate-300"
              >
              {audiences.length > 0 ? audiences.map((aud: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-gray-200 bg-white shadow-sm w-[156px] sm:w-[180px] md:w-[212px]"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: aud.hex }} />
                  <span className="text-[12px] md:text-[13px] font-medium text-gray-600 truncate">{aud.name}</span>
                </div>
              )) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 text-gray-300 w-[140px] md:w-44">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px] md:text-[11px]">Sem públicos</span>
                </div>
              )}
              </div>
            </Tooltip>

            {/* Nó de Retargeting — apenas no desktop nesta posição absoluta */}
            {hasRetargeting && !isMobile && (
              <Tooltip position="bottom" text="Retargeting: Estratégia de re-impacto para converter usuários que não concluíram a ação desejada.">
                <motion.div
                  id="flow-retargeting-node"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-full mt-8 flex flex-col items-center gap-1 group cursor-help left-1/2 -translate-x-1/2"
                >
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center shadow-sm group-hover:border-violet-400 transition-colors">
                    <RefreshCw className="w-5 h-5 text-violet-500 animate-[spin_4s_linear_infinite]" />
                  </div>
                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-tighter">Retargeting</span>
                </motion.div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* DESTINOS (Apenas conversão) */}
        <div className={`flex ${isMobile ? 'flex-row flex-wrap justify-center max-w-sm px-4' : 'flex-col items-start'} gap-6 md:gap-8 z-10 shrink-0 self-center md:self-auto`}>
          {conversionDestinations.map((dest: any, i: number) => {
            return (
              <Tooltip key={dest.id} position={isMobile ? "top" : "left"} text={`${dest.label}: Ponto de conversão final onde capturamos leads ou vendas.`}>
                <div
                  className="flex items-center gap-2.5 cursor-help group/d"
                >
                  <div
                    id={`flow-dest-icon-${i}`}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-white border-2 border-gray-200 transition-all group-hover/d:border-slate-300"
                  >
                    <DestIcon dest={dest} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] md:text-[14px] font-semibold text-gray-800 leading-tight truncate">{dest.label}</p>
                    {dest.event && <p className="text-[10px] md:text-[11px] text-gray-400 truncate">{dest.event}</p>}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>

        <div className="absolute inset-0 -z-10 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>
    </motion.div>
  );
}

export function Overview() {
  const { campaignId } = useParams();
  const location = useLocation();
  const { getActiveCampaign, getCampaign } = useStore();
  
  const campaign = campaignId ? getCampaign(campaignId) : getActiveCampaign();

  // Helper to resolve links relative to campaign/share context
  const isShare = location.pathname.includes("/share/");
  const pathPrefix = isShare 
    ? `/share/${campaignId || ""}` 
    : campaignId ? `/${campaignId}` : "";

  // Dynamic objectives — fall back to static defaults if no campaign
  const obj = campaign?.objectives;
  const objectives = [
    {
      icon: TrendingUp,
      label: "ROAS Alvo",
      value: obj?.roas,
      sub: "Retorno sobre o investimento",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      icon: Users,
      label: "Leads Qualificados",
      value: obj?.leads,
      sub: "Por mês, funil completo",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    },
    {
      icon: Target,
      label: "Alcance Mensal",
      value: obj?.reach,
      sub: "Impressões qualificadas",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      icon: Zap,
      label: "Redução de CAC",
      value: obj?.cac,
      sub: "Custo de aquisição de cliente",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  ];

  const activeObjectives = objectives.filter((obj) => obj.value);

  // Dynamic funnel stages
  const f = campaign?.funnel;
  const funnelStages = [
    {
      step: "01",
      label: "Topo de Funil",
      subtitle: f?.top.subtitle ?? "Conscientização",
      description: f?.top.description ?? "Alcançar novos públicos com mensagens de descoberta e construção de marca. Campanhas de awareness em larga escala.",
      channels: f?.top.channels ?? ["Meta Ads · Feed & Reels", "Google Ads · Display & YouTube"],
      metric: f?.top.metricValue ? `${f.top.metricValue} ${f.top.metricUnit}` : "500K impressões/mês",
      color: "bg-blue-600",
      lightBg: "bg-blue-50",
      border: "border-blue-200",
      textColor: "text-blue-700",
      badgeColor: "bg-blue-100 text-blue-700",
      width: "w-full",
    },
    {
      step: "02",
      label: "Meio de Funil",
      subtitle: f?.middle.subtitle ?? "Consideração",
      description: f?.middle.description ?? "Nutrir o interesse de quem já interagiu com a marca. Estratégias de remarketing e conteúdos educativos.",
      channels: f?.middle.channels ?? ["Meta Ads · Carousel & Video", "Google Ads · Search & RLSA"],
      metric: f?.middle.metricValue ? `${f.middle.metricValue} ${f.middle.metricUnit}` : "15K visitantes/mês",
      color: "bg-violet-600",
      lightBg: "bg-violet-50",
      border: "border-violet-200",
      textColor: "text-violet-700",
      badgeColor: "bg-violet-100 text-violet-700",
      width: "w-4/5",
    },
    {
      step: "03",
      label: "Fundo de Funil",
      subtitle: f?.bottom.subtitle ?? "Conversão",
      description: f?.bottom.description ?? "Converter leads qualificados com ofertas direcionadas e provas sociais. Foco em público quente.",
      channels: f?.bottom.channels ?? ["Meta Ads · Stories & Oferta", "Google Ads · Branded & Retargeting"],
      metric: f?.bottom.metricValue ? `${f.bottom.metricValue} ${f.bottom.metricUnit}` : "200 conversões/mês",
      color: "bg-emerald-600",
      lightBg: "bg-emerald-50",
      border: "border-emerald-200",
      textColor: "text-emerald-700",
      badgeColor: "bg-emerald-100 text-emerald-700",
      width: "w-3/5",
    },
  ];

  // Dynamic budget
  const metaPct = campaign?.budgetAllocation.metaPercent ?? 65;
  const googlePct = campaign?.budgetAllocation.googlePercent ?? 35;
  const totalBudget = campaign?.budget ?? 15000;
  const p = campaign?.presentation || {};
  const metaAmount = (totalBudget * metaPct) / 100;
  const googleAmount = (totalBudget * googlePct) / 100;
  const circumference = 251.2;

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "Q1–Q2 · 2025";
    try {
      // Ajuste para evitar problemas de fuso horário em strings YYYY-MM-DD
      const s = new Date(start + "T12:00:00");
      const e = new Date(end + "T12:00:00");
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const sStr = `${months[s.getMonth()]}/${s.getFullYear().toString().slice(-2)}`;
      const eStr = `${months[e.getMonth()]}/${e.getFullYear().toString().slice(-2)}`;
      return `${sStr} – ${eStr}`;
    } catch {
      return "Q1–Q2 · 2025";
    }
  };

  const autoPeriod = formatDateRange(campaign?.startDate, campaign?.endDate);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 py-10 md:py-12 relative overflow-hidden">
          {/* decorative grid */}
          <motion.div
            className="absolute inset-0 opacity-[0.04]"
            animate={{ 
              backgroundPosition: ["0px 0px", "-40px 0px"] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-300 bg-blue-500/20 border border-blue-400/20 px-3 py-1.5 rounded-full">
                {p.badge || "Proposta Estratégica · 2025"}
              </span>
            </div>
            <h1 className="text-white mb-4 whitespace-pre-line" style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}>
              {p.title || `Estratégia Integrada\nde Mídia Paga`}
            </h1>
            <p className="text-slate-300 max-w-2xl leading-relaxed mb-8" style={{ fontSize: "clamp(0.875rem, 2vw, 1rem)" }}>
              {p.description || "Uma abordagem full-funnel, orientada a dados e integrada entre Google Ads e Meta Ads, projetada para maximizar alcance, geração de leads qualificados e retorno sobre o investimento em cada etapa da jornada do cliente."}
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Canais", value: p.channelsLabel || "Google Ads + Meta Ads" },
                { label: "Período", value: p.periodLabel || autoPeriod },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-white text-sm" style={{ fontWeight: 500 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats bar - Flexible layout */}
        <div className="flex flex-wrap md:flex-nowrap border-t border-gray-200">
          {activeObjectives.map((obj, i) => {
            const Icon = obj.icon;
            return (
              <motion.div
                key={obj.label}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`flex-1 min-w-[50%] md:min-w-0 px-4 md:px-6 py-4 md:py-5 flex items-center gap-3 border-gray-200 
                  ${i !== activeObjectives.length - 1 ? 'md:border-r' : ''} 
                  ${i % 2 === 0 ? 'border-r md:border-r-0' : ''}
                  ${i < activeObjectives.length - (activeObjectives.length % 2 === 0 ? 2 : 1) ? 'border-b md:border-b-0' : 'md:border-b-0'}
                `}
              >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${obj.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${obj.color}`} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-400 leading-none mb-1">{obj.label}</p>
                  <p className={`leading-none ${obj.color}`} style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.1rem)" }}>{obj.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Budget Allocation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row shadow-sm">
          <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md" style={{ fontWeight: 600 }}>Alocação de Verba</span>
            </div>
            <h2 className="text-2xl text-gray-900 mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Distribuição do Orçamento</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              A verba foi alocada estrategicamente para equilibrar a descoberta de novos usuários (Meta Ads) com a captura de alta intenção e remarketing direto (Google Ads).
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm bg-blue-600 shadow-sm shadow-blue-200" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Meta Ads (Facebook & Instagram)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-900 block leading-tight" style={{ fontWeight: 600 }}>{metaPct}%</span>
                  <span className="text-[11px] text-blue-600/80 font-bold block leading-none">R$ {metaAmount.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-2 border border-gray-100 overflow-hidden">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${metaPct}%` }}
                  viewport={{ once: false, margin: "-40px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-200" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Google Ads (Search & YouTube)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-900 block leading-tight" style={{ fontWeight: 600 }}>{googlePct}%</span>
                  <span className="text-[11px] text-emerald-600/80 font-bold block leading-none">R$ {googleAmount.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-2 border border-gray-100 overflow-hidden">
                <motion.div
                  className="bg-emerald-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${googlePct}%` }}
                  viewport={{ once: false, margin: "-40px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 md:w-1/2 p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200 flex items-center justify-center relative">
            <div className="absolute top-4 right-4 bg-white border border-gray-200 shadow-sm rounded-lg p-2.5 md:p-3 text-center">
               <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1" style={{ fontWeight: 600 }}>Investimento Mensal</p>
               <p className="text-base md:text-lg text-gray-900" style={{ fontWeight: 700 }}>R$ {totalBudget.toLocaleString("pt-BR")}</p>
            </div>
            
            {/* Visual Donut Chart Representation using pure CSS */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 mt-8 md:mt-4">
              {/* Outer ring */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background generic circle */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                
                {/* Meta Ads */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="16"
                  strokeDasharray={`${circumference * metaPct / 100} ${circumference}`}
                  strokeDashoffset={0}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Google Ads */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray={`${circumference * googlePct / 100} ${circumference}`}
                  strokeDashoffset={-(circumference * metaPct / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>100%</span>
                <span className="text-xs text-gray-400">Verba Total</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Geolocation */}
      {campaign?.geo?.coverage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🌐</span>
            <h2 className="text-gray-900 text-base" style={{ fontWeight: 600 }}>
              Geolocalização das campanhas
            </h2>
          </div>
          <div className={`grid gap-6 md:gap-8 ${campaign.geo.expansion ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1">
                Raio de Cobertura
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{campaign.geo.coverage}</p>
            </div>
            {campaign.geo.expansion && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1">
                  Futura Expansão
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{campaign.geo.expansion}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Funnel Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 600 }}>Metodologia de Funil</h2>
            <p className="text-sm text-gray-400">Jornada do usuário em 3 etapas integradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {funnelStages.map((stage, i) => (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden hover:shadow-sm hover:border-gray-200 transition-all group"
            >
              {/* Top accent */}
              <div className={`h-1.5 w-full flex-shrink-0 ${stage.color} opacity-80 group-hover:opacity-100 transition-opacity`} />

              <div className="flex-1 p-6 flex flex-col relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs ${stage.textColor} bg-opacity-80 ${stage.lightBg} border ${stage.border} px-2 py-1 rounded-md`} style={{ fontWeight: 600 }}>
                    {stage.step}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${stage.badgeColor}`} style={{ fontWeight: 500, letterSpacing: '0.02em' }}>
                    {stage.subtitle.toUpperCase()}
                  </span>
                </div>

                <div className="mb-2">
                  <h3 className="text-gray-900 text-xl" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{stage.label}</h3>
                </div>

                <div className="text-sm text-gray-500 leading-relaxed mb-6 flex-1 space-y-2">
                  {stage.description.split("\n").filter(line => line.trim()).map((line, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.color} mt-1.5`} />
                      <p>{line.trim()}</p>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* Connector arrow */}
        <div className="flex justify-center mt-2 mb-2">
          <ChevronDown className="w-5 h-5 text-gray-300" />
        </div>
        <div className="flex justify-center">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-full flex items-center gap-2" style={{ fontWeight: 500 }}>
            <CheckCircle2 className="w-4 h-4" />
            Conversão & Resultado
          </div>
        </div>
      </motion.div>

<MediaFlowMap campaign={campaign} />

      {/* Channels */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Globe className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 600 }}>Canais Integrados</h2>
            <p className="text-sm text-gray-400">Explore a estratégia detalhada por plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((ch, i) => (
            <motion.div
              key={ch.path}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col hover:shadow-sm hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                {ch.logo}
                <div>
                  <p className="text-gray-900 leading-tight" style={{ fontWeight: 600 }}>{ch.name}</p>
                  <p className="text-xs text-gray-400">{ch.platform}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed mb-5">{ch.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {ch.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{h}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={pathPrefix + ch.path}
                className={`
                  flex items-center justify-between w-full px-5 py-3 rounded-xl transition-all group shadow-sm hover:shadow-lg border-2
                  ${ch.accent === 'blue' 
                    ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white" 
                    : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white"
                  }
                `}
              >
                <span className="text-sm" style={{ fontWeight: 700 }}>Ver estratégia completa</span>
                <ArrowRight className={`w-4 h-4 transition-all group-hover:translate-x-1 ${ch.accent === 'blue' ? "text-blue-400 group-hover:text-white" : "text-emerald-400 group-hover:text-white"}`} />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Timeline Section — removed */}
      {false && <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-500"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 600 }}>Cronograma de Execução</h2>
            <p className="text-sm text-gray-400">Previsão em 4 meses (Sprints e Otimização)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-8 shadow-sm overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header: Months */}
            <div className="flex border-b border-gray-100 pb-2 mb-4">
              <div className="w-1/4"></div> {/* Label Column Spacer */}
              <div className="w-3/4 flex divide-x divide-gray-100/50">
                {["Mês 1 (Setup & Teste)", "Mês 2 (Escala Escrita)", "Mês 3 (Otimização do CAC)", "Mês 4 (Maturidade & ROAS)"].map((m) => (
                  <div key={m} className="flex-1 text-center text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-2">
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* Timelines */}
            <div className="space-y-6">
              {/* Campaign Group 1 */}
              <div>
                <div className="flex items-center">
                  <div className="w-1/4 pr-4">
                    <p className="text-sm text-gray-900 font-medium">Conscientização (Topo)</p>
                    <p className="text-xs text-gray-400">Volume & Teste de Criativos</p>
                  </div>
                  <div className="w-3/4 flex relative h-8 rounded-md bg-gray-50 overflow-hidden">
                    <div className="absolute left-0 w-full h-full bg-blue-500/20 rounded-md border border-blue-200">
                      <div className="h-full bg-blue-500/80 rounded-l-md w-full border-r border-blue-400 glow-blue text-[10px] text-white flex items-center px-3 font-medium">
                        Sempre Ativo (Always On)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Group 2 */}
              <div>
                <div className="flex items-center">
                  <div className="w-1/4 pr-4">
                    <p className="text-sm text-gray-900 font-medium">Remarketing de Meio</p>
                    <p className="text-xs text-gray-400">Retenção e Nutrição</p>
                  </div>
                  <div className="w-3/4 flex relative h-8 rounded-md bg-gray-50">
                    <div className="absolute left-[8%] w-[92%] h-full bg-violet-500/80 rounded-md border border-violet-400 text-[10px] text-white flex items-center px-3 font-medium">
                      Ativação pós-formação de público
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Group 3 */}
              <div>
                <div className="flex items-center">
                  <div className="w-1/4 pr-4">
                    <p className="text-sm text-gray-900 font-medium">Conversão Direta (Fundo)</p>
                    <p className="text-xs text-gray-400">Foco em ROAS e Oferta</p>
                  </div>
                  <div className="w-3/4 flex relative h-8 rounded-md bg-gray-50">
                    <div className="absolute left-[25%] w-[75%] h-full bg-emerald-500/80 rounded-md border border-emerald-400 text-[10px] text-white flex items-center px-3 font-medium">
                      Escala agressiva em base quente
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Special Events / Sprints */}
              <div className="pt-2">
                <div className="flex items-center">
                  <div className="w-1/4 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-sm text-gray-900 font-medium">Sprints & Aumentos</p>
                    </div>
                  </div>
                  <div className="w-3/4 flex relative h-4">
                    <div className="absolute left-[15%] w-[5%] h-full border-x-2 border-amber-400 bg-amber-100 flex justify-center -top-1">
                       <span className="absolute -top-6 text-[9px] font-bold text-amber-600 whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Ajuste Bid</span>
                    </div>
                    <div className="absolute left-[55%] w-[10%] h-full border-x-2 border-amber-400 bg-amber-100 flex justify-center -top-1">
                       <span className="absolute -top-6 text-[9px] font-bold text-amber-600 whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Promoção</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500/80" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">Testes & Aprendizado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-violet-500/80" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">Retenção</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] text-gray-500 font-medium uppercase">Escala (ROI+)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>}

    </div>
  );
}
