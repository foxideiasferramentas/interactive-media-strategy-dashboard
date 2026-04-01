import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, FileText, Pencil, Check, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Globe, ExternalLink, Trash2, Plus, Phone, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Creative } from "./CreativeModal";
import type { MetaCarouselCard, MetaCreative } from "../data/types";
import { getYouTubeId } from "../utils/youtube";
import { normalizeMediaUrl, isDirectVideoUrl, loadedMediaCache } from "../utils/media";
export { PMAX_TABS } from "./creative/Previews";
import { formatDisplayUrl, PMAX_TABS, type PMaxTabId as PMaxTab } from "./creative/Previews";
export type { PMaxTabId as PMaxTab } from "./creative/Previews";
import { type Sitelink, type StructuredSnippet, type CallExtension } from "../data/types";

interface CreativeCardProps {
  creative: Creative;
  onClick: () => void;
  accentClass?: string;
  companyName?: string;
  companyUrl?: string;
  companyLogo?: string;
  forcedPMaxTab?: PMaxTab;
  initialOffset?: number;
  globalSitelinks?: Sitelink[];
  globalSnippets?: StructuredSnippet[];
  globalCall?: CallExtension;
}

const CARD_SLOT = 3;

function isYouTubeShort(url?: string): boolean {
  return !!(url && url.includes("/shorts/"));
}

// Placements Meta compatíveis por formato
const META_PLACEMENTS_BY_FORMAT: Record<string, { id: string; label: string }[]> = {
  Image:    [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }, { id: "reels", label: "Reels" }],
  Video:    [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }, { id: "reels", label: "Reels" }],
  Carousel: [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }],
};
type MetaPlacement = "feed" | "stories" | "reels";

// ─── Shared Sub-components (Extracted for Performance) ─────────────────────────

const LogoOrInitials = React.memo(({ url, company, size = "w-5 h-5", fontSize = "text-[7px]" }: { url?: string; company: string; size?: string; fontSize?: string }) => (
  url ? (
    <img src={url} loading="lazy" alt="" className={`${size} object-contain rounded shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-gray-200 flex items-center justify-center ${fontSize} font-bold text-gray-500 shrink-0`}>
      {company.slice(0, 2).toUpperCase()}
    </div>
  )
));

const VideoOverlay = React.memo(({ logoUrl, company }: { logoUrl?: string; company: string }) => (
  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img src={logoUrl} loading="lazy" alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[8px] font-bold text-white">
          {company.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="text-white text-[10px] font-bold drop-shadow-sm">{company}</span>
    </div>
  </div>
));

const VideoThumb = React.memo(({ videoId, isShort, rawUrl, logoUrl, company, muted, onMuteToggle }: { videoId: string | null; isShort: boolean; rawUrl?: string; logoUrl?: string; company: string; muted: boolean; onMuteToggle: (muted: boolean) => void }) => {
  const directUrl = rawUrl ? normalizeMediaUrl(rawUrl) : "";
  const isDirect = isDirectVideoUrl(rawUrl);
  const isCached = loadedMediaCache.has(directUrl);
  const [hasFirstFrame, setHasFirstFrame] = useState(isCached);
  const [isBuffering, setIsBuffering] = useState(!isCached);

  useEffect(() => { 
    if (loadedMediaCache.has(directUrl)) {
      setHasFirstFrame(true);
      setIsBuffering(false);
    } else {
      setHasFirstFrame(false);
      setIsBuffering(true);
    }
  }, [directUrl]);

  if (isDirect) {
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center bg-black">
        {(isBuffering || !hasFirstFrame) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all duration-300">
            <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
          </div>
        )}
        <video
          src={directUrl}
          className="w-full h-auto block relative z-20"
          muted={muted}
          playsInline
          loop
          autoPlay
          preload="metadata"
          crossOrigin="anonymous"
          onLoadedData={() => {
            loadedMediaCache.add(directUrl);
            setHasFirstFrame(true);
          }}
          onCanPlay={() => {
            loadedMediaCache.add(directUrl);
            setIsBuffering(false);
          }}
          onPlaying={() => {
            loadedMediaCache.add(directUrl);
            setIsBuffering(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          style={{ opacity: hasFirstFrame ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
        <div className="absolute inset-0 z-20 pointer-events-none">
          <VideoOverlay logoUrl={logoUrl} company={company} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMuteToggle(!muted); }}
          className="absolute bottom-2 right-2 z-30 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>
    );
  }
  if (!videoId) return (
    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
      <Globe className="w-6 h-6 text-gray-600" />
    </div>
  );
  return (
    <div className="relative w-full bg-black overflow-hidden flex items-center justify-center" style={{ minHeight: isShort ? "300px" : "auto" }}>
      <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} loading="lazy" className="w-full h-full object-cover" alt="" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
        </div>
      </div>
      <VideoOverlay logoUrl={logoUrl} company={company} />
    </div>
  );
});

export const ImageWithSkeleton = React.memo(({ src, className, style, skeletonBg = "bg-slate-100", spinnerBorder = "border-slate-300" }: { src: string, className?: string, style?: React.CSSProperties, skeletonBg?: string, spinnerBorder?: string }) => {
  const isCached = loadedMediaCache.has(src);
  const [loaded, setLoaded] = useState(isCached);
  
  useEffect(() => { 
    if (loadedMediaCache.has(src)) {
      setLoaded(true);
    } else {
      setLoaded(false); 
    }
  }, [src]);

  const handleLoaded = () => {
    loadedMediaCache.add(src);
    setLoaded(true);
  };

  return (
    <div className={`relative ${className}`} style={{ ...style, overflow: 'hidden' }}>
      {!loaded && (
        <div className={`absolute inset-0 ${skeletonBg} animate-pulse flex items-center justify-center z-10`}>
          <div className={`w-6 h-6 rounded-full border-2 ${spinnerBorder} border-t-transparent animate-spin opacity-50`} />
        </div>
      )}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={handleLoaded}
        onError={handleLoaded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: style?.objectPosition, opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}
      />
    </div>
  );
});

export const DirectVideoWithSkeleton = React.memo(({ src, muted, onMuteToggle }: { src: string, muted: boolean, onMuteToggle: (m: boolean) => void }) => {
  const isCached = loadedMediaCache.has(src);
  const [hasFirstFrame, setHasFirstFrame] = useState(isCached);
  const [isBuffering, setIsBuffering] = useState(!isCached);
  
  useEffect(() => { 
    if (loadedMediaCache.has(src)) {
      setHasFirstFrame(true);
      setIsBuffering(false);
    } else {
      setHasFirstFrame(false);
      setIsBuffering(true);
    }
  }, [src]);
  
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {(isBuffering || !hasFirstFrame) && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 transition-all duration-300">
          <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
        </div>
      )}
      <video
        src={src}
        className="absolute inset-0 w-full h-full object-cover bg-transparent z-20"
        muted={muted}
        playsInline
        loop
        autoPlay
        preload="metadata"
        onLoadedData={() => {
          loadedMediaCache.add(src);
          setHasFirstFrame(true);
        }}
        onCanPlay={() => {
          loadedMediaCache.add(src);
          setIsBuffering(false);
        }}
        onPlaying={() => {
          loadedMediaCache.add(src);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        style={{ opacity: hasFirstFrame ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onMuteToggle(!muted); }}
        className="absolute bottom-2 right-2 z-30 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
      </button>
    </div>
  );
});

export function CreativeCard({ creative, onClick, accentClass = "bg-blue-600", companyName, companyUrl, companyLogo, forcedPMaxTab, initialOffset = 0, globalSitelinks, globalSnippets, globalCall }: CreativeCardProps) {

  const isMeta = creative.format === "Image" || creative.format === "Video" || creative.format === "Carousel";
  const isSearchAd = creative.format.includes("Search") || creative.format.includes("Busca");
  const isPMax = creative.format.includes("Performance Max") || creative.format.includes("PMax");
  const isRotating = isSearchAd || isPMax;

  // ── Meta Carousel state ──────────────────────────────────────────
  const [carouselIdx, setCarouselIdx] = useState(initialOffset % Math.max(1, (creative as any).carouselCards?.length || 1));
  const meta = creative as unknown as MetaCreative;
  const carouselCards = meta.carouselCards || [];

  // ── Meta image variations + placement state ──────────────────────
  const metaImages = creative.images?.length ? creative.images : (meta.imageUrl ? [meta.imageUrl] : []);
  const [metaImgIdx, setMetaImgIdx] = useState(initialOffset % Math.max(1, metaImages.length));
  const metaPlacements = META_PLACEMENTS_BY_FORMAT[creative.format] ?? META_PLACEMENTS_BY_FORMAT["Image"];
  const [metaPlacement, setMetaPlacement] = useState<MetaPlacement>(
    (meta.primaryPlacement?.toLowerCase() as MetaPlacement) ?? "feed"
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-play para Reels (Imagens/Carrossel)
  useEffect(() => {
    if (metaPlacement === "reels" && isMeta) {
      const isCarousel = creative.format === "Carousel";
      const total = isCarousel ? (creative as any).carouselCards?.length || 0 : metaImages.length;
      if (total > 1) {
        const timer = setInterval(() => {
          if (isCarousel) {
            setCarouselIdx((i) => (i + 1) % total);
          } else {
            setMetaImgIdx((i) => (i + 1) % total);
          }
        }, 5000);
        return () => clearInterval(timer);
      }
    }
  }, [metaPlacement, isMeta, creative, metaImages.length]);

  // ── Shared rotation state ────────────────────────────────────────────
  const DURATION = isSearchAd ? 4000 : 5000; // ms per slide
  const [progress, setProgress] = useState(0);   // 0-100
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── RSA state ─────────────────────────────────────────────────────
  const hCount = creative.headlines?.length || 0;
  const bCount = creative.bodies?.length || 0;
  const rsaCanRotate = isSearchAd && (hCount > CARD_SLOT || bCount > 1);
  const maxCombo = hCount > CARD_SLOT ? hCount - CARD_SLOT + 1 : 1;
  const [comboIndex, setComboIndex] = useState(initialOffset % maxCombo);
  const [bodyIndex, setBodyIndex] = useState(initialOffset % Math.max(1, bCount));

  const rsaNext = useCallback(() => {
    setComboIndex((prev) => (hCount > CARD_SLOT ? (prev + 1) % maxCombo : 0));
    setBodyIndex((prev) => (bCount > 1 ? (prev + 1) % bCount : 0));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, [hCount, bCount, maxCombo]);

  const rsaPrev = useCallback(() => {
    setComboIndex((prev) => (hCount > CARD_SLOT ? (prev - 1 + maxCombo) % maxCombo : 0));
    setBodyIndex((prev) => (bCount > 1 ? (prev - 1 + bCount) % bCount : 0));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, [hCount, bCount, maxCombo]);

  // ── PMax state ───────────────────────────────────────────────────
  const [pmaxTab, setPmaxTab] = useState<PMaxTab>(forcedPMaxTab || "search");
  const [pmaxAsset, setPmaxAsset] = useState(initialOffset);
  const pmaxComboRef = useRef(0);
  const COMBOS_PER_TAB = 3;
  const [thumbMuted, setThumbMuted] = useState(true); // State for PMax VideoThumb

  const pmaxNext = useCallback(() => {
    pmaxComboRef.current++;
    setPmaxAsset((i) => i + 1);
    if (pmaxComboRef.current >= COMBOS_PER_TAB) {
      pmaxComboRef.current = 0;
      if (!forcedPMaxTab) {
        setPmaxTab((prev) => {
          const idx = PMAX_TABS.findIndex((t) => t.id === prev);
          return PMAX_TABS[(idx + 1) % PMAX_TABS.length].id;
        });
      }
    }
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, [forcedPMaxTab]);

  const pmaxPrev = useCallback(() => {
    pmaxComboRef.current = Math.max(0, pmaxComboRef.current - 1);
    setPmaxAsset((i) => Math.max(0, i - 1));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, []);

  // ── Progress loop (rAF) ───────────────────────────────────────────
  const doNext = isSearchAd ? rsaNext : pmaxNext;
  const canRotate = isSearchAd ? rsaCanRotate : isPMax;

  useEffect(() => {
    if (!canRotate) return;

    const tick = (ts: number) => {
      if (!paused) {
        if (lastTimeRef.current === null) lastTimeRef.current = ts;
        const delta = ts - lastTimeRef.current;
        lastTimeRef.current = ts;
        progressRef.current = Math.min(100, progressRef.current + (delta / DURATION) * 100);
        setProgress(progressRef.current);
        if (progressRef.current >= 100) {
          doNext();
        }
      } else {
        lastTimeRef.current = null; // reset so timer doesn't jump on unpause
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [canRotate, paused, doNext, DURATION]);

  // ── Derived display values ──────────────────────────────────────────
  const allHeadlines = creative.headlines ?? [];
  const activeIndices = allHeadlines.length > 0
    ? Array.from({ length: Math.min(CARD_SLOT, allHeadlines.length) }, (_, i) => (comboIndex + i) % allHeadlines.length)
    : [];
  const displayHeadline = activeIndices.map((i) => allHeadlines[i]).join(" · ") || creative.headline;
  const displayBody = creative.bodies?.[bodyIndex] || creative.body;
  const displayUrl = formatDisplayUrl(companyUrl);
  const displayCompany = companyName || "Sua Empresa";

  // PMax assets — all derived from pmaxAsset counter
  const pmaxImages   = (creative.images?.length ? creative.images : creative.image ? [creative.image] : []);
  const pmaxHeadlines = creative.headlines?.length ? creative.headlines : creative.headline ? [creative.headline] : ["Título"];
  const pmaxLongH    = creative.longHeadlines?.length ? creative.longHeadlines : pmaxHeadlines;
  const pmaxBodies   = creative.bodies?.length ? creative.bodies : creative.body ? [creative.body] : [""];
  const n = pmaxAsset;
  // Descorrelacionar usando a posição do próprio formato (tab) para garantir que cada card comece em um ponto diferente
  const tabIndex = PMAX_TABS.findIndex(t => t.id === pmaxTab);
  const headlineIdx = n + initialOffset + tabIndex; 
  const pmaxImgRaw  = pmaxImages[n % Math.max(pmaxImages.length, 1)]   || "";
  const pmaxImg     = normalizeMediaUrl(pmaxImgRaw);
  const pmaxFocal   = creative.imageFocalPoints?.[pmaxImgRaw] ?? { x: 50, y: 50 };
  const pmaxLH      = pmaxLongH[headlineIdx % Math.max(pmaxLongH.length, 1)];
  const pmaxBody    = pmaxBodies[headlineIdx % Math.max(pmaxBodies.length, 1)];
  const pmaxLogoUrl  = normalizeMediaUrl(creative.logos?.[0] || companyLogo);
  const pmaxVideos   = creative.videos ?? [];
  const pmaxVideoUrl = pmaxVideos[n % Math.max(pmaxVideos.length, 1)];
  const pmaxVideoId  = getYouTubeId(pmaxVideoUrl);
  const pmaxIsShort  = isYouTubeShort(pmaxVideoUrl);

  // Non-PMax video
  const videoUrl = creative.videos?.[0] || creative.image;
  const videoId = getYouTubeId(videoUrl);
  const isShort = isYouTubeShort(videoUrl);
  const thumbSrc = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : normalizeMediaUrl(creative.image || creative.images?.[0] || "");
  const [imgError, setImgError] = useState(false);
  const videoAspect = isShort ? "9 / 16" : "16 / 9";

  // ── Progress bar + nav overlay (shared) ───────────────────────────────
  const accentFill = isSearchAd ? "bg-blue-500" : (isPMax ? "bg-emerald-500" : "bg-slate-400");

  // ── PMax Card Preview ──────────────────────────────────────────────────────
  if (isPMax) {
    // const LogoOrInitials = () =>
    //   pmaxLogoUrl ? (
    //     <img src={pmaxLogoUrl} loading="lazy" alt="" className="w-5 h-5 object-contain rounded shrink-0" />
    //   ) : (
    //     <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-500 shrink-0">
    //       {displayCompany.slice(0, 2).toUpperCase()}
    //     </div>
    //   );

    // const VideoThumb = ({ videoId, isShort, rawUrl }: { videoId: string | null; isShort: boolean; rawUrl?: string }) => {
    //   const directUrl = rawUrl ? normalizeMediaUrl(rawUrl) : "";
    //   const isDirect = isDirectVideoUrl(rawUrl);
    //   const [thumbMuted, setThumbMuted] = useState(true);

    //   const VideoOverlay = () => (
    //     <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
    //       <div className="flex items-center gap-2">
    //         {pmaxLogoUrl ? (
    //           <img src={pmaxLogoUrl} loading="lazy" alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
    //         ) : (
    //           <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[8px] font-bold text-white">
    //             {displayCompany.slice(0, 2).toUpperCase()}
    //           </div>
    //         )}
    //         <span className="text-white text-[10px] font-bold drop-shadow-sm">{displayCompany}</span>
    //       </div>
    //     </div>
    //   );

    //   if (isDirect) {
    //     return (
    //       <div className="relative w-full bg-black overflow-hidden flex items-center justify-center">
    //         <video
    //           src={directUrl}
    //           className="w-full h-auto min-h-[150px] max-h-[300px] block bg-black/10"
    //           muted={thumbMuted}
    //           playsInline
    //           loop
    //           autoPlay
    //           preload="metadata"
    //           crossOrigin="anonymous"
    //         />
    //         <VideoOverlay />
    //         <button
    //           onClick={(e) => { e.stopPropagation(); setThumbMuted((m) => !m); }}
    //           className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
    //         >
    //           {thumbMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
    //         </button>
    //       </div>
    //     );
    //   }
    //   if (!videoId) return (
    //     <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
    //       <Globe className="w-6 h-6 text-gray-600" />
    //     </div>
    //   );
    //   return (
    //     <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: isShort ? "9/16" : "16/9" }}>
    //       <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} loading="lazy" className="w-full h-full object-cover" alt="" />
    //       <div className="absolute inset-0 flex items-center justify-center">
    //         <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
    //           <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
    //         </div>
    //       </div>
    //       <VideoOverlay />
    //     </div>
    //   );
    // };

    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full shadow-sm group hover:shadow-md transition-all overflow-hidden min-w-[280px]"
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPMax ? "bg-emerald-400" : "bg-blue-400"}`} />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            Performance Max {forcedPMaxTab && `· ${PMAX_TABS.find(t => t.id === forcedPMaxTab)?.label || forcedPMaxTab.toUpperCase()}`}
          </span>
        </div>

        {/* Segmented tab control */}
        {!forcedPMaxTab && (
          <div className="px-3 pb-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {PMAX_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); setPmaxTab(tab.id); }}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all duration-200 ${
                    pmaxTab === tab.id
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-400 hover:text-gray-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pmaxTab}-${n}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
            >
              {/* Search */}
              {pmaxTab === "search" && (
                <div className="px-4 pb-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs border border-gray-300 rounded px-1.5 text-gray-400 leading-tight">Ad</span>
                    <span className="text-xs text-gray-400 truncate">{displayUrl}</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium leading-snug">
                    {Array.from({ length: Math.min(3, pmaxHeadlines.length) }, (_, i) => pmaxHeadlines[(n + i) % pmaxHeadlines.length]).join(" · ")}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{pmaxBody}</p>

                  {/* Sitelinks (Globais) */}
                  {globalSitelinks && globalSitelinks.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t border-gray-50">
                      {globalSitelinks.slice(0, 4).map((sl) => (
                        <div key={sl.id} className="min-w-0">
                          <p className="text-[11px] text-blue-700 font-medium truncate">{sl.title}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Structured Snippets (Globais) */}
                  {globalSnippets && globalSnippets.some(s => s.values.some(v => v.trim())) && (
                    <div className="mt-1.5 text-[10px] text-gray-400 line-clamp-1">
                      {globalSnippets.map((s, idx) => {
                        const validValues = s.values.filter(v => v.trim());
                        if (validValues.length === 0) return null;
                        return (
                          <span key={s.id}>
                            {idx > 0 && " • "}
                            <strong className="font-semibold">{s.header}: </strong>
                            {validValues.join(", ")}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Call Extension (Global) */}
                  {globalCall?.phone && (
                    <div className="mt-1.5 flex items-center gap-1 text-blue-700">
                      <Phone className="w-2.5 h-2.5" />
                      <span className="text-[11px] font-medium">{globalCall.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Display */}
              {pmaxTab === "display_h" && (
                <div>
                  {pmaxImg ? (
                    <ImageWithSkeleton
                      src={pmaxImg}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "16/9" }}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 px-4 py-2.5">
                    <LogoOrInitials url={pmaxLogoUrl} company={displayCompany} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{pmaxLH}</p>
                      <p className="text-xs text-gray-400">{displayCompany}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold shrink-0 whitespace-nowrap">{creative.cta} ›</span>
                  </div>
                </div>
              )}

              {/* Card */}
              {pmaxTab === "display_v" && (
                <div className="mx-auto w-full">
                  {pmaxImg ? (
                    <ImageWithSkeleton
                      src={pmaxImg}
                      className="w-full h-full object-cover rounded-t-xl"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "4/3" }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="px-3 py-2.5 space-y-1">
                    <p className="text-sm font-bold text-gray-900 leading-snug">{pmaxLH}</p>
                    <p className="text-xs text-gray-400">{displayCompany}</p>
                    <p className="text-xs text-blue-600 font-semibold">{creative.cta} ›</p>
                  </div>
                </div>
              )}

              {/* Feed */}
              {pmaxTab === "discovery" && (
                <div>
                   {pmaxImg ? (
                    <ImageWithSkeleton
                      src={pmaxImg}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "1.91/1" }}
                    />
                  ) : (
                    <div className="aspect-[1.91/1] bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex items-start gap-2 px-4 py-2.5">
                    <LogoOrInitials url={pmaxLogoUrl} company={displayCompany} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-snug">{pmaxLH}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Patrocinado · {displayCompany}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{pmaxBody}</p>

                      {/* Sitelinks (Globais) no Discovery */}
                      {globalSitelinks && globalSitelinks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                          {globalSitelinks.slice(0, 2).map((sl) => (
                            <span
                              key={sl.id}
                              className="text-[11px] text-blue-600 font-medium underline"
                            >
                              {sl.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube */}
              {pmaxTab === "youtube" && (
                <div className="overflow-hidden">
                   <VideoThumb
                    videoId={pmaxVideoId}
                    isShort={pmaxIsShort}
                    rawUrl={pmaxVideoUrl}
                    logoUrl={pmaxLogoUrl}
                    company={displayCompany}
                    muted={thumbMuted}
                    onMuteToggle={setThumbMuted}
                  />

                  {/* Sitelinks (Globais) no YouTube */}
                  {globalSitelinks && globalSitelinks.length > 0 && (
                    <div className="bg-white px-4 py-2 flex gap-4 overflow-x-auto no-scrollbar border-t border-gray-100">
                      {globalSitelinks.slice(0, 4).map((sl) => (
                        <div key={sl.id} className="shrink-0">
                          <p className="text-[11px] text-blue-600 font-medium whitespace-nowrap">
                            {sl.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 mt-auto border-t border-gray-50">
          <span className={`text-sm text-white ${accentClass} px-3 py-1.5 rounded-lg`} style={{ fontWeight: 600 }}>
            {creative.cta}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>

        {/* No hover overlay */}
      </div>
    );
  }

  // ── Meta Ads Preview ───────────────────────────────────────────────────────
  if (isMeta) {
    const metaImages = creative.images || [];
    const metaVideos = creative.videos || [];
    const isCarousel = creative.format === "Carousel";
    const totalItems = isCarousel ? carouselCards.length : (metaImages.length || 1);
    
    // Media detection
    const currentImgUrl = isCarousel 
      ? carouselCards[carouselIdx]?.imageUrl 
      : metaImages[metaImgIdx] || creative.image || "";

    const activeUrl = metaVideos.find(v => isDirectVideoUrl(v) || !!getYouTubeId(v)) 
      ?? metaVideos[0] 
      ?? currentImgUrl;

    const normalized = normalizeMediaUrl(activeUrl || "");
    const ytId = getYouTubeId(activeUrl || "");
    const isDirect = isDirectVideoUrl(activeUrl || "");
    const isReels = metaPlacement === "reels";
    const currentCard = isCarousel ? carouselCards[carouselIdx] : null;

    const [mediaMuted, setMediaMuted] = useState(true);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => { setImgLoaded(false); }, [normalized, metaPlacement]);

    const renderMediaContent = () => {
      // YouTube
      if (ytId) {
        return (
          <div className="relative w-full h-full bg-black">
            <VideoThumb 
              videoId={ytId} 
              isShort={metaPlacement === "stories" || metaPlacement === "reels"}
              rawUrl={activeUrl || undefined}
              logoUrl={companyLogo || undefined}
              company={displayCompany}
              muted={mediaMuted}
              onMuteToggle={setMediaMuted}
            />
          </div>
        );
      }

      // Direct Video
      if (isDirect && normalized) {
        return <DirectVideoWithSkeleton src={normalized} muted={mediaMuted} onMuteToggle={setMediaMuted} />;
      }

      // Image with Sliding Transition
      return (
        <div className="relative w-full h-full overflow-hidden bg-black">
          <AnimatePresence initial={false}>
            <motion.div
              key={`${metaPlacement}-${isCarousel ? (currentCard?.id || carouselIdx) : metaImgIdx}`}
              initial={isReels ? { x: "100%", opacity: 1 } : { opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={isReels ? { x: "-100%", opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden"
            >
              <ImageWithSkeleton
                src={normalized}
                className={`w-full h-full object-cover ${isReels ? "animate-ken-burns" : ""}`}
                skeletonBg="bg-slate-800"
                spinnerBorder="border-slate-600"
                style={creative.imageFocalPoints?.[currentImgUrl] ? {
                  objectPosition: `${creative.imageFocalPoints[currentImgUrl].x}% ${creative.imageFocalPoints[currentImgUrl].y}%`
                } : undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      );
    };

    const MediaNav = () => (totalItems > 1 && metaPlacement !== "reels") ? (
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-10 transition-opacity opacity-0 group-hover:opacity-100">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (isCarousel) {
              setCarouselIdx((i) => (i - 1 + totalItems) % totalItems);
            } else {
              setMetaImgIdx((i) => (i - 1 + totalItems) % totalItems);
            }
          }}
          className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center pointer-events-auto hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (isCarousel) {
              setCarouselIdx((i) => (i + 1) % totalItems);
            } else {
              setMetaImgIdx((i) => (i + 1) % totalItems);
            }
          }}
          className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center pointer-events-auto hover:bg-white transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    ) : null;

    const renderFeedPreview = () => (
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
              <Globe className="w-4 h-4 text-slate-300 pointer-events-none" />
              {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-900 leading-none mb-0.5">{displayCompany}</span>
              <span className="text-[10px] text-gray-500 leading-none">Patrocinado</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </div>
        <div className="px-3 pb-2">
          <p className="text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {isExpanded || (meta.primaryText || creative.body || "").length <= 95 
              ? (meta.primaryText || creative.body) 
              : `${(meta.primaryText || creative.body || "").trimEnd().substring(0, 92)}...`}
            {!isExpanded && (meta.primaryText || creative.body || "").length > 95 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} 
                className="ml-0.5 text-gray-500 font-semibold hover:text-gray-700 hover:underline text-[11px]"
              >
                Ver mais
              </button>
            )}
          </p>
        </div>
        <div className="relative overflow-hidden bg-slate-100 group" style={{ aspectRatio: "4 / 5" }}>
          {renderMediaContent()}
          <MediaNav />
        </div>
        <div className="px-3 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-gray-400 uppercase tracking-tight truncate">{creative.displayLink || "www.site.com"}</p>
            <p className="text-[12px] font-bold text-gray-900 leading-snug truncate">
              {(isCarousel ? currentCard?.headline : creative.headline) || creative.headline}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-gray-200 rounded-md shrink-0">
            <span className="text-[11px] font-bold text-gray-700">{creative.cta}</span>
          </div>
        </div>
      </div>
    );

    const renderStoriesPreview = () => (
      <div className="relative overflow-hidden bg-black group" style={{ aspectRatio: "9 / 16" }}>
        {renderMediaContent()}
        <MediaNav />
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: totalItems }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-[2px] rounded-full transition-colors ${i <= (isCarousel ? carouselIdx : metaImgIdx) ? "bg-white" : "bg-white/40"}`} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
              <Globe className="w-3.5 h-3.5 text-white/40" />
              {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
            </div>
            <div>
              <p className="text-[11px] font-bold text-white leading-none">{displayCompany}</p>
              <p className="text-[9px] text-white/60 mt-0.5">Patrocinado</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-20 pointer-events-none flex flex-col items-center gap-2">
          <p className="text-[11px] text-white font-semibold text-center line-clamp-2 drop-shadow">
            {isCarousel ? currentCard?.headline : creative.headline}
          </p>
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-3 bg-white/60" />
            <p className="text-[10px] text-white font-bold uppercase tracking-wide">{creative.cta}</p>
          </div>
        </div>
      </div>
    );

    const renderReelsPreview = () => (
      <div className="relative overflow-hidden bg-black group" style={{ aspectRatio: "9 / 16" }}>
        {renderMediaContent()}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-20 pointer-events-none">
          {["♥", "💬", "↗"].map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-[13px]">{icon}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 px-3 pb-4 pt-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 overflow-hidden shrink-0 relative">
                  {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
                </div>
                <span className="text-white text-[11px] font-bold shadow-sm">{displayCompany}</span>
                <span className="px-1.5 py-0.5 rounded border border-white/40 text-white text-[8px] font-bold">Patrocinado</span>
              </div>
              <p className="text-white text-[11px] line-clamp-2 drop-shadow shadow-black">
                {isCarousel ? currentCard?.headline : creative.headline}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-md shrink-0">
              <span className="text-[10px] font-bold text-gray-900">{creative.cta}</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-gray-300 group flex flex-col shadow-sm"
      >
        <div className="px-3 pt-3 pb-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {metaPlacements.map((p) => (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); setMetaPlacement(p.id as MetaPlacement); }}
                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all duration-200 ${
                  metaPlacement === p.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-400 hover:text-gray-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={metaPlacement}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {metaPlacement === "feed" && renderFeedPreview()}
            {metaPlacement === "stories" && renderStoriesPreview()}
            {metaPlacement === "reels" && renderReelsPreview()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Derive label and dot color for standard formats ────────────────────────
  const formatLabel = isSearchAd
    ? "Busca · RSA"
    : creative.format.includes("YouTube")
    ? "YouTube"
    : creative.format.includes("Display")
    ? "Display"
    : creative.format;

  const dotColor = isSearchAd
    ? "bg-blue-400"
    : creative.format.includes("YouTube")
    ? "bg-red-500"
    : creative.format.includes("Display")
    ? "bg-purple-400"
    : "bg-gray-400";

  // ── Standard Card (Search / Display / YouTube) ─────────────────────────────
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 group flex flex-col shadow-sm"
    >
      {/* Header — igual ao PMax */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formatLabel}</span>
        </div>
      </div>

      {/* Content */}
      {isSearchAd ? (
        <div className="relative px-4 pb-3 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-gray-500 border border-gray-300 rounded px-1.5 leading-tight">Ad</span>
            <span className="text-xs text-gray-500 leading-tight truncate">{displayUrl}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Globe className="w-3 h-3 text-slate-500" />
            </div>
            <span className="text-xs text-gray-700 font-medium leading-tight truncate">{displayCompany}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.h3
              key={`h-${comboIndex}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-base text-blue-700 font-medium leading-snug group-hover:underline decoration-blue-700 mb-1.5"
            >
              {displayHeadline}
            </motion.h3>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`b-${bodyIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-gray-600 leading-relaxed"
            >
              {displayBody}
            </motion.p>
          </AnimatePresence>

          {/* Sitelinks: Prioritize globalSitelinks, fallback to creative.sitelinks */}
          {((globalSitelinks && globalSitelinks.length > 0) || (creative.sitelinks && creative.sitelinks.length > 0)) && (
            <div className="mt-3 grid grid-cols-2 gap-2 pb-1 relative z-10">
              {(globalSitelinks && globalSitelinks.length > 0 ? globalSitelinks : (creative.sitelinks || [])).slice(0, 4).map((sl) => (
                <div key={sl.id} className="min-w-0">
                  <p className="text-[13px] text-blue-700 font-medium hover:underline cursor-pointer truncate">{sl.title}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-1 leading-tight">{sl.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Structured Snippets (Global) */}
          {globalSnippets && globalSnippets.some(s => s.values.some(v => v.trim())) && (
            <div className="mt-2 text-[11px] text-gray-500 line-clamp-1 pb-1 relative z-10">
              {globalSnippets.map((s, idx) => {
                const validValues = s.values.filter(v => v.trim());
                if (validValues.length === 0) return null;
                return (
                  <span key={s.id}>
                    {idx > 0 && " • "}
                    <strong className="font-semibold text-gray-600">{s.header}: </strong>
                    {validValues.join(", ")}
                  </span>
                );
              })}
            </div>
          )}

          {/* Call Extension (Global) */}
          {globalCall?.phone && (
            <div className="mt-2 flex items-center gap-1.5 text-blue-700 font-medium pb-1 relative z-10">
              <Phone className="w-3 h-3" />
              <span className="text-[12px]">{globalCall.phone}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/60 transition-colors duration-300 rounded-2xl pointer-events-none" />
        </div>
      ) : (
        <div
          className={`relative overflow-hidden flex items-center justify-center ${videoId ? "bg-black" : "bg-gray-100"}`}
          style={{ aspectRatio: videoId ? videoAspect : "4/3" }}
        >
          {thumbSrc && !imgError ? (
            <div className="relative w-full h-full group/thumb">
              <ImageWithSkeleton
                src={thumbSrc}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                style={(() => {
                  const u = creative.image || creative.images?.[0] || "";
                  const fp = creative.imageFocalPoints?.[u] ?? { x: 50, y: 50 };
                  return { objectPosition: `${fp.x}% ${fp.y}%` };
                })()}
              />
              {videoId && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : videoId ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Preview de Vídeo</span>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center opacity-40 p-4 text-center">
              <Globe className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
                {creative.format.includes("Display") ? "Anúncio Gráfico" : "Preview Indisponível"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      {/* Body text — only for non-search visual formats */}
      {!isSearchAd && (
        <div className="px-4 py-3 flex flex-col flex-1">
          <h4 className="text-gray-900 text-sm leading-snug mb-1" style={{ fontWeight: 600 }}>
            {creative.headline}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed flex-1">
            {creative.body}
          </p>
        </div>
      )}

      {/* Footer — igual ao PMax */}
      <div className="flex items-center justify-between px-4 py-3 mt-auto border-t border-gray-50">
        <span className={`text-xs text-white ${accentClass} px-3 py-1.5 rounded-lg`} style={{ fontWeight: 600 }}>
          {creative.cta}
        </span>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>

      {/* No hover overlay */}
    </div>
  );
}
