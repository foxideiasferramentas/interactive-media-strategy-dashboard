import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, ExternalLink, Globe, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Creative } from "./CreativeModal";
import type { MetaCarouselCard, MetaCreative } from "../data/types";
import { getYouTubeId } from "../utils/youtube";
import { normalizeMediaUrl, isDirectVideoUrl } from "../utils/media";

interface CreativeCardProps {
  creative: Creative;
  onClick: () => void;
  accentClass?: string;
  companyName?: string;
  companyUrl?: string;
  companyLogo?: string;
}

const CARD_SLOT = 3;

function formatDisplayUrl(url?: string): string {
  if (!url) return "www.suaempresa.com.br";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function isYouTubeShort(url?: string): boolean {
  return !!(url && url.includes("/shorts/"));
}

const PMAX_TABS = [
  { id: "search",  label: "Search"  },
  { id: "display", label: "Display" },
  { id: "card",    label: "Card"    },
  { id: "feed",    label: "Feed"    },
  { id: "youtube", label: "YT"      },
] as const;
type PMaxTab = (typeof PMAX_TABS)[number]["id"];

// Placements Meta compatíveis por formato
const META_PLACEMENTS_BY_FORMAT: Record<string, { id: string; label: string }[]> = {
  Image:    [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }, { id: "reels", label: "Reels" }],
  Video:    [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }, { id: "reels", label: "Reels" }],
  Carousel: [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }],
};
type MetaPlacement = "feed" | "stories" | "reels";

export function CreativeCard({ creative, onClick, accentClass = "bg-blue-600", companyName, companyUrl, companyLogo }: CreativeCardProps) {
  const isMeta = creative.format === "Image" || creative.format === "Video" || creative.format === "Carousel";
  const isSearchAd = creative.format.includes("Search") || creative.format.includes("Busca");
  const isPMax = creative.format.includes("Performance Max") || creative.format.includes("PMax");
  const isRotating = isSearchAd || isPMax;

  // ── Meta Carousel state ──────────────────────────────────────────
  const [carouselIdx, setCarouselIdx] = useState(0);
  const meta = creative as unknown as MetaCreative;
  const carouselCards = meta.carouselCards || [];

  // ── Meta image variations + placement state ──────────────────────
  const metaImages = creative.images?.length ? creative.images : (meta.imageUrl ? [meta.imageUrl] : []);
  const [metaImgIdx, setMetaImgIdx] = useState(0);
  const metaPlacements = META_PLACEMENTS_BY_FORMAT[creative.format] ?? META_PLACEMENTS_BY_FORMAT["Image"];
  const [metaPlacement, setMetaPlacement] = useState<MetaPlacement>(
    (meta.primaryPlacement?.toLowerCase() as MetaPlacement) ?? "feed"
  );

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
  const [comboIndex, setComboIndex] = useState(0);
  const [bodyIndex, setBodyIndex] = useState(0);

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
  const [pmaxTab, setPmaxTab] = useState<PMaxTab>("search");
  const [pmaxAsset, setPmaxAsset] = useState(0);
  const pmaxComboRef = useRef(0);
  const COMBOS_PER_TAB = 3;

  const pmaxNext = useCallback(() => {
    pmaxComboRef.current++;
    setPmaxAsset((i) => i + 1);
    if (pmaxComboRef.current >= COMBOS_PER_TAB) {
      pmaxComboRef.current = 0;
      setPmaxTab((prev) => {
        const idx = PMAX_TABS.findIndex((t) => t.id === prev);
        return PMAX_TABS[(idx + 1) % PMAX_TABS.length].id;
      });
    }
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, []);

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
  const pmaxImgRaw  = pmaxImages[n % Math.max(pmaxImages.length, 1)]   || "";
  const pmaxImg     = normalizeMediaUrl(pmaxImgRaw);
  const pmaxFocal   = creative.imageFocalPoints?.[pmaxImgRaw] ?? { x: 50, y: 50 };
  const pmaxLH   = pmaxLongH[n % pmaxLongH.length];
  const pmaxBody = pmaxBodies[n % pmaxBodies.length];
  const pmaxLogoUrl  = normalizeMediaUrl(creative.logos?.[0]);
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
    const LogoOrInitials = () =>
      pmaxLogoUrl ? (
        <img src={pmaxLogoUrl} alt="" className="w-5 h-5 object-contain rounded shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-500 shrink-0">
          {displayCompany.slice(0, 2).toUpperCase()}
        </div>
      );

    const VideoThumb = ({ videoId, isShort, rawUrl }: { videoId: string | null; isShort: boolean; rawUrl?: string }) => {
      const directUrl = rawUrl ? normalizeMediaUrl(rawUrl) : "";
      const isDirect = isDirectVideoUrl(rawUrl);
      const [thumbMuted, setThumbMuted] = useState(true);

      const VideoOverlay = () => (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
          <div className="flex items-center gap-2">
            {pmaxLogoUrl ? (
              <img src={pmaxLogoUrl} alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[8px] font-bold text-white">
                {displayCompany.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-white text-[10px] font-bold drop-shadow-sm">{displayCompany}</span>
          </div>
        </div>
      );

      if (isDirect) {
        return (
          <div className="relative w-full bg-black overflow-hidden flex items-center justify-center">
            <video src={directUrl} className="w-full h-auto max-h-[300px] block" muted={thumbMuted} playsInline loop autoPlay />
            <VideoOverlay />
            <button
              onClick={(e) => { e.stopPropagation(); setThumbMuted((m) => !m); }}
              className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {thumbMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
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
        <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: isShort ? "9/16" : "16/9" }}>
          <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
            </div>
          </div>
          <VideoOverlay />
        </div>
      );
    };

    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 group flex flex-col shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPMax ? "bg-emerald-400" : "bg-blue-400"}`} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Performance Max</span>
        </div>

        {/* Segmented tab control */}
        <div className="px-3 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {PMAX_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={(e) => { e.stopPropagation(); setPmaxTab(tab.id); }}
                className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all duration-200 ${
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
                    <span className="text-[9px] border border-gray-300 rounded px-1 text-gray-400 leading-tight">Ad</span>
                    <span className="text-[9px] text-gray-400 truncate">{displayUrl}</span>
                  </div>
                  <p className="text-[12px] text-blue-700 font-medium leading-snug">
                    {Array.from({ length: Math.min(3, pmaxHeadlines.length) }, (_, i) => pmaxHeadlines[(n + i) % pmaxHeadlines.length]).join(" · ")}
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{pmaxBody}</p>
                </div>
              )}

              {/* Display */}
              {pmaxTab === "display" && (
                <div>
                  {pmaxImg ? (
                    <img
                      src={pmaxImg}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "16/9" }}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 px-4 py-2.5">
                    <LogoOrInitials />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-900 leading-snug">{pmaxLH}</p>
                      <p className="text-[10px] text-gray-400">{displayCompany}</p>
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold shrink-0 whitespace-nowrap">{creative.cta} ›</span>
                  </div>
                </div>
              )}

              {/* Card */}
              {pmaxTab === "card" && (
                <div className="mx-auto max-w-[200px]">
                  {pmaxImg ? (
                    <img
                      src={pmaxImg}
                      alt=""
                      className="w-full h-full object-cover rounded-t-xl"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "4/3" }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="px-3 py-2.5 space-y-1">
                    <p className="text-[11px] font-bold text-gray-900 leading-snug">{pmaxLH}</p>
                    <p className="text-[10px] text-gray-400">{displayCompany}</p>
                    <p className="text-[10px] text-blue-600 font-semibold">{creative.cta} ›</p>
                  </div>
                </div>
              )}

              {/* Feed */}
              {pmaxTab === "feed" && (
                <div>
                   {pmaxImg ? (
                    <img
                      src={pmaxImg}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${pmaxFocal.x}% ${pmaxFocal.y}%`, aspectRatio: "1.91/1" }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex items-start gap-2 px-4 py-2.5">
                    <LogoOrInitials />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-900 leading-snug">{pmaxLH}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Patrocinado · {displayCompany}</p>
                      <p className="text-[10px] text-blue-600 font-medium mt-0.5">{pmaxBody}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube */}
              {pmaxTab === "youtube" && (
                <div className="overflow-hidden">
                  <VideoThumb videoId={pmaxVideoId} isShort={pmaxIsShort} rawUrl={pmaxVideoUrl} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
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

  // ── Meta Ads Preview ───────────────────────────────────────────────────────
  if (isMeta) {
    const isCarousel = creative.format === "Carousel";
    const currentCard = isCarousel ? carouselCards[carouselIdx] : null;
    const currentImgUrl = isCarousel
      ? (currentCard?.imageUrl || "")
      : (metaImages[metaImgIdx] || "");
    const isVideo = creative.format === "Video";

    const prevImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMetaImgIdx((i) => (i - 1 + metaImages.length) % metaImages.length);
    };
    const nextImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMetaImgIdx((i) => (i + 1) % metaImages.length);
    };
    const prevCard = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCarouselIdx((i) => (i - 1 + carouselCards.length) % carouselCards.length);
    };
    const nextCard = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCarouselIdx((i) => (i + 1) % carouselCards.length);
    };

    // Shared media area used across placements
    const MediaNav = () => (
      <>
        {isCarousel && carouselCards.length > 1 && (
          <>
            <button onClick={prevCard} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-all z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextCard} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-all z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {carouselCards.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIdx === i ? "bg-white scale-110" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
        {!isCarousel && metaImages.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-all z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-all z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {metaImages.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${metaImgIdx === i ? "bg-white scale-110" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[11px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
            </div>
          </div>
        )}
      </>
    );

    const MediaContent = ({ className }: { className?: string }) => {
      const [mediaMuted, setMediaMuted] = useState(true);

      // Busca a melhor URL de vídeo de todas as fontes, independente do formato declarado
      const rawVideoUrl =
        creative.videos?.find(isDirectVideoUrl) ??
        creative.videos?.[0] ??
        (isDirectVideoUrl(currentImgUrl) ? currentImgUrl : null) ??
        null;

      const normalized = rawVideoUrl
        ? normalizeMediaUrl(rawVideoUrl)
        : normalizeMediaUrl(currentImgUrl);

      if (rawVideoUrl && normalized) {
        return (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              key={normalized}
              src={normalized}
              className={`w-full h-full object-cover ${className ?? ""}`}
              muted={mediaMuted}
              playsInline
              loop
              autoPlay
            />
            <button
              onClick={(e) => { e.stopPropagation(); setMediaMuted((m) => !m); }}
              className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {mediaMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        );
      }

      return (
        <AnimatePresence mode="wait">
          <motion.img
            key={isCarousel ? (currentCard?.id || carouselIdx) : `${creative.id}-${metaImgIdx}`}
            src={normalized}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`w-full h-full object-cover ${className ?? ""}`}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          />
        </AnimatePresence>
      );
    };

    // ── Feed layout ─────────────────────────────────────────────────
    const FeedPreview = () => (
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
              <Globe className="w-4 h-4 text-slate-300 pointer-events-none" title="Avatar fallback" />
              {companyLogo && (
                <img
                  src={normalizeMediaUrl(companyLogo)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                />
              )}
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-900 leading-none">{displayCompany}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Patrocinado · <span className="text-gray-300">🌐</span></p>
            </div>
          </div>
          <div className="flex gap-[3px]">
            <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
            <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
            <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
          </div>
        </div>
        {/* Copy */}
        <div className="px-3 pb-2">
          <p className="text-[12px] text-gray-800 leading-relaxed line-clamp-2">{meta.primaryText || creative.body}</p>
        </div>
        {/* Media — 4:5 for feed */}
        <div className="relative overflow-hidden bg-slate-100 group" style={{ aspectRatio: "4 / 5" }}>
          <MediaContent />
          <MediaNav />
        </div>
        {/* CTA bar */}
        <div className="px-3 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-gray-400 uppercase tracking-tight truncate">{meta.displayLink || formatDisplayUrl(companyUrl)}</p>
            <p className="text-[12px] font-bold text-gray-900 leading-snug truncate">
              {(isCarousel ? currentCard?.headline : meta.headline) || creative.headline}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-gray-200 rounded-md shrink-0">
            <span className="text-[11px] font-bold text-gray-700">{meta.cta}</span>
          </div>
        </div>
      </div>
    );

    // ── Stories layout ───────────────────────────────────────────────
    const StoriesPreview = () => (
      <div className="relative overflow-hidden bg-black group" style={{ aspectRatio: "9 / 16" }}>
        <MediaContent />
        <MediaNav />
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
          <div className="flex gap-1 mb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-[2px] rounded-full bg-white/40" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
              <Globe className="w-3.5 h-3.5 text-white/40 pointer-events-none" />
              {companyLogo && (
                <img
                  src={normalizeMediaUrl(companyLogo)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-white leading-none">{displayCompany}</p>
              <p className="text-[9px] text-white/60 mt-0.5">Patrocinado</p>
            </div>
          </div>
        </div>
        {/* Bottom CTA */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-20 pointer-events-none flex flex-col items-center gap-2">
          <p className="text-[11px] text-white font-semibold text-center line-clamp-2 drop-shadow">
            {meta.headline || creative.headline}
          </p>
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-3 bg-white/60" />
            <p className="text-[10px] text-white font-bold uppercase tracking-wide">{meta.cta}</p>
          </div>
        </div>
      </div>
    );

    // ── Reels layout ─────────────────────────────────────────────────
    const ReelsPreview = () => (
      <div className="relative overflow-hidden bg-black group" style={{ aspectRatio: "9 / 16" }}>
        <MediaContent />
        <MediaNav />
        {/* Right actions */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-20 pointer-events-none">
          {["♥", "💬", "↗"].map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-[13px]">{icon}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom overlay */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-4 pt-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none">
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
                  <Globe className="w-2.5 h-2.5 text-white/40 pointer-events-none" />
                  {companyLogo && (
                    <img
                      src={normalizeMediaUrl(companyLogo)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-white">{displayCompany}</span>
                <span className="text-[9px] text-white/50">· Patrocinado</span>
              </div>
              <p className="text-[11px] text-white line-clamp-2 leading-snug">{meta.primaryText || creative.body}</p>
            </div>
          </div>
          <div className="mt-2.5 flex justify-center">
            <div className="px-5 py-1.5 bg-white/15 border border-white/30 backdrop-blur-sm rounded-full">
              <span className="text-[11px] font-bold text-white">{meta.cta}</span>
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
        {/* Placement tabs */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {metaPlacements.map((p) => (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); setMetaPlacement(p.id as MetaPlacement); }}
                className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all duration-200 ${
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

        {/* Placement preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={metaPlacement}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {metaPlacement === "feed" && <FeedPreview />}
            {metaPlacement === "stories" && <StoriesPreview />}
            {metaPlacement === "reels" && <ReelsPreview />}
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
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatLabel}</span>
        </div>
      </div>

      {/* Content */}
      {isSearchAd ? (
        <div className="relative px-4 pb-3 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 border border-gray-300 rounded px-1 leading-tight">Ad</span>
            <span className="text-[10px] text-gray-500 leading-tight truncate">{displayUrl}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Globe className="w-3 h-3 text-slate-500" />
            </div>
            <span className="text-[11px] text-gray-700 font-medium leading-tight truncate">{displayCompany}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.h3
              key={`h-${comboIndex}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-blue-700 font-medium leading-snug group-hover:underline decoration-blue-700 mb-1.5"
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
              className="text-[11px] text-gray-600 leading-relaxed"
            >
              {displayBody}
            </motion.p>
          </AnimatePresence>
          <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/60 transition-colors duration-300 rounded-2xl pointer-events-none" />
        </div>
      ) : (
        <div
          className={`relative overflow-hidden flex items-center justify-center ${videoId ? "bg-black" : "bg-gray-100"}`}
          style={{ aspectRatio: videoId ? videoAspect : "4/3" }}
        >
          {thumbSrc && !imgError ? (
            <div className="relative w-full h-full">
              <img
                src={thumbSrc}
                alt=""
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
