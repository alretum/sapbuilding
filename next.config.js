/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We run a custom server (server.ts) to host Socket.IO alongside Next.
  // Pin the Turbopack root to this project so it doesn't infer a parent
  // workspace from other lockfiles on the machine.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
