import { DirectClient } from '@elizaos/client-direct';
import { AgentRuntime, stringToUuid, type Character } from '@elizaos/core';
import { bootstrapPlugin } from '@elizaos/plugin-bootstrap';
import { createNodePlugin } from '@elizaos/plugin-node';
import { solanaPlugin } from '@elizaos/plugin-solana';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiEndpoint, startApiServer } from './api-endpoint.ts';
import { initializeDbCache } from './cache/index.ts';
import { character } from './character.ts';
import { startChat } from './chat/index.ts';
import { initializeClients } from './clients/index.ts';
import { getTokenForProvider, parseArguments } from './config/index.ts';
import { initializeDatabase } from './database/index.ts';
import { recallStoragePlugin } from './plugin-recall-storage/index.ts';
import { config } from 'dotenv';

// Load environment variables
config();

// Convert __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple logger
export const elizaLogger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => console.error(`[ERROR] ${message}`, err || ''),
  warn: (message) => console.warn(`[WARN] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`)
};

elizaLogger.info('Starting application...');

// Initialize DirectClient
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  elizaLogger.error('No OPENAI_API_KEY provided. Please set OPENAI_API_KEY in your .env file.', '');
  process.exit(1);
}

// Initialize DirectClient with proper configuration
export const directClient = {};

// Parse character arguments from command line or environment variables
const getCharacterPaths = () => {
  // Check command line arguments
  const args = process.argv.slice(2);
  let result = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--characters') {
      if (i + 1 < args.length) {
        result = args[i + 1].split(',');
        i++;
      }
    }
  }
  
  // If nothing from command line, check environment variables
  if (result.length === 0 && process.env.CHARACTERS) {
    result = process.env.CHARACTERS.split(',');
  }
  
  elizaLogger.info(`Character paths from arguments: ${result.length > 0 ? result.join(', ') : 'none'}`);
  return result;
};

// Load character data
const loadCharacters = async () => {
  try {
    // Get character paths from args or environment variables
    const characterPaths = getCharacterPaths();
    let charactersToLoad = [];
    
    // Primary characters directory for Ronso
    const ronsoDir = path.join(__dirname, '..', 'characters', 'ronso');
    // Fallback to regular characters directory
    const charactersDir = path.join(__dirname, '..', 'characters');
    
    elizaLogger.info(`Looking for characters in ${ronsoDir}`);
    
    // Check if specific characters were specified
    if (characterPaths.length > 0) {
      charactersToLoad = characterPaths;
      elizaLogger.info(`Loading specific characters: ${charactersToLoad.join(', ')}`);
    } else {
      // If no specific characters, load all from ronso directory if it exists
      if (fs.existsSync(ronsoDir)) {
        const ronsoFiles = fs.readdirSync(ronsoDir).filter(file => 
          file.endsWith('.json') || file.endsWith('.character.json')
        );
        charactersToLoad = ronsoFiles.map(file => path.join('ronso', file));
        elizaLogger.info(`Found ${ronsoFiles.length} character files in ronso directory`);
      } 
      // If ronso directory doesn't exist or is empty, check main directory
      if (charactersToLoad.length === 0) {
        elizaLogger.info(`Looking for characters in ${charactersDir}`);
        if (fs.existsSync(charactersDir)) {
          const mainFiles = fs.readdirSync(charactersDir).filter(file => 
            file.endsWith('.json') && !fs.statSync(path.join(charactersDir, file)).isDirectory()
          );
          charactersToLoad = mainFiles;
          elizaLogger.info(`Found ${mainFiles.length} character files in main directory`);
        }
      }
    }
    
    // If still no characters, create defaults
    if (charactersToLoad.length === 0) {
      elizaLogger.info('No character files found. Creating default characters...');
      
      // Ensure the characters directory exists
      if (!fs.existsSync(charactersDir)) {
        fs.mkdirSync(charactersDir, { recursive: true });
      }
      
      // Create script generator character
      const scriptGeneratorPath = path.join(charactersDir, 'script_generator.json');
      const scriptGeneratorData = {
        "character": {
          "name": "script_generator",
          "instructions": "You are a debate script generator. When given a topic, you will create a structured debate script with two sides, arguments, and counterarguments in JSON format."
        }
      };
      fs.writeFileSync(scriptGeneratorPath, JSON.stringify(scriptGeneratorData, null, 2));
      elizaLogger.info(`Created default script generator character at ${scriptGeneratorPath}`);
      
      // Create topic proposal character
      const topicProposalPath = path.join(charactersDir, 'topic_proposal_agent.json');
      const topicProposalData = {
        "character": {
          "name": "topic_proposal_agent",
          "instructions": "You are a debate topic proposal agent. When asked for topic suggestions, provide 5 interesting and controversial topics suitable for a cryptocurrency debate."
        }
      };
      fs.writeFileSync(topicProposalPath, JSON.stringify(topicProposalData, null, 2));
      elizaLogger.info(`Created default topic proposal character at ${topicProposalPath}`);
      
      charactersToLoad = ['script_generator.json', 'topic_proposal_agent.json'];
    }
    
    // Load all character files
    elizaLogger.info(`Loading ${charactersToLoad.length} character files`);
    
    // Load each character
    for (const file of charactersToLoad) {
      try {
        let characterPath;
        if (file.startsWith('ronso/')) {
          characterPath = path.join(__dirname, '..', 'characters', file);
        } else if (file.includes('/')) {
          characterPath = path.join(__dirname, '..', file);
        } else {
          characterPath = path.join(__dirname, '..', 'characters', file);
        }
        
        elizaLogger.info(`Loading character from: ${characterPath}`);
        
        if (!fs.existsSync(characterPath)) {
          elizaLogger.warn(`Character file not found: ${characterPath}`);
          continue;
        }
        
        const characterData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
        
        // Check the format of the character file
        let characterName;
        if (characterData.character && characterData.character.name) {
          // Standard format
          characterName = characterData.character.name;
        } else if (characterData.character_name) {
          // Format with character_name at root
          characterName = characterData.character_name;
          // Create compatible wrapper
          characterData.character = {
            name: characterName,
            instructions: characterData.system || ''
          };
        } else if (characterData.name) {
          // Format with name at root
          characterName = characterData.name;
          // Create compatible wrapper
          characterData.character = {
            name: characterName,
            instructions: characterData.system || ''
          };
        } else {
          // Try to use filename as a fallback
          characterName = file.replace('.json', '').replace('.character.json', '');
          if (characterName.includes('/')) {
            characterName = characterName.split('/').pop();
          }
          
          elizaLogger.warn(`Character file ${file} has no explicit name, using filename: ${characterName}`);
          
          // Create a basic character structure
          characterData.character = {
            name: characterName,
            instructions: characterData.system || ''
          };
        }
        
        // Add a processMessage method if it doesn't exist
        if (typeof characterData.processMessage !== 'function') {
          characterData.processMessage = async ({ content, user }) => {
            elizaLogger.info(`Simulated response for ${characterName} from message: ${content.text}`);
            return {
              content: { 
                text: `[Simulated response for ${characterName}] Processing your message: "${content.text}"` 
              }
            };
          };
        }
        
        elizaLogger.info(`Loading character: ${characterName}`);
        
        // Register the character with directClient
        const agentKey = `agent_${characterName.toLowerCase()}`;
        directClient[agentKey] = characterData;
        elizaLogger.info(`Successfully registered character: ${characterName} with key: ${agentKey}`);
      } catch (fileError) {
        elizaLogger.error(`Error loading character file ${file}:`, fileError);
      }
    }
    
    // Log registered agents
    const registeredAgents = Object.keys(directClient).filter(key => key.startsWith('agent_'));
    elizaLogger.info(`Registered agents: ${registeredAgents.join(', ')}`);
    
    return registeredAgents.length > 0;
  } catch (error) {
    elizaLogger.error('Error loading characters:', error);
    return false;
  }
};

// Start the server
const startServer = async () => {
  try {
    elizaLogger.info('Starting server initialization...');
    
    // Load characters
    elizaLogger.info('Loading characters...');
    const charactersLoaded = await loadCharacters();
    elizaLogger.info(`Characters loaded: ${charactersLoaded}`);
    
    if (!charactersLoaded) {
      elizaLogger.warn('No characters were loaded. The API may not function properly.');
    }
    
    // Determine port
    const port = parseInt(process.env.SERVER_PORT || '3000', 10);
    elizaLogger.info(`Starting server on port ${port}...`);
    
    // Create and start API server
    elizaLogger.info('Creating API endpoint...');
    const app = createApiEndpoint(directClient);
    elizaLogger.info('API endpoint created, starting server...');
    
    try {
      await startApiServer(app, port);
      elizaLogger.info(`Server started successfully on port ${port}`);
      return true;
    } catch (serverError) {
      elizaLogger.error('Failed to start API server:', serverError);
      if (serverError.code === 'EADDRINUSE') {
        elizaLogger.info(`Try changing the SERVER_PORT in the .env file or closing the application using port ${port}.`);
      }
      process.exit(1);
    }
  } catch (error) {
    elizaLogger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("\n\n=== STARTING SERVER DIRECTLY ===");
  
  // Set up global error handlers
  process.on('uncaughtException', err => {
    console.error('There was an uncaught error', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Start the server with additional logging
  console.log("Calling startServer()...");
  startServer()
    .then(result => {
      console.log("Server started successfully:", result);
    })
    .catch(err => {
      console.error("Error starting server:", err);
      process.exit(1);
    });
}

export default startServer;
