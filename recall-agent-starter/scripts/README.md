# Ronso Crypto Data & Debate Scripts

This directory contains scripts to crawl cryptocurrency data sources, extract debate topics, and prepare debate contexts for the Ronso AI debate platform.

## 📝 Prerequisites

Before using these scripts, ensure you have:

1. Set up your `.env` file in the project root with the following variables:
   - `RECALL_PRIVATE_KEY`: Your private key for the Recall Network
   - `RECALL_BUCKET_ALIAS`: The alias for your Recall bucket to store data (e.g., "ronso-debate-data")
   - `RECALL_NETWORK`: The network to use (optional, defaults to "testnet")
   - `FIRECRAWL_API_KEY`: API key for FireCrawl (optional, for better web scraping)

2. Installed all dependencies via `pnpm install`

## 🔄 Workflow

The typical workflow consists of two main steps:

1. **Crawl cryptocurrency data** - Scrapes data from various sources, generates topic proposals
2. **Prepare debate context** - Selects a topic and prepares the debate context for agents

## 🛠️ Available Scripts

### `crawl-crypto.sh`

Crawls cryptocurrency news sites and data sources to generate debate topics.

```bash
# Run the crypto data crawler
./scripts/crawl-crypto.sh
```

This script will:

1. Scrape data from predefined cryptocurrency sources
2. Discover additional relevant sources using FireCrawl (if API key is provided)
3. Generate topic proposals based on the scraped data
4. Store both raw data and topic proposals in your Recall bucket
5. Save a local copy in the `data/` directory for debugging

### `prepare-debate.sh`

Prepares a debate context from the stored data, selecting a topic for the debate agents to discuss.

```bash
# Prepare a debate on any topic
./scripts/prepare-debate.sh

# Prepare a debate on a specific category
./scripts/prepare-debate.sh "DeFi Protocols"
```

This script will:

1. Retrieve the latest crawled data from Recall
2. Select a debate topic (randomly or from the specified category)
3. Create a debate context with supporting data and market information
4. Store the debate context in Recall for agents to access
5. Save a local copy in the `data/` directory
6. Print instructions for starting the debate with the selected topic

### `load-debate-topic.ts`

This script loads a debate context directly from Recall and prepares it for use:

```bash
npx ts-node --transpileOnly scripts/load-debate-topic.ts --topic=debate_context_[timestamp]
```

Where `debate_context_[timestamp]` is the key of a previously created debate context in Recall.

### `clean.sh`

This utility script cleans up any temporary files created during the data crawling process.

Usage:
```bash
./scripts/clean.sh
```

## 🚀 Running a Debate

After running the `prepare-debate.sh` script, you'll get a command that looks something like this:

```bash
pnpm run load-debate-topic --topic=debate_context_[timestamp]
```

This command loads the debate context into your local environment and configures the Ronso Orchestrator agent to use this data. After running this command, you can start the debate with:

```bash
pnpm start --characters="characters/ronso/ronso-orchestrator.character.json"
```

You can also load a specific debate context directly:

```bash
pnpm run load-debate-topic --topic=<debate_context_key>
```

## 🔍 Customization

### Adding or Changing Data Sources

Edit `crawl-crypto-data.ts` to modify the `CRYPTO_DATA_SOURCES` array.

### Modifying Topic Categories

Edit `crawl-crypto-data.ts` to modify the `TOPIC_CATEGORIES` array.

### Adding Real-Time Market Data

In a production environment, you might want to enhance `prepareMarketData()` in `prepare-debate-data.ts` to fetch real-time cryptocurrency market data from an API.

## 🚨 Troubleshooting

### Network Issues

If you encounter network errors during crawling, the script will automatically retry with basic scraping for that source.

### Missing FireCrawl API Key

If the `FIRECRAWL_API_KEY` is not provided, the crawler will fall back to basic HTML scraping, which may be less accurate.

### No Data Found

If `prepare-debate.sh` fails with "No crawl metadata found", make sure to run `crawl-crypto.sh` first to generate the data.

## 📊 Data Storage

Data is stored in the following locations:

### Recall Network Storage

- Raw data: Keys prefixed with `crypto_data_`
- Topic proposals: Keys prefixed with `topic_proposals_`
- Crawl metadata: Keys prefixed with `crawl_meta_`
- Debate contexts: Keys prefixed with `debate_context_`

### Local Storage

- Raw data: `data/crypto_data_[timestamp].json`
- Topic proposals: `data/topic_proposals_[timestamp].json`
- Latest debate context: `data/current_debate_context.json` (when using `load-debate-topic.ts`)
- Character initialization: `data/debate_init.json` (when using `load-debate-topic.ts`)
- Character-specific init: `characters/ronso/init.json` (automatically loaded by the character)

## Simple FireCrawl Script

For simple web scraping without the Recall Network integration, you can use the standalone FireCrawl script:

```
./scripts/simple-firecrawl.sh
```

This script:
- Loads environment variables from `.env`
- Checks for the required `FIRECRAWL_API_KEY`
- Scrapes data from predefined crypto news sources
- Saves results to the `data/` directory as a timestamped JSON file
- Does not require Recall Network setup
- Falls back to sample data if API calls fail

Make sure your `.env` file contains a valid `FIRECRAWL_API_KEY`.

## Viewing FireCrawl Data

To view the data scraped by the simple FireCrawl script:

```
./scripts/view-firecrawl-data.sh
```

This interactive viewer:
- Lists all scraped data files (newest first)
- Shows file size, timestamp, and source counts
- Indicates if sample data was used
- Lets you select a file to view its contents
- Uses `jq` for pretty-printing if available 