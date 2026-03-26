import { useRef, useEffect, VideoHTMLAttributes } from "react";

interface LazyVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

/**
 * Vídeo que só inicia download e reprodução quando entra no viewport.
 * Pausa automaticamente ao sair. Usa preload="none" para evitar desperdício
 * de banda em cards fora da tela.
 *
 * IMPORTANTE: Não funciona corretamente quando o componente pai re-renderiza
 * com alta frequência (ex: RAF a cada frame), pois o elemento é desmontado
 * antes de conseguir carregar. Nesses casos, prefira <video preload="metadata">.
 */
export function LazyVideo({ src, muted = true, className, ...rest }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Seta src diretamente no DOM. NÃO chamar el.load() antes de el.play()
          // pois el.load() reseta o elemento e aborta o play() pendente (spec HTML).
          el.src = src;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      // threshold: 0 → dispara assim que qualquer pixel do elemento fica visível,
      // evitando falha em elementos com dimensões ainda não computadas pelo CSS.
      { threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      preload="none"
      muted={muted}
      playsInline
      loop
      className={className}
      {...rest}
    />
  );
}
