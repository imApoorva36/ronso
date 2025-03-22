#!/bin/bash

# Set script directory and ensure correct working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."  # Move to project root

# Ensure environment variables are loaded
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  set -a
  source .env
  set +a
else
  echo "Warning: .env file not found"
fi

# Set up variables
DATA_DIR="./data"
mkdir -p "$DATA_DIR"

# Check if environment variables are set
if [ -z "$RECALL_PRIVATE_KEY" ] || [ -z "$RECALL_BUCKET_ALIAS" ]; then
  echo "Error: Missing environment variables"
  echo "Please set the following environment variables:"
  echo "- RECALL_PRIVATE_KEY: Your private key for Recall Network"
  echo "- RECALL_BUCKET_ALIAS: Your bucket alias for Recall Network"
  echo ""
  echo "You can set them by creating a .env file or adding them to your environment"
  exit 1
fi

# Display critical environment variables (masked for security)
echo "Using environment variables:"
echo "RECALL_PRIVATE_KEY: ${RECALL_PRIVATE_KEY:0:5}... (hidden)"
echo "RECALL_BUCKET_ALIAS: ${RECALL_BUCKET_ALIAS}"
echo "RECALL_NETWORK: ${RECALL_NETWORK:-testnet}"

# Run the prepare debate data script using tsx
echo "Preparing debate data..."
pnpm run prepare-debate

# If a debate context key is printed, show instructions
DEBATE_KEY_FILE="$DATA_DIR/latest_debate_key.txt"
if [ -f "$DEBATE_KEY_FILE" ]; then
  DEBATE_KEY=$(cat "$DEBATE_KEY_FILE")
  echo ""
  echo "To start the debate, you can use either of these methods:"
  echo ""
  echo "Option 1: Run the command directly"
  echo "pnpm start --characters=\"characters/ronso/ronso-orchestrator.character.json\""
  echo ""
  echo "Option 2: Load the debate topic data first"
  echo "pnpm run load-debate-topic --topic=$DEBATE_KEY"
  echo ""
  echo "Option 2 is useful if you want to save the debate context locally before"
  echo "starting the debate, or if you want to use it later."
  echo ""
fi 