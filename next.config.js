/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  // WP-D6-06 (OKF-TOGAF#160): lint reports and refuses nothing. The code gate
  // in prebuild prints its counts; Next would otherwise lint again and refuse
  // the build on an error.
  eslint: { ignoreDuringBuilds: true },
  // OKF-TOGAF#205: lib/model-parser.js, the family parser vendored byte for byte, requires
  // "fs" for its command-line use only. lib/models.js reaches the browser bundle through the
  // deep-dive pages' dimension-order constants, so there "fs" resolves to nothing; the parser
  // runs only at build time, in getStaticProps, where Node provides it.
  webpack(config, { isServer }) {
    if (!isServer) config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false };
    return config;
  },
  // Issue #13: /models/** pages are static (getStaticProps) but their
  // content is fetched at build time from a separate repo and changes
  // with every deploy -- Vercel's default edge cache for prerendered
  // pages can outlive a deploy on some edges (observed: sfo1 tracked
  // this correctly, but a user reported stale content across two
  // machines/browsers with local cache flushed, which client-side
  // cache-busting can't fix). Short s-maxage + stale-while-revalidate
  // means any edge is at most ~30s behind instead of holding a page
  // indefinitely between deploys.
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=30, stale-while-revalidate=59" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
