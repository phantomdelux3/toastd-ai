import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

// Makes Cloudflare bindings (vars/secrets/etc.) available during `next dev`.
initOpenNextCloudflareForDev();

export default nextConfig;
