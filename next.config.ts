import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow proxy origin for dev assets when accessing via Caddy HTTPS on LAN
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ['https://192.168.0.99'],
};

export default nextConfig;
