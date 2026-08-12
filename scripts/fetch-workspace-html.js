// Pulls app/workspace.html from its GitHub source of truth immediately
// before `next build` runs. This file is ~112KB of self-contained
// HTML/CSS/JS (the whole "Team Workspace" UI) — far larger than what can
// reliably be inlined into a single deploy call, so instead of shipping it
// as part of the deploy payload, the build fetches the exact byte-for-byte
// content from the repo at build time. Any update to workspace.html should
// be pushed to this repo/branch before redeploying.
const https = require("https");
const fs = require("fs");
const path = require("path");

const RAW_URL =
  "https://raw.githubusercontent.com/ClientsandMarkets/social-tracker-app/master/app/workspace.html";
const DEST = path.join(process.cwd(), "app", "workspace.html");

https.get(RAW_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to fetch workspace.html: HTTP ${res.statusCode}`);
    process.exit(1);
  }
  const chunks = [];
  res.on("data", (c) => chunks.push(c));
  res.on("end", () => {
    fs.writeFileSync(DEST, Buffer.concat(chunks));
    console.log(`Fetched workspace.html (${Buffer.concat(chunks).length} bytes)`);
  });
}).on("error", (e) => {
  console.error("Failed to fetch workspace.html:", e.message);
  process.exit(1);
});
