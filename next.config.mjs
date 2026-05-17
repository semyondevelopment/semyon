/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    // Hold dynamic pages in the client router cache for 30s; static for 3 min.
    // Means tapping between tabs within these windows is instant (no roundtrip).
    staleTimes: { dynamic: 30, static: 180 },
  },
};
export default nextConfig;
