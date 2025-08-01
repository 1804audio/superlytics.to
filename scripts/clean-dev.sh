#!/bin/bash

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Cache cleaned!"

echo "🚀 Starting development server..."
pnpm run dev