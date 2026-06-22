/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We run a custom server (server.ts) to host Socket.IO alongside Next.
  // No special config needed here for that — `next build` stays standard.
};

module.exports = nextConfig;
