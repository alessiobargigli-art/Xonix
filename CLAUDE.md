# Xonix

## Versioning

Every change to the app must bump the version number in lockstep across:

- `index.html`: `style.css?v=`, `game.js?v=`, the `#version` span in the header, and `.menu-version` in the main menu panel
- `sw.js`: the `VERSION` constant (also bumps the cache name and cache-busting query strings it builds)

Bump this even for changes that don't touch `style.css`/`game.js` directly (e.g. content-only changes like `backgrounds/themes.json`), since the version number is also how players/testers confirm they're on the latest deploy.
