/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },

    // Pacotes que devem ser tratados como externos no bundle serverless.
    // @react-pdf/renderer carrega fontes e assets via sistema de arquivos
    // em runtime — fazer bundle quebra essa resolução no Lambda/Vercel.
    // sharp e pdfkit também dependem de binários nativos ou assets externos.
    serverComponentsExternalPackages: [
      "sharp",
      "@react-pdf/renderer",
      "@react-pdf/layout",
      "@react-pdf/font",
      "pdfkit",
    ],
  },
};

export default nextConfig;
