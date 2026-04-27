import type { MetadataRoute } from "next";

const BASE = "https://ankh.eg";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/calculator"];
  const locales = ["ar", "en"];
  return routes.flatMap(r => locales.map(l => ({ url: `${BASE}/${l}${r}`, lastModified: new Date() })));
}
