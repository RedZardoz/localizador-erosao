/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // MapLibre GL often behaves better with single mount in strict mode
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
