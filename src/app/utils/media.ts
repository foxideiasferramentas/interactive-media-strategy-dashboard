/**
 * Normaliza URLs de mídia para acesso direto.
 * Suporta: Dropbox (converte para dl.dropboxusercontent.com)
 * Outros provedores podem ser adicionados aqui no futuro.
 */

// Cache de módulo — evita reprocessar a mesma URL repetidamente (máx 500 entradas)
const _urlCache = new Map<string, string>();
const URL_CACHE_MAX = 500;

/**
 * Retorna true se a URL aponta para um arquivo de vídeo direto (não YouTube).
 */
export function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = normalizeMediaUrl(url);
  // Se tem extensão de IMAGEM, definitivamente não é vídeo direto
  if (/\.(jpg|jpeg|png|gif|webp|avif|heic|tiff)(\?|$)/i.test(normalized)) return false;
  // Se tem extensão de vídeo, é vídeo.
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(normalized)) return true;
  // Se for Dropbox ou link raw/download e não for imagem, tratamos como vídeo
  const lower = url.toLowerCase();
  if (lower.includes("dropbox.com") || lower.includes("dropboxusercontent.com") || lower.includes("raw=1") || lower.includes("dl=1")) {
    return true; // Já descartamos imagens na linha 18
  }
  return false;
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

  if (_urlCache.size >= URL_CACHE_MAX) {
    _urlCache.delete(_urlCache.keys().next().value!);
  }
  _urlCache.set(url, result);
  return result;
}
