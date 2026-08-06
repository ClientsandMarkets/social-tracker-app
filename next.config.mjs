/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ships readable browser source maps in production. Deliberate tradeoff:
  // the app has no server secrets in client bundles (the Postgres/Blob
  // credentials never leave the API routes), so this trades a bit of
  // source-code opacity for actually-debuggable production stack traces.
  productionBrowserSourceMaps: true,
};
export default nextConfig;
