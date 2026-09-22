# Xonix Cloudflare App

Unified Cloudflare deployment for Xonix.

- Static Xonix/PWA assets are served by Cloudflare Workers Static Assets from the repository root.
- `/api/images` is handled by the Worker and searches Pexels using the player's tags.
- `PEXELS_API_KEY` remains a Cloudflare secret and is never exposed to the browser.

## Deploy

From the `worker` directory:

1. `npm install`
2. `npx wrangler secret put PEXELS_API_KEY`
3. `npm run deploy`

The Worker configuration points its static-assets directory to `..`, so the same deployment publishes the game and API together.
