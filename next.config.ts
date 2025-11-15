import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  // Only set assetPrefix if baseURL is defined and valid
  // This prevents 404 errors when baseURL is undefined during build
  ...(baseURL && typeof baseURL === "string" && baseURL.startsWith("http")
    ? { assetPrefix: baseURL }
    : {}),
};

export default nextConfig;
