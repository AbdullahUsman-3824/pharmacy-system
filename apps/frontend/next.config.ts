import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "*": ["node_modules/@next/env/**", "node_modules/@swc/helpers/**"],
  },
};

export default nextConfig;
