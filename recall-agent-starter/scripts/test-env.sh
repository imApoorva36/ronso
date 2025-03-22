#!/bin/bash

# Script to test loading environment variables

# Navigate to project root
cd "$(dirname "$0")/.."

echo "=== Testing Environment Variables ==="
echo ""

# Method 1: Using source .env
if [ -f .env ]; then
  echo "Method 1: Using source .env"
  set -a
  source .env
  set +a
  
  echo "RECALL_PRIVATE_KEY: ${RECALL_PRIVATE_KEY:0:5}... (hidden)"
  echo "RECALL_BUCKET_ALIAS: ${RECALL_BUCKET_ALIAS}"
  echo "RECALL_NETWORK: ${RECALL_NETWORK}"
  echo "FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY:0:5}... (hidden)"
  echo ""
else
  echo "Method 1: .env file not found"
  echo ""
fi

# Method 2: Using dotenv in TypeScript
echo "Method 2: Using dotenv in TypeScript"
pnpm run test-env
echo ""

# Method 3: Checking environment after npm run
echo "Method 3: Using env command after npm run"
pnpm run test-env > /dev/null
env | grep -E "RECALL_|FIRECRAWL_"
echo ""

echo "=== Test Complete ===" 