/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Désactivé temporairement pour éviter les double-renders en dev
  // Configuration Turbopack vide (requis pour Next.js 16)
  turbopack: {},
  // Configuration des images pour permettre les domaines externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Configuration Webpack pour compatibilité
  webpack: (config, { isServer, dev }) => {
    // Optimisations pour le mode dev
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    // Exclure undici du bundle client et du transpiling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      };
      
      // Ignorer undici dans le client
      config.externals = config.externals || [];
      config.externals.push({
        'undici': 'commonjs undici'
      });
    }
    
    // Ignorer les erreurs de parsing pour undici
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    return config;
  },
}

module.exports = nextConfig

