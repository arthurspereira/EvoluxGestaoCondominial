/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  
    serverComponentsExternalPackages: ["sharp"],

    outputFileTracingIncludes: {
      "/api/relatorio/route": ["./node_modules/pdfkit/js/standard-fonts/*/"],
    },
  },
};

export default nextConfig;
