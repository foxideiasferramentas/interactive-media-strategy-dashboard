/**
 * Normaliza URLs de mídia para acesso direto.
 * Suporta: Dropbox (converte para dl.dropboxusercontent.com)
 * Outros provedores podem ser adicionados aqui no futuro.
 */
/**
 * Retorna true se a URL aponta para um arquivo de vídeo direto (não YouTube).
 */
export function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  // Qualquer URL do Dropbox é tratada como vídeo direto (proteção contra URLs sem extensão)
  if (url.includes("dropbox.com") || url.includes("dropboxusercontent.com")) return true;
  const normalized = normalizeMediaUrl(url);
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(normalized);
}

export function normalizeMediaUrl(url?: string): string {
  if (!url) return "";

  if (url.includes("dropbox.com")) {
    try {
      const u = new URL(url);
      if (u.pathname.includes("/scl/fi/")) {
        // URLs novas: manter domínio, trocar dl=0 por raw=1
        u.searchParams.delete("dl");
        u.searchParams.set("raw", "1");
        return u.toString();
      }
      // URLs antigas: trocar domínio para dl.dropboxusercontent.com
      u.host = "dl.dropboxusercontent.com";
      u.searchParams.delete("dl");
      u.searchParams.delete("raw");
      return u.toString();
    } catch {
      // fallback caso a URL seja inválida
      return url;
    }
  }

  return url;
}
