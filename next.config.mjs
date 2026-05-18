/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    // Hold dynamic pages in the client router cache for 2 min; static for 10 min.
    // Re-navigating to a previously-visited tab is instant.
    staleTimes: { dynamic: 120, static: 600 },
    // Buttery crossfade between routes (CSS view-transition API).
    viewTransition: true,
  },
};
export default nextConfig;
