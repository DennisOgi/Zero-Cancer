#!/usr/bin/env node

import { cpSync, existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");
const frontendDistDir = join(rootDir, "apps", "frontend", "dist");
const backendFrontendDistDir = join(
  rootDir,
  "apps",
  "backend",
  "frontend-dist"
);

console.log("🔄 Copying frontend build to backend...");
console.log(`📁 Source: ${frontendDistDir}`);
console.log(`📂 Destination: ${backendFrontendDistDir}`);

// Check if frontend build exists
if (!existsSync(frontendDistDir)) {
  console.error(
    '❌ Frontend build directory not found. Run "pnpm --filter ./apps/frontend build" first.'
  );
  process.exit(1);
}

try {
  // Remove existing frontend-dist directory if it exists
  if (existsSync(backendFrontendDistDir)) {
    console.log("🗑️  Removing existing frontend-dist directory...");
    rmSync(backendFrontendDistDir, { recursive: true, force: true });
  }

  // Copy frontend build to backend
  console.log("📋 Copying files...");
  cpSync(frontendDistDir, backendFrontendDistDir, {
    recursive: true,
    force: true,
  });

  console.log("✅ Frontend build copied successfully!");
  console.log(
    `📂 Frontend assets are now available at: ${backendFrontendDistDir}`
  );
} catch (error) {
  console.error("❌ Error copying frontend build:", error.message);
  process.exit(1);
}
