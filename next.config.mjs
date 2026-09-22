/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },

  // Trata esses pacotes como externos no bundle serverless: o Node.js os
  // resolve em runtime a partir de node_modules em vez de serem empacotados.
  // Necessário para @react-pdf/renderer (e sua cadeia pdfkit → fontkit) que
  // carregam fontes e assets via filesystem — empacotar quebra os caminhos.
  serverExternalPackages: [
    "sharp",
    "@react-pdf/renderer",
    "@react-pdf/layout",
    "@react-pdf/font",
    "@react-pdf/pdfkit",
    "pdfkit",
    "fontkit",
    "linebreak",
    "unicode-properties",
    "restructure",
  ],

  // Força o rastreador de arquivos do Next.js/Vercel a incluir os arquivos
  // de fontes do pdfkit no pacote de deploy. Sem isso o Lambda recebe o
  // node_modules mas sem os .cjs das fontes padrão (Helvetica, etc.).
  outputFileTracingIncludes: {
    "/api/relatorio": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
      "./node_modules/@react-pdf/pdfkit/js/standard-fonts/**/*",
      "./node_modules/@react-pdf/pdfkit/js/data/**/*",
    ],
  },

  webpack(config, { isServer }) {
    if (isServer) {
      // Garante que o webpack não tente resolver/empacotar o pdfkit e suas
      // dependências — deixa o Node.js cuidar disso em runtime.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        "pdfkit",
        "fontkit",
        "@react-pdf/pdfkit",
      ];
    }
    return config;
  },
};

export default nextConfig;
