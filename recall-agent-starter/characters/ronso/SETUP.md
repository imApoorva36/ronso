# Ronso Debate Platform Setup Guide

This document provides detailed instructions for setting up and running the Ronso AI-powered cryptocurrency debate platform.

## Prerequisites

- **Node.js**: Version 22 or higher is required
- **PNPM**: Version 9.15.4 or higher is recommended
- **Recall Network**: Access to the Recall Network with an API key

## Installation Steps

### 1. Install Node.js v22

#### Windows

1. Visit the [Node.js download page](https://nodejs.org/en/download/)
2. Download the Node.js v22.x Windows installer
3. Run the installer and follow the installation steps
4. Verify installation with:
   ```
   node -v
   ```

#### macOS/Linux

```bash
# Using nvm (Node Version Manager)
nvm install 22
nvm use 22
```

### 2. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your API keys:
   ```
   RECALL_PRIVATE_KEY="your-recall-private-key"
   RECALL_BUCKET_ALIAS="ronso-debate-data"
   RECALL_COT_LOG_PREFIX="ronso/"
   OPENAI_API_KEY="your-openai-api-key"
   ```

### 3. Install Dependencies

```bash
pnpm install
```

## Running the Agents

### Individual Agents

To run a specific agent:

```bash
pnpm start --characters="characters/ronso/[agent-name].character.json"
```

For example:

```bash
# Run the Topic Proposal Agent
pnpm start --characters="characters/ronso/topic-proposal-agent.character.json"

# Run the Debate Moderator Agent
pnpm start --characters="characters/ronso/debate-moderator-agent.character.json"
```

### Orchestrated System

To run the complete platform with the orchestrator:

```bash
pnpm start --characters="characters/ronso/ronso-orchestrator.character.json"
```

## Agent Interaction Flow

1. **Start with the Orchestrator**: The orchestrator manages all other agents
2. **Topic Collection**: Submit topic ideas to the Topic Proposal Agent
3. **Topic Voting**: Use the Voting Manager to select the debate topic
4. **Debate**: The Moderator coordinates the debate between Pro and Con bots
5. **Audience Engagement**: The Audience Interaction Agent answers questions
6. **Data Integration**: The Data Integration Agent provides real-time market data

## Troubleshooting

### Node.js Version Issues

If you encounter errors related to Promise.withResolvers or other Node.js compatibility issues:

```
TypeError: Promise.withResolvers is not a function
```

Make sure you're using Node.js v22 or higher:

```bash
node -v
```

If you're using an older version, update as described in the installation steps.

### Recall Network Connection Issues

If the agents cannot connect to Recall Network:

1. Verify your `RECALL_PRIVATE_KEY` is correctly set in `.env`
2. Ensure your account is registered with Recall Network
3. For testnet, make sure your address has been funded:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"address": "<your-evm-public-address>"}' https://faucet.node-0.testnet.recall.network/register
```

## Deploying to Autonome

Once the agents are functioning correctly locally, follow these steps to deploy on Autonome:

1. Create agent configurations in Autonome
2. Upload character definition files
3. Configure environment variables
4. Set up inter-agent communication
5. Test the deployed agents

## Additional Resources

- [Recall Network Documentation](https://docs.recall.network/)
- [Eliza Agent Framework](https://github.com/elizaos/eliza)
- [Autonome Platform](https://autonome.ai/)
