/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // sharp usa binários nativos — precisa ser externo para não ser
    // empacotado pelo webpack no bundle serverless.
    // Nota: no Next.js 14 esta chave ainda fica dentro de experimental.
    serverComponentsExternalPackages: ["sharp"],
  },
};

export default nextConfig;
