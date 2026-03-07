import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
  // pdfkit usa fs y require dinámico — no bundlear con webpack
  serverExternalPackages: ['pdfkit'],
}

export default nextConfig
