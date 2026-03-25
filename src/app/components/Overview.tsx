import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { useRef, useEffect, useState, useCallback } from "react";
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
  Share2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useStore } from "../data/store";

const channels = [
  {
    path: "/meta-ads",
    logo: (
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
        <span className="text-white text-lg" style={{ fontWeight: 700 }}>f</span>
      </div>
    ),
    name: "Meta Ads",
    platform: "Facebook & Instagram",
    description:
      "Segmentação avançada por comportamento e interesses. Formatos visuais impactantes para cada etapa do funil, desde awareness até conversão.",
    highlights: [
      "Públicos personalizados e Lookalike",
      "Feed, Stories, Reels e Carrossel",
      "Remarketing comportamental",
      "Otimização por conversão (CAPI)",
    ],
    accent: "blue",
  },
  {
    path: "/google-ads",
    logo: (
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
        <span className="text-lg" style={{ fontWeight: 700 }}>
          <span className="text-blue-500">G</span>
        </span>
      </div>
    ),
    name: "Google Ads",
    platform: "Search, Display & YouTube",
    description:
      "Captura de intenção ativa nas buscas e presença visual em toda a web. Estratégia multi-formato para dominar cada etapa da jornada do usuário.",
    highlights: [
      "Search ads por intenção de compra",
      "Display em sites parceiros",
      "YouTube In-Stream & Bumper",
      "Remarketing dinâmico (RLSA)",
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

function MediaFlowMap({ campaign }: { campaign: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; color: string; key: string }[]>([]);

  const metaOn   = campaign?.budgetAllocation?.metaEnabled   !== false;
  const googleOn = campaign?.budgetAllocation?.googleEnabled !== false;

  const sources = campaign ? [
    metaOn   && { name: "Meta Ads",   icon: Share2, color: "text-pink-500",    bg: "bg-pink-50",    border: "border-pink-200",    hex: "#ec4899" },
    googleOn && { name: "Google Ads", icon: Globe,  color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    hex: "#3b82f6" },
  ].filter(Boolean) : [
    { name: "Meta Ads",   icon: Share2, color: "text-pink-500",    bg: "bg-pink-50",    border: "border-pink-200",    hex: "#ec4899" },
    { name: "Google Ads", icon: Globe,  color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    hex: "#3b82f6" },
    { name: "Orgânico",   icon: Users,  color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", hex: "#10b981" },
  ] as any[];

  const allAudiences: { name: string; channel: string; hex: string }[] = [];
  if (campaign) {
    (["top", "middle", "bottom"] as const).forEach(st => {
      (campaign.meta?.[st]   || []).forEach((a: any) => allAudiences.push({ name: a.title, channel: "meta",   hex: "#ec4899" }));
      (campaign.google?.[st] || []).forEach((a: any) => allAudiences.push({ name: a.title, channel: "google", hex: "#3b82f6" }));
    });
  }
  const audiences = allAudiences.slice(0, 6);

  const destinations: any[] = campaign?.destinations?.length
    ? campaign.destinations
    : [{ id: "default", label: "Conversão", event: "Venda ou Lead" }];

  const calcPaths = useCallback(() => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const get = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - rect.left, cy: r.top + r.height / 2 - rect.top, right: r.right - rect.left, left: r.left - rect.left };
    };

    const newPaths: typeof paths = [];

    // Cada canal → cada público
    sources.forEach((src: any, si: number) => {
      const s = get(`flow-src-${si}`);
      audiences.forEach((aud: any, ai: number) => {
        const e = get(`flow-aud-${ai}`);
        if (!s || !e) return;
        // Only connect each source to audiences of its own channel (or all if no channel)
        if (aud.channel && src.name === "Meta Ads" && aud.channel !== "meta") return;
        if (aud.channel && src.name === "Google Ads" && aud.channel !== "google") return;
        const mx = s.right + (e.left - s.right) / 2;
        newPaths.push({
          key: `src${si}-aud${ai}`,
          color: src.hex,
          d: `M${s.right},${s.cy} C${mx},${s.cy} ${mx},${e.cy} ${e.left},${e.cy}`,
        });
      });
    });

    // Cada público → cada destino
    audiences.forEach((aud: any, ai: number) => {
      const s = get(`flow-aud-${ai}`);
      destinations.forEach((_: any, di: number) => {
        const e = get(`flow-dest-${di}`);
        if (!s || !e) return;
        const mx = s.right + (e.left - s.right) / 2;
        newPaths.push({
          key: `aud${ai}-dest${di}`,
          color: aud.hex ?? "#10b981",
          d: `M${s.right},${s.cy} C${mx},${s.cy} ${mx},${e.cy} ${e.left},${e.cy}`,
        });
      });
    });

    setPaths(newPaths);
  }, [sources, audiences, destinations]);

  useEffect(() => {
    const t = setTimeout(calcPaths, 80);
    window.addEventListener("resize", calcPaths);
    return () => { clearTimeout(t); window.removeEventListener("resize", calcPaths); };
  }, [calcPaths]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="bg-white rounded-2xl border border-gray-200 p-8 relative overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between mb-8 relative z-20">
        <div>
          <h3 className="text-gray-900 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            Mapa de Fluxo de Mídia
          </h3>
          <p className="text-sm text-gray-400">Visualização da jornada do tráfego e ecossistema de conversão</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-200 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {campaign ? "Dados da Campanha" : "Fluxo Padrão"}
        </span>
      </div>

      {/* Layout */}
      <div ref={containerRef} className="relative hidden md:flex items-center justify-between gap-4 pb-4 min-h-[160px]">

        {/* SVG de conexões */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <defs>
            <filter id="glow-soft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {paths.map((p, i) => {
            const staggerDelay = (i * 0.22) % 2.8;
            return (
              <g key={p.key}>
                {/* Track line */}
                <path d={p.d} fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
                {/* Tail — long, faint */}
                <motion.path
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="0.28 1"
                  initial={{ strokeDashoffset: 1.28 }}
                  animate={{ strokeDashoffset: -0.72 }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: staggerDelay,
                    repeatDelay: 0.4,
                  }}
                  opacity={0.3}
                />
                {/* Head — short, bright, glowing */}
                <motion.path
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="0.08 1"
                  initial={{ strokeDashoffset: 1.08 }}
                  animate={{ strokeDashoffset: -0.92 }}
                  filter="url(#glow-soft)"
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: staggerDelay,
                    repeatDelay: 0.4,
                  }}
                  opacity={0.95}
                />
              </g>
            );
          })}
        </svg>

        {/* CANAIS */}
        <div className="flex flex-col gap-3 z-10 shrink-0">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Canais</p>
          {sources.map((src: any, i: number) => (
            <motion.div
              id={`flow-src-${i}`}
              key={src.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`${src.bg} ${src.border} border rounded-xl px-4 py-3 flex items-center gap-3 w-40 shadow-sm`}
            >
              <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm ${src.color}`}>
                <src.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{src.name}</span>
            </motion.div>
          ))}
        </div>

        {/* PÚBLICOS */}
        <div className="flex flex-col gap-2 z-10 shrink-0">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Públicos</p>
          {audiences.length > 0 ? audiences.map((aud: any, i: number) => (
            <motion.div
              id={`flow-aud-${i}`}
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm w-44 ${
                aud.channel === "meta" ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${aud.channel === "meta" ? "bg-blue-400" : "bg-emerald-400"}`} />
              <span className="text-[11px] font-semibold text-gray-700 truncate">{aud.name}</span>
            </motion.div>
          )) : (
            <div id="flow-aud-0" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 text-gray-300 w-44">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sem públicos</span>
            </div>
          )}
        </div>

        {/* DESTINOS */}
        <div className="flex flex-col gap-3 z-10 shrink-0">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Destinos</p>
          {destinations.map((dest: any, i: number) => (
            <motion.div
              id={`flow-dest-${i}`}
              key={dest.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              className="bg-emerald-600 rounded-xl px-4 py-3 text-white w-44 shadow-lg shadow-emerald-100 relative overflow-hidden"
            >
              <Target className="w-5 h-5 mb-1 text-emerald-200" />
              <p className="font-bold text-sm leading-tight">{dest.label}</p>
              {dest.event && <p className="text-[9px] text-emerald-200 uppercase tracking-widest mt-0.5">{dest.event}</p>}
              {dest.url && <p className="text-[8px] text-emerald-300 font-mono mt-1 truncate">{dest.url.replace(/^https?:\/\//, "")}</p>}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                className="absolute inset-0 bg-emerald-300 -z-10 blur-xl"
              />
            </motion.div>
          ))}
        </div>

        {/* Dot grid background */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      {/* Mobile: lista simples */}
      <div className="md:hidden flex flex-col gap-3 text-sm text-gray-500">
        <div className="flex flex-wrap gap-2">{sources.map((s: any) => <span key={s.name} className={`${s.bg} ${s.border} border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700`}>{s.name}</span>)}</div>
        <div className="flex flex-wrap gap-2">{audiences.map((a: any, i: number) => <span key={i} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 truncate max-w-[160px]">{a.name}</span>)}</div>
        <div className="flex flex-wrap gap-2">{destinations.map((d: any) => <span key={d.id} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">{d.label}</span>)}</div>
      </div>
    </motion.div>
  );
}

export function Overview() {
  const { campaignId } = useParams();
  const { getActiveCampaign, getCampaign } = useStore();
  
  const campaign = campaignId ? getCampaign(campaignId) : getActiveCampaign();

  // Dynamic objectives — fall back to static defaults if no campaign
  const obj = campaign?.objectives;
  const objectives = [
    {
      icon: TrendingUp,
      label: "ROAS Alvo",
      value: obj?.roas ?? "4×",
      sub: "Retorno sobre o investimento",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      icon: Users,
      label: "Leads Qualificados",
      value: obj?.leads ?? "200+",
      sub: "Por mês, funil completo",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    },
    {
      icon: Target,
      label: "Alcance Mensal",
      value: obj?.reach ?? "500K",
      sub: "Impressões qualificadas",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      icon: Zap,
      label: "Redução de CAC",
      value: obj?.cac ?? "−30%",
      sub: "Custo de aquisição de cliente",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  ];

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
  const circumference = 251.2;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 py-10 md:py-12 relative overflow-hidden">
          {/* decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-300 bg-blue-500/20 border border-blue-400/20 px-3 py-1.5 rounded-full">
                Proposta Estratégica · 2025
              </span>
            </div>
            <h1 className="text-white mb-4" style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}>
              Estratégia Integrada<br />de Mídia Paga
            </h1>
            <p className="text-slate-300 max-w-2xl leading-relaxed mb-8" style={{ fontSize: "clamp(0.875rem, 2vw, 1rem)" }}>
              Uma abordagem full-funnel, orientada a dados e integrada entre Google Ads e Meta Ads,
              projetada para maximizar alcance, geração de leads qualificados e retorno sobre
              o investimento em cada etapa da jornada do cliente.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Canais", value: "Google Ads + Meta Ads" },
                { label: "Modelo", value: "Full-Funnel" },
                { label: "Período", value: "Q1–Q2 · 2025" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-white text-sm" style={{ fontWeight: 500 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-gray-200 border-t border-gray-200">
          {objectives.map((obj) => {
            const Icon = obj.icon;
            return (
              <div key={obj.label} className="px-4 md:px-6 py-4 md:py-5 flex items-center gap-3 border-b md:border-b-0 border-gray-200 last:border-b-0 odd:border-r md:border-r-0">
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${obj.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${obj.color}`} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-400 leading-none mb-1">{obj.label}</p>
                  <p className={`leading-none ${obj.color}`} style={{ fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.1rem)" }}>{obj.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Budget Allocation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
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
                <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{metaPct}%</span>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-2 border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${metaPct}%` }}></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-200" />
                  <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Google Ads (Search & YouTube)</span>
                </div>
                <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{googlePct}%</span>
              </div>
              <div className="w-full bg-gray-50 rounded-full h-2 border border-gray-100 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${googlePct}%` }}></div>
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
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

                <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                  {stage.description}
                </p>

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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
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
          {channels.map((ch) => (
            <div
              key={ch.path}
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
                to={ch.path}
                className="flex items-center justify-between w-full bg-gray-50 hover:bg-blue-600 border border-gray-200 hover:border-blue-600 text-gray-700 hover:text-white px-4 py-2.5 rounded-lg transition-all group"
              >
                <span className="text-sm" style={{ fontWeight: 500 }}>Ver estratégia completa</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline Section — removed */}
      {false && <motion.div
        initial={{ opacity: 0, y: 16 }}
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

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm overflow-x-auto">
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

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-center pb-4"
      >
        <p className="text-xs text-gray-300">
          Documento confidencial · Estratégia de Mídia Paga 2025 · Uso interno
        </p>
      </motion.div>
    </div>
  );
}
