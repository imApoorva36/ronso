#!/bin/bash

# Script to run the crypto data crawler
# Ensures proper setup and environment variables

# Navigate to project root
cd "$(dirname "$0")/.."

# Ensure environment variables are loaded
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  set -a
  source .env
  set +a
else
  echo "Warning: .env file not found"
fi

# Make sure necessary directories exist
mkdir -p data

# Check for required variables
if [ -z "$RECALL_PRIVATE_KEY" ]; then
  echo "Error: RECALL_PRIVATE_KEY is not set in .env file"
  exit 1
fi

if [ -z "$RECALL_BUCKET_ALIAS" ]; then
  echo "Error: RECALL_BUCKET_ALIAS is not set in .env file"
  exit 1
fi

# Check for optional FireCrawl API key
if [ -z "$FIRECRAWL_API_KEY" ]; then
  echo "Warning: FIRECRAWL_API_KEY is not set. Basic scraping will be used."
fi

# Display critical environment variables (masked for security)
echo "Using environment variables:"
echo "RECALL_PRIVATE_KEY: ${RECALL_PRIVATE_KEY:0:5}... (hidden)"
echo "RECALL_BUCKET_ALIAS: ${RECALL_BUCKET_ALIAS}"
echo "RECALL_NETWORK: ${RECALL_NETWORK:-testnet}"
echo "FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY:0:5}... (hidden)"

# Run the crawler using tsx
echo "Starting crypto data crawler..."
pnpm run crawl-crypto

# Check exit status
if [ $? -eq 0 ]; then
  echo "Crypto data crawling completed successfully!"
else
  echo "Crypto data crawling failed with error code $?"
  exit 1
fi 