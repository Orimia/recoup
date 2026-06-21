import type { MetadataRoute } from "next";

// Allow the public pitch/product pages; keep the operator console and API
// endpoints out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
  };
}
