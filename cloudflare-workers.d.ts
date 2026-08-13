declare module "cloudflare:workers" {
  // The runtime supplies binding-specific types; this starter has no D1 binding.
  export const env: { DB?: Parameters<typeof import("drizzle-orm/d1").drizzle>[0] };
}
