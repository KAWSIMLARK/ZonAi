/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  // Inclut explicitement les snapshots data (lus via fs.readFileSync dans
  // les connecteurs CPTAQ / rôle / zonage TR) dans le bundle des routes
  // serveur. Sans cette directive, Next.js ne les détecte pas comme
  // dépendances et Vercel les omet du déploiement serverless.
  outputFileTracingIncludes: {
    "/api/lookup": ["./lib/data/**"],
    "/recherche": ["./lib/data/**"],
    "/terrain/[id]": ["./lib/data/**"],
  },
};

export default nextConfig;
