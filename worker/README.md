# Xonix Images Worker

Cloudflare Worker used by Xonix to search Pexels by the player's tags.

## Setup

1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login`
3. From this folder set the secret: `wrangler secret put PEXELS_API_KEY`
4. Set `ALLOWED_ORIGIN` in `wrangler.toml` to the Xonix GitHub Pages origin.
5. Deploy: `wrangler deploy`
6. In Xonix set localStorage key `xonix.remoteEndpoint` to the deployed Worker URL plus `/api/images`.

Example response contains image URL plus Pexels attribution metadata. The API key is never sent to the browser.
