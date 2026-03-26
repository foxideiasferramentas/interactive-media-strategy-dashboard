/**
 * Normaliza URLs de mídia para acesso direto.
 * Suporta: Dropbox (converte para dl.dropboxusercontent.com)
 * Outros provedores podem ser adicionados aqui no futuro.
 */

// Cache de módulo — evita reprocessar a mesma URL repetidamente
const _urlCache = new Map<string, string>();

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
  if (_urlCache.has(url)) return _urlCache.get(url)!;

  let result = url;
  // Dropbox support
  if (url.includes("dropbox.com") || url.includes("dropboxusercontent.com")) {
    try {
      const dbUrl = new URL(url);
      // Sempre removemos o parâmetro dl que pode forçar preview ou download
      dbUrl.searchParams.delete("dl");
      // Forçamos o parâmetro raw=1 que é a forma moderna de obter o arquivo direto
      dbUrl.searchParams.set("raw", "1");
      // O host dl.dropboxusercontent.com é MANDATÓRIO para evitar erros de CORS (Access-Control-Allow-Origin)
      // ao usar atributos como crossOrigin="anonymous" no navegador.
      dbUrl.host = "dl.dropboxusercontent.com";
      return dbUrl.toString();
    } catch (e) {
      // Fallback robusto se a URL for malformada
      return url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace("dl=0", "raw=1")
        .replace("dl=1", "raw=1");
    }
  }

  _urlCache.set(url, result);
  return result;
}
