#!/usr/bin/env bash
# exit on error
set -o errexit

echo "============================================="
echo "   J.A.S.P.E.R. RENDER CLOUD BUILD SCRIPT    "
echo "============================================="

echo "[1/3] Installing all dependencies..."
npm run install-all

echo "[2/3] Installing Chrome binary for Puppeteer / WhatsApp Web on Render..."
# Installs Chrome into .cache/puppeteer for WhatsApp Web QR code generation
npx puppeteer browsers install chrome || true

echo "[3/3] Building client production bundle..."
npm run build:client

echo "============================================="
echo "   J.A.S.P.E.R. BUILD COMPLETED SUCCESSFULLY "
echo "============================================="
