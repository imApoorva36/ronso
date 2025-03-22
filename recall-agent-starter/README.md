# Ronso Standalone API Server

A standalone API server for the Ronso crypto debate platform that generates high-quality crypto debates and topic suggestions.

## Overview

This server provides a simple, self-contained API for generating cryptocurrency debate content. It includes:

1. Expert topic generation using curated research data
2. Sophisticated debate script generation between two speakers
3. Character-based AI system that can be extended with new roles

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI API key with access to GPT models

### Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file based on `.env.example` and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
SERVER_PORT=3000
MEDIUM_OPENAI_MODEL=gpt-4o
```

4. Run the server:

```bash
npm start
# or
pnpm start
```

The server will start on port 3000 by default (can be changed in .env file) and will automatically try alternative ports if the primary port is in use.

## API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Get Available Characters

```
GET /characters
```

Response:

```json
{
  "characters": [
    {
      "id": "topic_proposal_agent",
      "name": "TopicProposalAgent"
    },
    {
      "id": "script_generator",
      "name": "ScriptGenerator"
    }
  ]
}
```

### Generate or Update Debate Script

```
POST /generate-script
Content-Type: application/json
```

#### For generating a new script:

```json
{
  "topic": "Are Central Bank Digital Currencies a threat to cryptocurrency decentralization?"
}
```

#### For updating an existing script with poll results:

```json
{
  "topic": "Are Central Bank Digital Currencies a threat to cryptocurrency decentralization?",
  "originalScript": {
    "topic": "Are Central Bank Digital Currencies a threat to cryptocurrency decentralization?",
    "script": [
      { "speaker": "speaker1", "text": "...existing pro argument..." },
      { "speaker": "speaker2", "text": "...existing con argument..." }
    ]
  },
  "pollResults": {
    "proArgumentsScore": 75,
    "conArgumentsScore": 25,
    "audienceComments": ["More technical details needed", "Good points on privacy"]
  }
}
```

Response:

```json
{
  "topic": "Are Central Bank Digital Currencies a threat to cryptocurrency decentralization?",
  "script": [
    {"speaker": "speaker1", "text": "...expert pro argument..."},
    {"speaker": "speaker2", "text": "...sophisticated con argument..."},
    ...
  ]
}
```

### Get Topic Suggestions

```
GET /topics
```

Response:

```json
{
  "suggestions": [
    "Will Bitcoin's fixed supply model prove superior to central bank digital currencies?",
    "Should DeFi protocols implement KYC measures to gain mainstream adoption?",
    "Are layer-2 scaling solutions a temporary fix or the long-term future?",
    "Should DAOs have legal recognition equivalent to traditional corporations?",
    "Is Ethereum's transition to proof-of-stake a compromise of core principles?"
  ],
  "source": "openai_numbered_list",
  "baseTopic": "Latest crypto regulations and policy changes"
}
```

### Chat with Character

```
POST /chat
Content-Type: application/json

{
  "character": "topic_proposal_agent",
  "message": "What are some controversial topics in DeFi?"
}
```

Response:

```json
{
  "response": "Several controversial topics in DeFi include: 1) Regulatory compliance vs. decentralization, 2) Oracle manipulation risks, 3) Governance token concentration, 4) MEV extraction ethics, and 5) Insurance mechanisms for protocol exploits.",
  "character": "topic_proposal_agent"
}
```

## Docker Support

The server includes Docker support for containerized deployment:

### Building and Running Locally

Navigate to the `recall-agent-starter` directory first:

```bash
cd recall-agent-starter
```

Build the Docker image:

```bash
docker build -t ronso .
```

Run the container:

```bash
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here --name ronso-container ronso
```

### Testing the Docker Container

You can test the API endpoints from outside the container:

```bash
# Test the health endpoint
curl http://localhost:3000/health

# Test the characters endpoint
curl http://localhost:3000/characters

# Test the topics endpoint
curl http://localhost:3000/topics
```

Or you can exec into the container and test from inside:

```bash
# Access the container's shell
docker exec -it ronso-container /bin/sh

# Inside the container, test endpoints with wget
wget -qO- http://localhost:3000/health
wget -qO- http://localhost:3000/characters
wget --header="Content-Type: application/json" --post-data='{"topic": "DeFi regulation"}' http://localhost:3000/generate-script -O -
```

### Pushing to Docker Hub

```bash
# Tag your image with your Docker Hub username
docker tag ronso imapoorva/ronso:latest

# Login to Docker Hub
docker login

# Push the image to Docker Hub
docker push imapoorva/ronso:latest
```

## Features

- **Research-Driven Topics**: Uses curated research data to generate relevant debate topics
- **Expert-Level Content**: Generates sophisticated debate scripts with technical depth
- **Script Update Capability**: Can improve scripts based on audience feedback and poll results
- **Robust Error Handling**: Automatically attempts alternative ports if the primary port is in use
- **Flexible Response Parsing**: Extracts structured information even when API responses vary in format

## Architecture

The server is built with:

- Express.js for the API framework
- OpenAI SDK for LLM interaction
- Character-based system that can be extended with new JSON character files

## Adding New Characters

Place new character definition files in the `characters/ronso/` directory using the `.character.json` format. The system will automatically load them at startup.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `SERVER_PORT`: Port to run the server on (default: 3000)
- `MEDIUM_OPENAI_MODEL`: OpenAI model to use (default: gpt-4o)
