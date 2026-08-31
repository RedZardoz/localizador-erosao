/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // MapLibre GL often behaves better with single mount in strict mode
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
