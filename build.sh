#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci

echo "🔧 Making vite executable..."
chmod +x node_modules/.bin/vite

echo "🔧 Cleaning previous build..."
rm -rf dist

echo "🔧 Building application..."
npm run build

echo "✅ Build completed successfully!"
