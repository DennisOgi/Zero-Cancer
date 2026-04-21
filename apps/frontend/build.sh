#!/bin/bash
set -e

echo "Starting build process with Node $(node --version)..."

# Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

echo "Using pnpm version: $(pnpm --version)"

# Clean any existing installations
rm -rf node_modules

# Install dependencies with pnpm (project uses pnpm-lock.yaml)
pnpm install --frozen-lockfile || pnpm install

echo "Dependencies installed, starting build..."

# Build the project
pnpm run build

echo "Build completed successfully!"