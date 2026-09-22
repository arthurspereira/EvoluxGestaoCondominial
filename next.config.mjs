/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },

  // sharp usa binários nativos — precisa ser externo para não ser
  // empacotado pelo webpack do Next.js no bundle serverless.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
