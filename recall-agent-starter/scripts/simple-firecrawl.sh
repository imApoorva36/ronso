#!/bin/bash

# Script to run the simple FireCrawl scraper
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
if [ -z "$FIRECRAWL_API_KEY" ]; then
  echo "Error: FIRECRAWL_API_KEY is not set in .env file"
  exit 1
fi

# Display variable (masked for security)
echo "Using FireCrawl API key: ${FIRECRAWL_API_KEY:0:5}... (hidden)"

# Run the scraper
echo "Starting FireCrawl scraper..."
pnpm tsx scripts/simple-firecrawl.ts

# Check exit status
if [ $? -eq 0 ]; then
  echo "FireCrawl scraping completed successfully!"
else
  echo "FireCrawl scraping failed with error code $?"
  exit 1
fi 