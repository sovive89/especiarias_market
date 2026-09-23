/**
 * Transforma a foto escolhida pelo usuário em uma imagem menor (JPEG, até 800 px)
 * e devolve como "data URL" (a imagem escrita como texto), pronta para salvar.
 *
 * Por que reduzir? Foto de celular tem 3–5 MB. Sem banco de dados, a foto fica
 * guardada no navegador, que aceita poucos MB no total. Reduzida fica com ~80 KB.
 * Quando houver backend, aqui entra o upload para um storage (ex.: Supabase Storage)
 * e o produto guarda só o link.
 */
export async function fileToCompressedDataUrl(file: File, maxSize = 800, quality = 0.82) {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** Imagem neutra para produto sem foto (SVG embutido, não depende de arquivo). */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#e8eef1"/><g fill="none" stroke="#9aa9b2" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><rect x="110" y="120" width="180" height="150" rx="18"/><circle cx="165" cy="175" r="18"/><path d="M125 255l55-55 40 40 25-25 45 40"/></g></svg>`,
  );
