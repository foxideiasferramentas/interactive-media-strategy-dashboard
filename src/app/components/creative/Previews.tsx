import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Volume2, VolumeX } from "lucide-react";
import { getYouTubeId } from "../../utils/youtube";
import { normalizeMediaUrl, isDirectVideoUrl } from "../../utils/media";

// ─── Shared Types ──────────────────────────────────────────────────────────

export interface Creative {
  id: string;
  format: string;
  image: string;
  headline: string;
  body: string;
  cta: string;
  headlines?: string[];
  bodies?: string[];
  sitelinks?: { id: string; title: string; description: string }[];
  longHeadlines?: string[];
  images?: string[];
  logos?: string[];
  videos?: string[];
  businessName?: string;
  finalUrl?: string;
  imageFocalPoints?: Record<string, { x: number; y: number }>;
  displayLink?: string;
  primaryText?: string;
  carouselCards?: any[];
  primaryPlacement?: string;
  description?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatDisplayUrl(url?: string): string {
  if (!url) return "www.suaempresa.com.br";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ─── YouTube Preview ─────────────────────────────────────────────────────────

export const YouTubePreview = React.memo(function YouTubePreview({ url, businessName, cta, logo }: { url?: string; businessName?: string; cta?: string; logo?: string }) {
  const videoId = getYouTubeId(url);
  const isShort = !!(url && url.includes("/shorts/"));
  const isDirect = isDirectVideoUrl(url);
  const directUrl = useMemo(() => isDirect ? normalizeMediaUrl(url || "") : "", [isDirect, url]);
  const [ytMuted, setYtMuted] = useState(true);

  const Overlay = () => (
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-5">
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} loading="lazy" alt="" className="w-9 h-9 rounded-full border-2 border-white/20 object-cover shadow-lg" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              {businessName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-bold drop-shadow-md">{businessName || "Sua Empresa"}</span>
            <span className="text-white/70 text-[9px] font-medium uppercase tracking-wider">Patrocinado</span>
          </div>
        </div>
        {cta && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg transition-transform active:scale-95">
            {cta}
          </button>
        )}
      </div>
    </div>
  );

  if (isDirect) {
    return (
      <div className="relative w-full flex items-center justify-center">
        <video
          src={directUrl}
          className="w-full h-auto block mx-auto"
          muted={ytMuted}
          playsInline
          loop
          autoPlay
          preload="metadata"
          crossOrigin="anonymous"
        />
        <Overlay />
        <button
          onClick={() => setYtMuted((m) => !m)}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {ytMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-black overflow-hidden ${isShort ? "aspect-[9/16]" : "aspect-video"}`}>
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=0&modestbranding=1&rel=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture text-shadow"
      />
      <Overlay />
    </div>
  );
});

// ─── PMax Preview ────────────────────────────────────────────────────────────

export const PMAX_TABS = [
  { id: "search",    label: "Search"   },
  { id: "display_h", label: "Display"  },
  { id: "display_v", label: "Card"     },
  { id: "discovery", label: "Feed"     },
  { id: "youtube",   label: "YouTube"  },
] as const;
export type PMaxTabId = (typeof PMAX_TABS)[number]["id"];

interface PMaxPreviewProps {
  creative: Creative;
  companyName: string;
  displayUrl: string;
  activeTab: PMaxTabId;
  setActiveTab: (t: PMaxTabId) => void;
  assetIdx: number;
  img: string;
  h: string;
  lh: string;
  body: string;
  totalImages: number;
}

export function PMaxPreview({ creative, companyName, displayUrl, activeTab, setActiveTab, assetIdx, img, h, lh, body, totalImages }: PMaxPreviewProps) {
  const logo     = creative.logos?.[0];
  const videos   = creative.videos ?? [];
  const videoUrl = videos[assetIdx % Math.max(videos.length, 1)];
  const cta      = creative.cta || "Saiba Mais";

  const LogoMark = () =>
    logo ? (
      <img src={logo} loading="lazy" alt="" className="w-6 h-6 object-contain rounded shrink-0" />
    ) : (
      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 shrink-0">
        {companyName.slice(0, 2).toUpperCase()}
      </div>
    );

  const fp = creative.imageFocalPoints?.[img] ?? { x: 50, y: 50 };
  const ImageBox = ({ aspect, natural }: { aspect?: string; natural?: boolean }) => {
    const [loaded, setLoaded] = useState(false);
    return img ? (
      <div className={`bg-gray-100 overflow-hidden relative ${natural ? "w-full" : aspect} ${!loaded ? "animate-pulse" : ""}`}>
        <img
          src={normalizeMediaUrl(img)}
          loading="lazy"
          alt=""
          className={natural ? "w-full h-auto block" : "w-full h-full object-cover"}
          style={natural ? undefined : { objectPosition: `${fp.x}% ${fp.y}%` }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    ) : (
      <div className={`bg-gray-50 flex items-center justify-center ${natural ? "aspect-[4/3]" : aspect}`}>
        <Globe className="w-8 h-8 text-gray-200" />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
        {PMAX_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-0.5">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Combinação dinâmica</p>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalImages, 4) }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${assetIdx % Math.max(totalImages, 1) === i ? "bg-blue-500" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          {activeTab === "search" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-semibold text-gray-500 border border-gray-300 rounded px-1 leading-tight">Patrocinado</span>
                <span className="text-[10px] text-gray-500 truncate">{displayUrl}</span>
              </div>
              <h3 className="text-sm text-blue-700 font-medium leading-snug mb-2">{h}</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{body}</p>
              {creative.sitelinks && creative.sitelinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                  {creative.sitelinks.slice(0, 4).map((sl) => (
                    <span key={sl.id} className="text-[11px] text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-medium">{sl.title}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "display_h" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <ImageBox aspect="aspect-video" />
              <div className="px-3 py-2.5 flex items-start gap-2.5">
                <LogoMark />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{lh}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{companyName}</p>
                </div>
                <span className="text-[11px] text-blue-700 font-semibold whitespace-nowrap shrink-0 mt-0.5">{cta} ›</span>
              </div>
            </div>
          )}

          {activeTab === "display_v" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mx-auto">
              <ImageBox natural />
              <div className="p-3">
                {logo && <img src={logo} loading="lazy" alt="" className="h-5 w-auto object-contain mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                <p className="text-sm font-bold text-gray-900 leading-snug mb-1 line-clamp-2">{lh}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5 line-clamp-2">{body}</p>
                <p className="text-[10px] text-gray-400 mb-2.5">{companyName}</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-[11px] text-blue-700 font-semibold">{cta} ›</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "discovery" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="relative">
                <ImageBox natural />
                <div className="absolute top-2 right-2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-[9px] text-gray-500 font-bold">i</span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  <LogoMark />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{lh}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{body}</p>
                  </div>
                  <span className="text-gray-300 text-base leading-none shrink-0">⋮</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Patrocinado · {companyName}</p>
                <p className="text-[11px] text-blue-700 font-semibold mt-1">{cta} ›</p>
              </div>
            </div>
          )}

          {activeTab === "youtube" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <YouTubePreview url={videoUrl} businessName={companyName} cta={cta} logo={logo} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
