# QVAC-Toast-Speech-Generator

Enter an occasion, your relationship to the honoree, and a memory or two, get a short toast speech that uses those specific details. On-device AI, no cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:30109

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown. The GUI (`src/gui.js`) is a small HTTP server: the page POSTs the form fields to `/api/toast`, which calls `generate(modelId, { occasion, relationship, memories })` in `src/logic.js`.

## Example

**Input:** Occasion: `retirement` — Relationship: `work colleague of 15 years` — Memories: "he once drove two hours in a snowstorm to fix a client's server on Christmas Eve"

**Output:** "Fifteen years is a long time to work alongside someone, and in all that time, one story sums him up best: the year he drove two hours through a snowstorm on Christmas Eve just to fix a client's server, because he couldn't stand the thought of them starting the new year with a broken system..."

## Grounding & fallback

`isGrounded()` extracts the significant words from the memories you typed and requires the generated toast to reuse at least one of them, so the speech can't drift into a generic template that ignores the specific memory you gave it. If that check fails, or the toast looks unusable, `fallbackToast()` builds a toast that quotes the memory, occasion, and relationship directly.

## License

MIT
