import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Cho phép upload file Word/PDF dung lượng lớn (100MB + dự phòng multipart overhead)
      bodySizeLimit: "110mb",
    },
  },
};

export default nextConfig;
