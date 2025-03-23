# Ronso

**🏆 The world's first fully AI-powered crypto debate show, bringing expert-level discourse to the masses! 🏆**

Ronso is a cutting-edge platform that revolutionizes how crypto enthusiasts engage with complex topics through dynamic AI-driven debates, voice synthesis, and audience-responsive content.

## Team

- [**Apoorva Agrawal**](https://www.linkedin.com/in/apoorva-agrawal-8302b825a/)
- [**Mardav Gandhi**](https://www.linkedin.com/in/mardav-gandhi/)
- [**Ayush Kumar Singh**](https://www.linkedin.com/in/ayush45/)

## Problem Statement

The cryptocurrency space presents unique challenges for meaningful discourse and education:

- Technical discussions often remain inaccessible to broader audiences.
- Perspectives on controversial topics tend to cluster in community-specific channels.
- Many platforms lack mechanisms to incorporate audience feedback into evolving discussions.
- Educational resources rarely present multiple viewpoints with equal technical depth.
- Engaging with complex topics requires significant time investment from both creators and audiences.

## Overview

Ronso is a revolutionary crypto debate show platform powered entirely by AI agents. Our system:

- Creates compelling, technically accurate crypto debates with no human intervention.
- Features realistic voice-synthesized "personalities" representing different viewpoints.
- Integrates with Twitter/X for real-time audience polling that directly influences debate direction.
- Dynamically adapts content based on audience feedback and interest.
- Leverages cutting-edge decentralized infrastructure for scalability and transparency.

## Value Proposition

Ronso transforms how the crypto community engages with complex topics by:

- **Democratizing Expert Knowledge**: Making high-quality, balanced crypto debates accessible to everyone.
- **Increasing Engagement**: Creating compelling multimedia content that drives participation.
- **Enabling Collective Intelligence**: Aggregating community feedback to continuously improve debate quality.
- **Breaking Echo Chambers**: Presenting multiple perspectives on controversial topics.
- **Building Trust**: Ensuring transparency through a robust methodology and decentralized infrastructure.

## System Architecture

![diagram-export-3-23-2025-6_23_36-PM](https://github.com/user-attachments/assets/86c463c8-64a1-42c4-b3b9-26016480164a)

## Features

- **AI Crypto Newsroom**: AI-driven debates on trending crypto topics with realistic voice synthesis.
- **Topic Generation**: Intelligent suggestions of controversial and relevant crypto debate topics.
- **Interactive Twitter/X Polling**: Real-time audience participation via Twitter polls that dynamically influence debate direction.
- **Adaptive Content**: Debates that evolve based on audience feedback and sentiment analysis.
- **Voice Synthesis**: High-quality voice generation for debate participants.
- **Decentralized Storage**: Persistent storage of debate content and user interactions.
- **Privacy-Preserving Authentication**: A secure and user-friendly authentication experience.

## Sponsor Track Integrations

### Recall Network

We leverage Recall Network's and Eliza's agent infrastructure to generate expert-level debate content. Our implementation demonstrates how the Recall agent-starter repository utilizes Eliza and our character agents to create sophisticated industry-specific content with minimal latency.

### Autonome

Ronso integrates Autonome's decentralized agent deployment capabilities for our debate generation system. Our custom agents (ronso-agent) are deployed on Autonome, accessible via a user-friendly interface at [Autonome Interface](https://dev.autonome.fun/autonome/new?template=d9c98f0f-8ba7-4570-9672-e631aeffb7f1). This approach enables seamless scaling of our AI capabilities while maintaining robust security and performance.

### Privy

We utilize Privy's authentication system to provide users with a seamless onboarding experience while maintaining the security standards required for blockchain interactions. This implementation showcases how traditional UX can be maintained while leveraging Web3 capabilities.

### Nethermind

Our platform uses Nethermind's infrastructure to handle the contract interactions and data storage needs of our voting and reputation systems, demonstrating practical applications of their technology for social platforms.

## Setup Instructions

### recall-agent-starter Setup

```bash
cd recall-agent-starter

cp .env.example .env

pnpm start
```

## License

Apache-2.0 License
