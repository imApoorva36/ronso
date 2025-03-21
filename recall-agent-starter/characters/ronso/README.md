# Ronso: AI-Powered Cryptocurrency Debate Show

Ronso is an AI-powered debate show focused on cryptocurrency topics. The platform uses multiple specialized agents to create engaging, educational cryptocurrency debates with audience participation.

## 🚀 Overview

Ronso consists of seven specialized agents that work together to create an immersive debate experience:

1. **Topic Proposal Agent**: Collects and filters debate topic suggestions from the audience.
2. **Voting Manager Agent**: Manages off-chain voting for both topics and debate outcomes.
3. **Debate Moderator Agent**: Controls debate flow and ensures fair, structured discussions.
4. **Debating Bot Agents (Pro & Con)**: Present compelling arguments for their assigned positions.
5. **Audience Interaction Agent**: Engages with viewers, answers questions, and explains concepts.
6. **Data Integration Agent**: Retrieves and processes cryptocurrency data from Recall Network.
7. **Ronso Orchestrator**: Coordinates all agents and manages transitions between debate phases.

## 💾 Recall Network Integration

The Ronso platform heavily utilizes Recall Network for:

- Storing debate history and audience preferences
- Retrieving real-time cryptocurrency market data
- Maintaining persistent memory of past debates and arguments
- Providing fact-based references for debate arguments

## 🔧 Setup Instructions

### 1. Configure Environment

1. Copy the `.env.example` file to `.env`
2. Fill in your Recall API credentials:

```
RECALL_PRIVATE_KEY="your-private-key"
RECALL_BUCKET_ALIAS="ronso-debate-data"
RECALL_COT_LOG_PREFIX="ronso/"
OPENAI_API_KEY="your-api-key"
```

3. Optionally, customize sync intervals and network:

```
RECALL_SYNC_INTERVAL="120000"
RECALL_BATCH_SIZE="4"
RECALL_NETWORK="testnet"
```

### 2. Run the Agents

To run a specific agent, use:

```bash
pnpm start --characters="characters/ronso/[agent-name].character.json"
```

For example, to run the Topic Proposal Agent:

```bash
pnpm start --characters="characters/ronso/topic-proposal-agent.character.json"
```

To run the complete Ronso platform with all agents:

```bash
pnpm start --characters="characters/ronso/ronso-orchestrator.character.json"
```

## 🔄 Debate Flow

1. **Topic Collection**: The Topic Proposal Agent gathers audience suggestions.
2. **Voting**: The Voting Manager Agent runs a voting period to select the debate topic.
3. **Data Preparation**: The Data Integration Agent fetches relevant information.
4. **Debate Structure**:
   - Opening statements (2 minutes each)
   - Cross-examination (1 min question, 2 min response)
   - Rebuttal round (2 minutes each)
   - Closing arguments (2 minutes each)
5. **Audience Vote**: Viewers vote on which side presented the more convincing case.
6. **Results & Wrap-up**: The Voting Manager announces results and the Moderator concludes.

## 🌐 Deploying to Autonome

After testing and refining the agents locally, they can be deployed to Autonome for public access:

1. Ensure all agents are functioning correctly locally
2. Follow Autonome's deployment documentation for each agent
3. Configure agent communication patterns in Autonome
4. Set up public endpoints for audience interaction

## 📋 Agent Descriptions

### Topic Proposal Agent
Collects topic suggestions from the audience, filters them based on relevance and quality, and shortlists the best ones for voting.

### Voting Manager Agent
Manages the off-chain voting system for both debate topics and debate outcomes. Collects votes, tallies them accurately, and determines winners.

### Debate Moderator Agent
Facilitates structured, engaging debates between two AI hosts on cryptocurrency topics. Controls debate flow, ensures equal speaking time, and maintains focus.

### DebateBotPro
Advocates for the affirmative/positive position on cryptocurrency topics, constructing compelling, fact-based arguments with data from Recall Network.

### DebateBotCon
Advocates for the negative/contrarian position on cryptocurrency topics, challenging common consensus with well-researched arguments.

### Audience Interaction Agent
Engages with viewers in real-time, answering questions about debate topics, explaining cryptocurrency concepts, and facilitating audience participation.

### Data Integration Agent
Retrieves, processes, and supplies relevant cryptocurrency data from Recall Network to other agents in the system. Provides unbiased, accurate market data.

### Ronso Orchestrator
Coordinates all agents to ensure a seamless user experience. Directs traffic between agents, triggers debate sequences, and manages transitions between phases. 