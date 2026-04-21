#!/bin/bash
set -e

echo "Starting build process with Node $(node --version)..."

# Clean any existing installations
rm -rf node_modules package-lock.json

# Install dependencies with optional packages included (needed for esbuild)
npm ci --include=optional --legacy-peer-deps --no-fund --no-audit

echo "Dependencies installed, starting build..."

# Build the project
npm run build

echo "Build completed successfully!"