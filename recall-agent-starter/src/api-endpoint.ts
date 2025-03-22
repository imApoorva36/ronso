// @ts-nocheck
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { elizaLogger } from '@elizaos/core';
import { DirectClient } from '@elizaos/client-direct';

/**
 * Creates an API endpoint for the Recall Agent
 * @param {DirectClient} directClient - The DirectClient instance
 * @returns {express.Express} - The Express application (not started)
 */
export function createApiEndpoint(directClient): express.Express {
  const app = express();
  
  // Middleware
  app.use(bodyParser.json());
  app.use(cors());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // List available characters
  app.get('/characters', (req, res) => {
    try {
      console.log("Characters endpoint called - listing available agents");
      
      // Get all agent keys from directClient
      const agentKeys = Object.keys(directClient).filter(key => key.startsWith('agent_'));
      console.log(`Found ${agentKeys.length} agents in directClient`);
      
      // Map to a list of character objects
      const characters = agentKeys.map(key => {
        const agent = directClient[key];
        const id = key.replace('agent_', '');
        const name = agent?.character?.name || id;
        return { id, name };
      });
      
      console.log(`Returning ${characters.length} characters`);
      return res.status(200).json({ characters });
    } catch (error) {
      console.error('Error listing characters:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Chat endpoint
  app.post('/chat', async (req, res) => {
    try {
      const { message, character } = req.body;
      
      // Validate inputs
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (!character) {
        return res.status(400).json({ error: 'Character is required' });
      }
      
      console.log(`Looking for character agent: ${character}`);
      console.log("Available agents:", Object.keys(directClient).filter(k => k.startsWith('agent_')));
      
      // Try to find the character (case insensitive)
      const characterLower = character.toLowerCase();
      let agentKey = `agent_${characterLower}`;
      let characterAgent = directClient[agentKey];
      
      // Try alternative ways to find the agent if not found directly
      if (!characterAgent) {
        console.log(`Character agent not found directly at key: ${agentKey}, trying alternative methods`);
        
        // Look for a similar agent name (case insensitive)
        const possibleAgentKey = Object.keys(directClient).find(key => 
          key.startsWith('agent_') && 
          (key.toLowerCase().includes(characterLower) ||
           (directClient[key]?.character?.name || '').toLowerCase().includes(characterLower))
        );
        
        if (possibleAgentKey) {
          console.log(`Found character agent via name match: ${possibleAgentKey}`);
          characterAgent = directClient[possibleAgentKey];
          agentKey = possibleAgentKey;
        } else {
          // Try agent registry (newer versions of DirectClient)
          if (directClient.agentRegistry) {
            console.log("Checking agent registry");
            const agentIds = directClient.agentRegistry.getAgentIds();
            console.log("Agent IDs in registry:", agentIds);
            
            // Find character by name in registry
            const characterAgentId = agentIds.find(id => {
              const agent = directClient.agentRegistry.getAgent(id);
              return (agent?.character?.name || '').toLowerCase().includes(characterLower);
            });
            
            if (characterAgentId) {
              console.log(`Found character agent in registry: ${characterAgentId}`);
              characterAgent = directClient.agentRegistry.getAgent(characterAgentId);
            }
          }
        }
      }
      
      if (!characterAgent) {
        console.error(`Character agent "${character}" not found after all attempts`);
        return res.status(404).json({ 
          error: 'Agent not found',
          available: Object.keys(directClient)
            .filter(k => k.startsWith('agent_'))
            .map(k => k.replace('agent_', ''))
        });
      }
      
      console.log(`Processing message for character: ${characterAgent.character?.name} (key: ${agentKey})`);
      
      try {
        // Process the message with the character agent
        const response = await characterAgent.processMessage({
          content: { text: message },
          user: 'api-user',
        });
        
        if (!response || !response.content || !response.content.text) {
          console.error("Empty response from character agent");
          return res.status(500).json({ error: 'No response generated' });
        }
        
        // Return the response
        return res.status(200).json({
          response: response.content.text,
          character: character
        });
      } catch (processError) {
        console.error("Error processing message with agent:", processError);
        
        // Fallback for character objects that don't have a processMessage method
        if (characterAgent.character && characterAgent.character.name) {
          console.log("Using fallback response generation");
          
          // Create a simple response
          const fallbackResponse = {
            content: {
              text: `[Simulated response for ${characterAgent.character.name}] Processing your message: "${message}"`
            }
          };
          
          return res.status(200).json({
            response: fallbackResponse.content.text,
            character: character
          });
        } else {
          return res.status(500).json({ error: 'Failed to process message with agent' });
        }
      }
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Generate debate script endpoint
  app.post('/generate-script', async (req, res) => {
    try {
      const { topic } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Missing required field: topic' });
      }
      
      // Look for script generator agent (case insensitive)
      console.log("Checking for script_generator agent...");
      console.log("Available agents:", Object.keys(directClient).filter(k => k.startsWith('agent_')));
      
      const scriptGeneratorKey = 'agent_script_generator';
      let scriptGenerator = directClient[scriptGeneratorKey];
      
      // Try alternative ways to find the agent if not found directly
      if (!scriptGenerator) {
        console.log("Script generator not found directly, trying alternative methods");
        
        // Look for any agent with 'script' in the name (case insensitive)
        const scriptGeneratorKeys = Object.keys(directClient).filter(key => 
          key.startsWith('agent_') && 
          (key.toLowerCase().includes('script') ||
           (directClient[key]?.character?.name || '').toLowerCase().includes('script'))
        );
        
        if (scriptGeneratorKeys.length > 0) {
          const foundKey = scriptGeneratorKeys[0];
          console.log(`Found script generator via name match: ${foundKey}`);
          scriptGenerator = directClient[foundKey];
        }
      }
      
      if (!scriptGenerator) {
        console.error("Script generator agent not found after all attempts");
        return res.status(404).json({ 
          error: 'Script generator agent not found',
          available: Object.keys(directClient)
            .filter(k => k.startsWith('agent_'))
            .map(k => k.replace('agent_', ''))
        });
      }
      
      console.log(`Found script generator agent: ${scriptGenerator.character?.name}`);
      
      try {
        // Generate the script
        console.log(`Processing message for topic: ${topic}`);
        const response = await scriptGenerator.processMessage({
          content: { text: `Generate a debate script for the following topic: ${topic}` },
          user: 'api-user',
        });
        
        // Return the script in appropriate format
        if (!response || !response.content || !response.content.text) {
          console.error("Empty response from script generator agent");
          return res.status(500).json({ error: 'No script generated' });
        }
        
        const scriptText = response.content.text || '';
        
        // Try to extract and parse JSON from the response
        try {
          // Look for JSON in markdown code blocks or plain text
          const jsonMatch = scriptText.match(/```json\n([\s\S]*?)\n```/) || 
                            scriptText.match(/```\n([\s\S]*?)\n```/) ||
                            [null, scriptText];
          
          const jsonText = jsonMatch[1] || scriptText;
          const scriptJson = JSON.parse(jsonText);
          return res.status(200).json(scriptJson);
        } catch (parseError) {
          console.error('Error parsing script JSON:', parseError);
          
          // If parsing fails, return raw text
          return res.status(200).json({ 
            topic,
            script: scriptText,
            format: 'raw'
          });
        }
      } catch (processError) {
        console.error("Error processing script generation:", processError);
        
        // Provide a fallback response with a simple script format
        return res.status(200).json({
          topic: topic,
          script: [
            { speaker: "speaker1", text: `This is a simulated argument in favor of ${topic}` },
            { speaker: "speaker2", text: `This is a simulated counter-argument against ${topic}` },
            { speaker: "speaker1", text: "This is a simulated rebuttal to defend the position" }
          ],
          format: 'fallback'
        });
      }
    } catch (error) {
      console.error('Error in generate-script endpoint:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get topic suggestions endpoint
  app.get('/topics', async (req, res) => {
    try {
      console.log("Checking for topic_proposal_agent...");
      
      const topicAgentKey = 'agent_topic_proposal_agent';
      let topicProposalAgent = directClient[topicAgentKey];
      
      // Try alternative ways to find the agent if not found directly
      if (!topicProposalAgent) {
        console.log("Topic proposal agent not found directly, trying alternative methods");
        
        // Look for any agent with 'topic' in the name (case insensitive)
        const topicAgentKeys = Object.keys(directClient).filter(key => 
          key.startsWith('agent_') && 
          (key.toLowerCase().includes('topic') ||
           (directClient[key]?.character?.name || '').toLowerCase().includes('topic'))
        );
        
        if (topicAgentKeys.length > 0) {
          const foundKey = topicAgentKeys[0];
          console.log(`Found topic agent via name match: ${foundKey}`);
          topicProposalAgent = directClient[foundKey];
        }
      }
      
      if (!topicProposalAgent) {
        console.error("Topic proposal agent not found after all attempts");
        
        // Provide fallback topics if agent not found
        const fallbackTopics = [
          "The future of cryptocurrency regulation",
          "NFTs: Long-term value or speculative bubble?",
          "DeFi vs. traditional finance: Which has more growth potential?",
          "Bitcoin's environmental impact: Solutions and challenges",
          "Central Bank Digital Currencies: Threat or opportunity for crypto?"
        ];
        
        return res.status(200).json({ 
          suggestions: fallbackTopics,
          source: 'fallback'
        });
      }
      
      console.log(`Found topic proposal agent: ${topicProposalAgent.character?.name}`);
      
      try {
        // Request topic suggestions
        console.log("Requesting topic suggestions");
        const response = await topicProposalAgent.processMessage({
          content: { text: "Please suggest 5 debate topics that would be interesting for a cryptocurrency audience." },
          user: 'api-user',
        });
        
        if (response?.content?.text) {
          return res.status(200).json({ 
            suggestions: response.content.text,
            source: 'agent'
          });
        } else {
          throw new Error("Empty response from topic agent");
        }
      } catch (processError) {
        console.error("Error processing topic request:", processError);
        
        // Provide fallback topics if processing fails
        const fallbackTopics = [
          "The future of cryptocurrency regulation",
          "NFTs: Long-term value or speculative bubble?",
          "DeFi vs. traditional finance: Which has more growth potential?",
          "Bitcoin's environmental impact: Solutions and challenges",
          "Central Bank Digital Currencies: Threat or opportunity for crypto?"
        ];
        
        return res.status(200).json({ 
          suggestions: fallbackTopics,
          source: 'fallback'
        });
      }
    } catch (error) {
      console.error('Error getting topic suggestions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return app;
}

/**
 * Starts the API server on the specified port
 * @param {express.Express} app - The Express application
 * @param {number} port - The port to start the server on
 * @returns {Promise<any>} - The server instance
 */
export function startApiServer(app, port) {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        console.log('\n======================================================');
        console.log(`🚀 Server started successfully!`);
        console.log(`📡 API endpoints available at: http://localhost:${port}`);
        console.log('======================================================');
        console.log('\nAvailable endpoints:');
        console.log('  GET  /health            - Health check');
        console.log('  GET  /characters        - List available characters');
        console.log('  POST /chat              - Chat with a character');
        console.log('  POST /generate-script   - Generate a debate script');
        console.log('  GET  /topics            - Get debate topic suggestions');
        console.log('======================================================\n');
        elizaLogger.success(`API endpoint running on port ${port}`);
        resolve(server);
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Please choose a different port.`);
          reject(new Error(`Port ${port} is already in use`));
        } else {
          console.error('Error starting server:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  });
} 