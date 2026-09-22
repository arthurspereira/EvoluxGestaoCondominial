/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },

  // Pacotes que devem ser tratados como externos no bundle serverless.
  // @react-pdf/renderer e suas dependências (pdfkit, fontkit) carregam
  // fontes e assets via filesystem em runtime — empacotar esses módulos
  // quebra a resolução de caminhos no Lambda/Vercel.
  // Nota: no Next.js 14+ esta chave fica no nível raiz, não em experimental.
  serverExternalPackages: [
    "sharp",
    "@react-pdf/renderer",
    "@react-pdf/layout",
    "@react-pdf/font",
    "pdfkit",
    "fontkit",
  ],
};

export default nextConfig;
