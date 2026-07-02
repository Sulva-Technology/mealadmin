import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy.
 * - script-src 'unsafe-inline' is required by Next.js hydration inline scripts
 *   (no nonce plumbing yet); 'unsafe-eval' only in dev (webpack eval sourcemaps).
 * - style-src 'unsafe-inline' is required by recharts/motion inline styles.
 * - connect-src: same-origin (/api/proxy) plus Firebase installations/FCM
 *   registration endpoints used by web push. The browser never talks to
 *   Supabase or the backend API directly.
 * - worker-src 'self' for the FCM service worker.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://picsum.photos`,
  `font-src 'self' data:`,
  `connect-src 'self' https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://firebase.googleapis.com${isDev ? ' ws:' : ''}`,
  `worker-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join('; ');

/**
 * The FCM service worker importScripts() the Firebase compat SDK from gstatic,
 * so it needs its own CSP (a worker's CSP comes from its script's response
 * headers, and the global rule above would block the import).
 */
const swCsp = [
  `default-src 'self'`,
  `script-src 'self' https://www.gstatic.com`,
  `connect-src 'self' https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://firebase.googleapis.com https://fcm.googleapis.com`,
  `img-src 'self' data:`,
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Must come after the catch-all: for the same header key on the same
        // path, the last matching rule wins.
        source: '/firebase-messaging-sw.js',
        headers: [{ key: 'Content-Security-Policy', value: swCsp }],
      },
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
