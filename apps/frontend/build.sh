#!/bin/bash
set -e

echo "Starting build process with Node $(node --version)..."

# Clean any existing installations
rm -rf node_modules package-lock.json

# Set npm config to ignore scripts
export NPM_CONFIG_IGNORE_SCRIPTS=true
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false

# Install dependencies with aggressive flags
npm install --legacy-peer-deps --no-optional --no-fund --no-audit --prefer-offline

# Try to install the missing rollup package specifically
npm install @rollup/rollup-linux-x64-gnu --no-save --legacy-peer-deps || echo "Rollup native package install failed, continuing..."

echo "Dependencies installed, starting build..."

# Build the project
npm run build

echo "Build completed successfully!"