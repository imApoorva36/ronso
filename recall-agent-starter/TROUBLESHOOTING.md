# Troubleshooting Guide

This document provides solutions to common issues encountered when running the crypto data crawler and debate preparation scripts.

## Environment Variables

The scripts require environment variables to be set correctly:

- `RECALL_PRIVATE_KEY`: Your private key for the Recall Network
- `RECALL_BUCKET_ALIAS`: Your bucket alias for the Recall Network
- `RECALL_NETWORK`: The Recall Network to use (defaults to "testnet")
- `FIRECRAWL_API_KEY`: Optional API key for enhanced web scraping

These variables should be set in a `.env` file in the project root.

## TypeScript Execution Issues

If you encounter issues running the TypeScript scripts:

1. Make sure you have all dependencies installed:
   ```bash
   pnpm install
   ```

2. The project uses `tsx` to run TypeScript files directly. If you get module errors, try installing any missing dependencies:
   ```bash
   pnpm add dotenv axios
   ```

3. If you see errors like `Unknown file extension ".ts"`, make sure `tsx` is installed:
   ```bash
   pnpm add -D tsx
   ```

## Recall Network Errors

If you encounter errors related to the Recall Network:

1. **"Event MachineInitialized not found"**: This is an issue with the Recall client library. Make sure you have the correct version of the Recall SDK and that your private key is correctly formatted.

2. **Bucket creation issues**: If you have trouble creating a bucket, check that:
   - Your private key has the necessary permissions
   - The bucket alias is not already in use
   - The network you're connecting to is operational

3. **Network connectivity**: Ensure you have internet access and can reach the Recall Network.

## Data Scraping Issues

If the script fails during the data scraping phase:

1. **Missing FireCrawl API key**: If you don't have a FireCrawl API key, the script will fall back to basic scraping, which may be less effective.

2. **Rate limiting**: If you encounter rate limiting issues, try reducing the number of sources or adding delays between requests.

3. **Blocked requests**: Some sites may block automated scraping. Consider using a VPN or adjusting the user agent.

## Debate Preparation Issues

If you have issues preparing debates:

1. **Missing data**: Ensure the crypto data crawling step completed successfully first.

2. **Topic generation failures**: These could be due to insufficient or low-quality scraped data.

## Running the Scripts Manually

If the shell scripts are giving you trouble, you can run the TypeScript files directly:

```bash
# To crawl crypto data
pnpm run crawl-crypto

# To prepare a debate
pnpm run prepare-debate

# To load a debate topic
pnpm run load-debate-topic --topic=<debate_context_key>
```

## Debug Logging

To get more detailed logs, modify the scripts to enable debug logging or try running them with increased verbosity.

## FireCrawl API Issues

The FireCrawl API may return 404 errors due to:

1. API endpoint or authentication method changes
2. Invalid API key
3. Temporary service disruption

When using the `simple-firecrawl.sh` script, it will automatically fall back to sample data if the API calls fail. This allows you to test the functionality without a working API key.

If you're using `crawl-crypto.sh` and experiencing similar issues, try:

1. Checking your API key in the `.env` file
2. Verifying with FireCrawl documentation if the API authentication method has changed
3. Using the `simple-firecrawl.sh` script as an alternative for testing purposes 