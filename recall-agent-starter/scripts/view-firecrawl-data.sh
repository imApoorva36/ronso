#!/bin/bash

# Script to view FireCrawl data files
# Lists all scraped data files and allows viewing them

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if data directory exists
if [ ! -d "data" ]; then
  echo "Error: data directory not found."
  exit 1
fi

# Count JSON files in data directory
JSON_FILES=$(find data -name "firecrawl_data_*.json" | sort -r)
FILE_COUNT=$(echo "$JSON_FILES" | grep -c "^")

# Display header
echo "==============================================="
echo "FireCrawl Data Viewer"
echo "==============================================="

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "No FireCrawl data files found in data directory."
  echo "Run ./scripts/simple-firecrawl.sh to generate data."
  exit 0
fi

echo "Found $FILE_COUNT FireCrawl data files:"
echo

# List files with numbers
COUNT=1
while IFS= read -r file; do
  # Extract timestamp from filename
  TIMESTAMP=$(basename "$file" | sed -E 's/firecrawl_data_(.*)\.json/\1/')
  
  # Get file size
  SIZE=$(du -h "$file" | awk '{print $1}')
  
  # Get metadata from file
  SOURCE_COUNT=$(grep -o '"sourceCount":[^,]*' "$file" | head -1 | cut -d ':' -f 2)
  SUCCESS_COUNT=$(grep -o '"successCount":[^,]*' "$file" | head -1 | cut -d ':' -f 2)
  SAMPLE_DATA=$(grep -o '"usingSampleData":[^,}]*' "$file" | head -1 | cut -d ':' -f 2)
  
  SAMPLE_NOTE=""
  if [ "$SAMPLE_DATA" = "true" ]; then
    SAMPLE_NOTE=" (sample data)"
  fi
  
  echo "[$COUNT] $(date -r "$file" "+%Y-%m-%d %H:%M:%S") - $SIZE - Sources: $SUCCESS_COUNT/$SOURCE_COUNT$SAMPLE_NOTE"
  COUNT=$((COUNT + 1))
done <<< "$JSON_FILES"

echo
echo "Enter file number to view (or q to quit):"
read -r SELECTION

# Exit if user chooses to quit
if [[ "$SELECTION" == "q" || "$SELECTION" == "Q" ]]; then
  exit 0
fi

# Validate selection
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt "$FILE_COUNT" ]; then
  echo "Invalid selection."
  exit 1
fi

# Get selected file
SELECTED_FILE=$(echo "$JSON_FILES" | sed -n "${SELECTION}p")

# Display file content
echo
echo "==============================================="
echo "File: $SELECTED_FILE"
echo "==============================================="
echo

# Check if jq is available, use it for pretty printing if so
if command -v jq &> /dev/null; then
  jq . "$SELECTED_FILE" | less
else
  # Fallback to cat/less if jq is not available
  cat "$SELECTED_FILE" | less
fi 