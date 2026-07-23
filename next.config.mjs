/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PGlite ships a WASM Postgres; keep it external so webpack doesn't bundle it.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
