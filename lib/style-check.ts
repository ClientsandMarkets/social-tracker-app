// Style compliance check (PRD §7.1). Per the team's decision this is a soft
// warning, not a blocker — a post can move to Ready with violations present,
// the editor just sees what tripped and can choose to fix or override.

export type StyleWarning = {
  rule: string;
  message: string;
};

const TITLE_CASE_SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of",
  "on", "or", "per", "the", "to", "v", "vs", "via",
]);

function looksTitleCased(line: string): boolean {
  const words = line
    .replace(/[“”"‘’']/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return true; // too short to judge
  let checkable = 0;
  let ok = 0;
  words.forEach((w, i) => {
    const bare = w.replace(/[^A-Za-z]/g, "");
    if (!bare) return;
    const lower = bare.toLowerCase();
    if (i > 0 && TITLE_CASE_SMALL_WORDS.has(lower)) return; // small words may stay lowercase
    checkable++;
    if (bare[0] === bare[0].toUpperCase()) ok++;
  });
  if (checkable === 0) return true;
  return ok / checkable >= 0.8; // allow a little slack — this is a heuristic, not a parser
}

export function checkCaptionStyle(caption: string): StyleWarning[] {
  const warnings: StyleWarning[] = [];
  if (!caption || !caption.trim()) return warnings;

  if (/[—–]/.test(caption)) {
    warnings.push({
      rule: "no-em-dash",
      message: "Contains an em dash (—) or en dash (–) — house style avoids these.",
    });
  }

  if (caption.includes("&")) {
    // Flags any "&" used in place of "and" (a company name like "P&G" would
    // still trip this — it's a heuristic warning, not a blocking rule, so a
    // false positive just gets overridden).
    warnings.push({
      rule: "ampersand",
      message: "Contains \"&\" — house style prefers writing out \"and\".",
    });
  }

  // First non-empty line is treated as the headline for title-case checking.
  const firstLine = caption.split("\n").find((l) => l.trim());
  if (firstLine && !looksTitleCased(firstLine)) {
    warnings.push({
      rule: "title-case",
      message: "Headline line may not be in US title case — check capitalization.",
    });
  }

  return warnings;
}
