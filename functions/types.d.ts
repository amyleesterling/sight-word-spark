// Minimal Cloudflare Pages Functions typings so the project type-checks
// without pulling in @cloudflare/workers-types (which conflicts with DOM libs).

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}) => Response | Promise<Response>;

declare const caches: { default: { match(req: Request): Promise<Response | undefined>; put(req: Request, res: Response): Promise<void> } };
