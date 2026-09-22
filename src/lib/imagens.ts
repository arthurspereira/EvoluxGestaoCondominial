// Redimensiona e comprime uma foto no próprio navegador antes do upload.
// Decisão registrada em evolux-arquitetura.md: foto de câmera moderna
// passa de 4MB; sem isso o cadastro trava em 4G e o PDF fica inviável.
const LADO_MAXIMO = 1600;
const QUALIDADE_WEBP = 0.8;

export interface ImagemComprimida {
  arquivo: File;
  largura: number;
  altura: number;
}

export async function comprimirImagem(
  original: File
): Promise<ImagemComprimida> {
  const bitmap = await criarBitmap(original);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível processar a imagem.");
  contexto.drawImage(bitmap, 0, 0, largura, altura);

  const blob = await new Promise<Blob | null>((resolver) =>
    canvas.toBlob(resolver, "image/webp", QUALIDADE_WEBP)
  );

  if (!blob) throw new Error("Não foi possível comprimir a imagem.");

  const nomeBase = original.name.replace(/\.[^.]+$/, "");
  const arquivo = new File([blob], `${nomeBase}.webp`, { type: "image/webp" });

  return { arquivo, largura, altura };
}

async function criarBitmap(arquivo: File): Promise<ImageBitmap> {
  // createImageBitmap lida melhor com orientação EXIF e é mais rápido
  // que <img> + FileReader; tem suporte amplo em navegadores mobile atuais.
  return createImageBitmap(arquivo);
}
