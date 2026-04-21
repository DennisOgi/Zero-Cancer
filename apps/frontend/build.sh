#!/bin/bash
set -e

echo "Starting build process..."

# Clean any existing installations
rm -rf node_modules package-lock.json

# Set npm config to ignore scripts
export NPM_CONFIG_IGNORE_SCRIPTS=true
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false

# Install dependencies with aggressive flags
npm install --legacy-peer-deps --no-optional --no-fund --no-audit --prefer-offline

echo "Dependencies installed, starting build..."

# Build the project
npm run build

echo "Build completed successfully!"