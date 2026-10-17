import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output autocontido em .next/standalone — usado pela imagem Docker de
  // produção (ver Dockerfile) para não ter de copiar o node_modules completo.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(),
  },
}

export default nextConfig
