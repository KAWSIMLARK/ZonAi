/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
    // Inclut explicitement les snapshots data (lus via fs.readFileSync dans
    // les connecteurs CPTAQ / rôle / zonage TR). Sans cette directive, Next.js
    // ne détecte pas ces fichiers et Vercel les omet du bundle serverless.
    outputFileTracingIncludes: {
      "/api/lookup": [
        "./lib/data/cptaq-mauricie.geojson",
        "./lib/data/zonage-trois-rivieres.geojson",
        "./lib/data/role-mauricie.ndjson.gz",
      ],
      "/recherche": [
        "./lib/data/cptaq-mauricie.geojson",
        "./lib/data/zonage-trois-rivieres.geojson",
        "./lib/data/role-mauricie.ndjson.gz",
      ],
      "/terrain/[id]": [
        "./lib/data/cptaq-mauricie.geojson",
        "./lib/data/zonage-trois-rivieres.geojson",
        "./lib/data/role-mauricie.ndjson.gz",
      ],
    },
  },
};

export default nextConfig;
