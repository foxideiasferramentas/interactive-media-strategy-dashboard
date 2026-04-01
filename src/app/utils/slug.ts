/**
 * Converte uma string em um slug seguro para URL.
 * Ex: "Nova Campanha 2025!" -> "nova-campanha-2025"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                     // Remove acentos (parte 1)
    .replace(/[\u0300-\u036f]/g, '')     // Remove acentos (parte 2)
    .replace(/\s+/g, '-')                // Substitui espaços por hifens
    .replace(/[^\w-]+/g, '')             // Remove caracteres especiais (não-alfanuméricos)
    .replace(/--+/g, '-')                // Remove hifens duplicados
    .replace(/^-+/, '')                  // Remove hifens no início
    .replace(/-+$/, '');                 // Remove hifens no fim
}
