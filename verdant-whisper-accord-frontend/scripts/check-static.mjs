"use strict";

import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCAN_DIRS = ["app", "components", "hooks", "lib"];

const BANNED_PATTERNS = [
  { regex: /getServerSideProps/, message: "SSR hook getServerSideProps detected." },
  { regex: /getStaticProps/, message: "getStaticProps usage is not allowed." },
  { regex: /getInitialProps/, message: "getInitialProps is not supported for static export." },
  { regex: /from\s+["']next\/server["']/, message: "Importing from next/server is not permitted." },
  { regex: /from\s+["']next\/headers["']/, message: "Importing from next/headers breaks static export." },
  { regex: /createServerComponentClient/, message: "Server component helpers detected." },
  { regex: /export\s+const\s+dynamic\s*=/, message: "Dynamic route export detected." },
  { regex: /export\s+const\s+revalidate\s*=/, message: "Incremental revalidate not allowed." },
];

async function gatherFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await gatherFiles(fullPath)));
    } else if (/\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function run() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(ROOT, dir);
    try {
      const collected = await gatherFiles(fullDir);
      files.push(...collected);
    } catch (error) {
      // Ignore missing directories
    }
  }

  const violations = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    for (const rule of BANNED_PATTERNS) {
      if (rule.regex.test(content)) {
        violations.push({ file, message: rule.message });
      }
    }
  }

  if (violations.length > 0) {
    console.error("[check-static] Static export violations detected:");
    for (const violation of violations) {
      console.error(` - ${violation.file}: ${violation.message}`);
    }
    process.exit(1);
  } else {
    console.log("[check-static] Static export checks passed.");
  }
}

await run();


