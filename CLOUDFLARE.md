# Xonix Cloudflare App

Xonix is deployed as one Cloudflare Worker application:

- the repository root contains the static game/PWA assets;
- `worker/src/index.js` handles `/api/images`;
- all other requests are served through the `ASSETS` binding;
- `PEXELS_API_KEY` is a Cloudflare secret and is never exposed to the browser.

Cloudflare Git deployments must use the repository root so the root `wrangler.toml` is discovered.

## Local/deploy

1. `npm install`
2. `npx wrangler secret put PEXELS_API_KEY`
3. `npm run deploy`

The `run_worker_first = ["/api/*"]` rule ensures API requests reach the Worker before static-asset routing.
