# GTA VI Trophy Guide

[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline, framework-free GTA VI field guide covering all 55 trophies: unlock steps, difficulty and time, categories, missable flags, ordered platinum roadmap and per-trophy sources. Trophy data ships locally in `app/data/trophies.json`.

Run:
- `node main.ts` builds the static site in `out/` (override with `MAKEFUN_OUTPUT_DIR`).
- `node serve.ts` serves the app at http://localhost:8080 (override with `PORT`).

Open the guide to filter by category, status, missable or online flags; search by name/description; hide spoiler steps; mark trophies done; and expand a source into its full guide. Status persists in localStorage. `node serve.ts --shot name` captures the two documented screenshots.

Every claim is a question about the game; travel time is map distance over assumed speed, not a rival gather. This is player help, not a competitive edge.
