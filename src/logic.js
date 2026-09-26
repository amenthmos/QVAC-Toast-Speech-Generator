// QVAC Toast Speech Generator — core logic.
// Turns an occasion + relationship + specific memories into a short toast
// speech that actually uses those details, not a generic template.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 15) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "not enough information"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function stripPreamble(text) {
  return text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .replace(/^sure[,!]?\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function significantWords(str) {
  const STOP = new Set([
    "the", "and", "for", "with", "that", "this", "from", "have", "has",
    "their", "they", "them", "when", "where", "about", "over", "your",
  ]);
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

function isGrounded(text, memories) {
  const inputWords = new Set(significantWords(memories));
  if (inputWords.size === 0) return true;
  const outputWords = new Set(significantWords(text));
  let overlap = 0;
  for (const w of inputWords) if (outputWords.has(w)) overlap++;
  return overlap >= 1;
}

function fallbackToast(occasion, relationship, memories) {
  return (
    `To an unforgettable ${occasion.trim()}. As ${relationship.trim()}, I've had a front-row seat to who they ` +
    `really are — and one thing I'll never forget is ${memories.trim()}. That's exactly who they are: someone ` +
    `who makes moments like that stick with you. So please raise your glass with me — to celebrating today, ` +
    `and to everything still ahead.`
  );
}

export async function generate(modelId, { occasion, relationship, memories }) {
  const occ = (occasion || "").trim();
  const rel = (relationship || "").trim();
  const mem = (memories || "").trim();
  if (!occ || !rel || !mem) {
    return { error: "Please fill in the occasion, your relationship, and at least one memory." };
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write short, warm toast speeches (5-8 sentences) for real occasions. Given the occasion, the " +
          "speaker's relationship to the honoree, and 1-2 specific memories or facts, write a toast that actually " +
          "weaves in those specific details rather than staying generic. Reply with ONLY the toast speech, no preamble.",
      },
      {
        role: "user",
        content:
          "Occasion: retirement\nRelationship: work colleague of 15 years\nMemories: he once drove two hours in a snowstorm to fix a client's server on Christmas Eve",
      },
      {
        role: "assistant",
        content:
          "Fifteen years is a long time to work alongside someone, and in all that time, one story sums him up best: " +
          "the year he drove two hours through a snowstorm on Christmas Eve just to fix a client's server, because he " +
          "couldn't stand the thought of them starting the new year with a broken system. That's who he's always been — " +
          "showing up when it actually mattered, snowstorm or not. Retirement means we lose that every day, but we get " +
          "to keep the stories. So please join me in raising a glass to a career built on quietly doing the right thing. Cheers.",
      },
      { role: "user", content: `Occasion: ${occ}\nRelationship: ${rel}\nMemories: ${mem}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.8, maxTokens: 300 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = stripPreamble(text);

  const toast = (!looksUnusable(text) && isGrounded(text, mem)) ? text : fallbackToast(occ, rel, mem);

  return { toast };
}
