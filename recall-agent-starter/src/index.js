import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
config();

// Convert __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Set default server port to 3000
const SERVER_PORT = process.env.SERVER_PORT || '3000';
process.env.SERVER_PORT = SERVER_PORT;

console.log("\n===================================================");
console.log(`🚀 Starting standalone API server on port ${SERVER_PORT}`);
console.log("===================================================\n");

// Get API key from environment
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("⚠️ ERROR: No OpenAI API key found in environment variables!");
  console.error("Please set OPENAI_API_KEY in your .env file");
  console.error("Server will start but API calls will fail");
} else {
  console.log(`✅ OpenAI API Key configured: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
}

// Initialize OpenAI client with API key from .env
const openai = new OpenAI({
  apiKey: apiKey,
});

// Verify OpenAI client configuration
console.log(`📡 OpenAI API using key: ${openai.apiKey ? 'Yes' : 'No'}`);
console.log(`📡 OpenAI API base URL: ${openai.baseURL || 'https://api.openai.com/v1'}`);
console.log(`📡 Default model: ${process.env.MEDIUM_OPENAI_MODEL || "gpt-4o"}`);

// Test the OpenAI API connection
(async () => {
  if (!apiKey) {
    console.error("❌ Skipping API test - no API key provided");
    return;
  }
  
  try {
    console.log("🔍 Testing OpenAI API connection...");
    const testCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'API connection successful' in 5 words or less." }
      ],
      max_tokens: 20,
    });
    
    const testResponse = testCompletion.choices[0]?.message?.content;
    console.log(`✅ API Test Response: "${testResponse}"`);
    console.log("✅ OpenAI API connection successful!");
  } catch (err) {
    console.error("❌ OpenAI API test failed:", err.message);
    console.error("Please check your API key and network connection");
    
    // Log detailed error information
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Headers:`, err.response.headers);
      console.error(`Body:`, err.response.data);
    }
  }
})();

// Create Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Load research data for topic suggestions
const researchDataPath = path.join(projectRoot, 'characters', 'ronso', 'firecrawl_research.json');
let researchData = {};

try {
  console.log(`Loading research data from ${researchDataPath}`);
  if (fs.existsSync(researchDataPath)) {
    researchData = JSON.parse(fs.readFileSync(researchDataPath, 'utf8'));
    console.log(`✅ Research data loaded successfully with ${researchData.data?.length || 0} entries`);
  } else {
    console.log(`❌ Research data file not found at ${researchDataPath}`);
  }
} catch (error) {
  console.error("Error loading research data:", error.message);
}

// Load characters from ronso directory
const charactersDir = path.join(projectRoot, 'characters', 'ronso');
let characters = {};

try {
  console.log(`Looking for characters in ${charactersDir}`);
  
  if (fs.existsSync(charactersDir)) {
    const files = fs.readdirSync(charactersDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.character.json'));
    
    console.log(`Found ${files.length} character files`);
    
    // Load each character
    for (const file of files) {
      try {
        const filePath = path.join(charactersDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Get character name from various formats
        let characterName;
        if (data.character_name) {
          characterName = data.character_name;
        } else if (data.name) {
          characterName = data.name;
        } else {
          characterName = file.replace('.json', '').replace('.character.json', '');
        }
        
        // If there's a hardcoded API key in the character file, warn about it
        if (data.settings && data.settings.secrets && data.settings.secrets.OPENAI_API_KEY) {
          const characterKey = data.settings.secrets.OPENAI_API_KEY;
          if (characterKey && characterKey.length > 10) {
            console.log(`⚠️ Warning: Found hardcoded API key in ${file}. This will be overridden by the environment variable.`);
            // We intentionally don't use this key - we'll always use the environment variable
          }
        }
        
        // If this is the topic proposal agent, log the structure to debug mock responses
        if (characterName.toLowerCase() === 'topic_proposal_agent') {
          console.log(`Found topic_proposal_agent in file: ${file}`);
          console.log(`Has settings.mock?: ${data.settings && data.settings.mock ? 'Yes' : 'No'}`);
          
          // Delete any mock response to ensure we always use the API
          if (data.settings && data.settings.mock) {
            console.log('⚠️ Deleting mock response to force API usage');
            delete data.settings.mock;
          }
        }
        
        // Store character
        characters[characterName.toLowerCase()] = {
          name: characterName,
          system: data.system || '',
          instructions: data.system || data.instructions || '',
          // Disable mock responses
          mockResponse: null // Force to null to ensure we use API
        };
        
        console.log(`Loaded character: ${characterName}`);
      } catch (err) {
        console.error(`Error loading ${file}:`, err.message);
      }
    }
  } else {
    console.log(`Characters directory not found: ${charactersDir}`);
  }
} catch (err) {
  console.error("Error loading characters:", err.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// List characters endpoint
app.get('/characters', (req, res) => {
  const characterList = Object.keys(characters).map(key => ({
    id: key,
    name: characters[key].name
  }));
  
  console.log(`Returning ${characterList.length} characters`);
  res.status(200).json({ characters: characterList });
});

// Chat endpoint with actual OpenAI integration
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
    
    console.log(`Chat request: "${message}" to character "${character}"`);
    
    // Find character (case insensitive)
    const characterKey = character.toLowerCase();
    const characterInfo = characters[characterKey];
    
    if (!characterInfo) {
      console.log(`Character "${character}" not found. Available: ${Object.keys(characters).join(', ')}`);
      return res.status(404).json({ error: 'Character not found', available: Object.keys(characters) });
    }
    
    console.log(`Using character: ${characterInfo.name}`);
    
    try {
      // Force using the API - never use mockResponse
      // Make an actual API call to OpenAI
      console.log(`Calling OpenAI API for ${characterInfo.name} with key: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
      const completion = await openai.chat.completions.create({
        model: process.env.MEDIUM_OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: characterInfo.instructions },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      // Extract the response text
      const responseText = completion.choices[0]?.message?.content || 
        `No response generated from OpenAI for ${characterInfo.name}`;
      
      console.log(`Got response from OpenAI: ${responseText.substring(0, 50)}...`);
      
      // Return response
      return res.status(200).json({
        response: responseText,
        character: character
      });
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);
      console.error("API Key (first 10 chars):", process.env.OPENAI_API_KEY?.substring(0, 10) || "No API key found");
      
      // Fallback to a lorem ipsum response
      return res.status(200).json({
        response: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at velit in nunc aliquam efficitur. Error details: ${apiError.message}`,
        character: character,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Error in /chat endpoint:", error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate script endpoint with actual OpenAI integration
app.post('/generate-script', async (req, res) => {
  try {
    const { topic, originalScript, pollResults } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const isUpdate = originalScript && pollResults;
    console.log(`${isUpdate ? 'Update' : 'Generate'} script request for topic: "${topic}"`);
    
    // Find script generator character
    const scriptGenerator = characters['script_generator'];
    
    if (!scriptGenerator) {
      console.log(`Script generator not found. Available: ${Object.keys(characters).join(', ')}`);
      return res.status(404).json({ error: 'Script generator not found' });
    }
    
    // Check if API key is valid first to provide immediate feedback
    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY" || apiKey.includes("YOUR_OPE") || apiKey === "sk-youractualopenaiapikey") {
      console.error("⚠️ Invalid API key detected in /generate-script endpoint");
      
      // Return a more helpful error message with script structure
      return res.status(200).json({
        topic: topic,
        script: [
          { speaker: "speaker1", text: "To use this endpoint, you need to set up a valid OpenAI API key in the .env file." },
          { speaker: "speaker2", text: "Without a valid API key, the server cannot generate actual debate scripts." },
          { speaker: "speaker1", text: "Please update the OPENAI_API_KEY value in your .env file with a valid key from your OpenAI account." }
        ],
        format: 'error',
        error: 'Invalid or missing OpenAI API key'
      });
    }
    
    try {
      // Prepare prompt based on whether this is a new script or an update
      let userPrompt;
      let systemPrompt = scriptGenerator.instructions;
      
      if (isUpdate) {
        systemPrompt += "\n\nYou are updating a debate script based on audience poll results. Analyze the original script and the poll results, then create an improved version that addresses audience feedback.";
        userPrompt = `Here is the original script about "${topic}":\n\n${JSON.stringify(originalScript)}\n\nHere are the poll results:\n\n${JSON.stringify(pollResults)}\n\nPlease create an updated version of the script that addresses the audience feedback. Format your response as a JSON object with the same structure as the original script.`;
      } else {
        userPrompt = `Generate a debate script about: ${topic}`;
      }
      
      // Make an API call to OpenAI
      console.log(`Calling OpenAI API for script ${isUpdate ? 'update' : 'generation'} with key: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
      console.log(`Using model: ${process.env.MEDIUM_OPENAI_MODEL || "gpt-4o"}`);
      
      const completion = await openai.chat.completions.create({
        model: process.env.MEDIUM_OPENAI_MODEL || "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `${systemPrompt}\n\nCreate a debate script about the topic provided. Format your response as a JSON object with the following structure:\n{\n  "topic": "The topic",\n  "script": [\n    { "speaker": "speaker1", "text": "First argument" },\n    { "speaker": "speaker2", "text": "Counter argument" },\n    ... additional exchanges\n  ]\n}`
          },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
      
      // Extract the response text
      const responseText = completion.choices[0]?.message?.content;
      console.log(`Got script response from OpenAI: ${responseText?.substring(0, 50)}...`);
      
      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }
      
      // Parse JSON response
      try {
        const scriptData = JSON.parse(responseText);
        return res.status(200).json(scriptData);
      } catch (parseError) {
        console.error("Error parsing script JSON:", parseError);
        
        // Return raw text if JSON parsing fails
        return res.status(200).json({
          topic: topic,
          script: responseText,
          format: 'raw'
        });
      }
    } catch (apiError) {
      console.error("Error calling OpenAI API for script:", apiError);
      console.error("API Key (first 10 chars):", process.env.OPENAI_API_KEY?.substring(0, 10) || "No API key found");
      
      // Provide a more helpful fallback script
      return res.status(200).json({
        topic: topic,
        script: [
          { speaker: "speaker1", text: `I'm sorry, but I couldn't generate a proper debate script about "${topic}" due to an API error: ${apiError.message}` },
          { speaker: "speaker2", text: `To fix this issue, please ensure your OpenAI API key is valid and has sufficient credits.` },
          { speaker: "speaker1", text: `Once the API connection is working, you'll receive a full debate script with multiple exchanges between speakers.` }
        ],
        format: 'fallback',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error("Error in /generate-script endpoint:", error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Merged topics endpoint - GET method that uses research data and auto-selects a category
app.get('/topics', async (req, res) => {
  try {
    console.log("GET /topics endpoint called - using research data to suggest topics automatically");
    
    // Find topic proposal agent
    const topicProposalAgent = characters['topic_proposal_agent'] || 
      characters['topic-proposal-agent'] ||
      characters['topicproposalagent'];
    
    if (!topicProposalAgent) {
      console.log(`Topic proposal agent not found. Available: ${Object.keys(characters).join(', ')}`);
      return res.status(200).json({ 
        suggestions: [
          "Will DeFi protocols disrupt traditional banking within the next decade?",
          "Are Central Bank Digital Currencies a threat to cryptocurrency decentralization?",
          "Should Web3 projects prioritize user experience over complete decentralization?",
          "Is proof-of-stake superior to proof-of-work for long-term blockchain security?",
          "Will NFTs find sustainable use cases beyond digital art and collectibles?"
        ],
        source: 'default_fallback'
      });
    }
    
    console.log("Using topic proposal agent to generate topics");
    
    // Check if we have research data
    let basePrompt = "";
    let baseTopic = "cryptocurrency";
    
    if (researchData && researchData.data && researchData.data.length > 0) {
      console.log(`Using research data with ${researchData.data.length} entries`);
      
      // Randomly select a research category from the data
      const randomIndex = Math.floor(Math.random() * researchData.data.length);
      const selectedResearch = researchData.data[randomIndex];
      
      console.log(`Selected research topic: ${selectedResearch.query}`);
      baseTopic = selectedResearch.query;
      
      // Add research summary to the prompt if available
      if (selectedResearch.finalAnalysis) {
        // Use clearer instructions to improve response format
        basePrompt = `Based on the following research summary, generate exactly 5 sophisticated debate topics related to "${selectedResearch.query}". Format each topic as a clear question ending with a question mark. Number each topic clearly (1-5).

Summary:
${selectedResearch.finalAnalysis.substring(0, 2000)}

Remember: Generate 5 numbered debate topics as questions. Each should be concise but thought-provoking.`;
      }
    }
    
    if (!basePrompt) {
      basePrompt = `Generate exactly 5 debate topics related to ${baseTopic}. Format each as a clear question ending with a question mark. Number each topic (1-5).`;
    }
    
    // Check if API key is valid
    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY" || apiKey.includes("YOUR_OPE") || apiKey === "sk-youractualopenaiapikey") {
      console.error("⚠️ Invalid API key detected in /topics endpoint");
      
      return res.status(200).json({ 
        suggestions: [
          `To use this endpoint, you need to set up a valid OpenAI API key.`,
          `Please update the OPENAI_API_KEY value in your .env file.`,
          `Once configured, you'll receive actual topic suggestions from the research data.`,
          `The topic that would have been used was: ${baseTopic}`,
          `Check the README.md file for setup instructions.`
        ],
        source: 'error',
        error: 'Invalid or missing OpenAI API key'
      });
    }
    
    try {
      // Make an API call to OpenAI
      console.log(`Calling OpenAI API for topic suggestions with key: ${apiKey?.substring(0, 10)}...`);
      
      const completion = await openai.chat.completions.create({
        model: process.env.MEDIUM_OPENAI_MODEL || "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: topicProposalAgent.instructions 
          },
          { 
            role: "user", 
            content: basePrompt
          }
        ],
        temperature: 0.7, // Slightly lower temperature for more predictable formatting
        max_tokens: 1500, // Increased token limit
        // Remove JSON format restriction
      });
      
      // Extract the response
      const responseText = completion.choices[0]?.message?.content;
      
      // Debug the full response during testing
      console.log(`Full response from OpenAI:\n${responseText}`);
      console.log(`Response preview: ${responseText?.substring(0, 100)}...`);
      
      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }
      
      try {
        // Try to parse as JSON first
        const responseData = JSON.parse(responseText);
        
        // Check if it's already an array or has suggestions array
        const topics = Array.isArray(responseData) ? responseData : 
                      (responseData.suggestions || responseData.topics || []);
        
        return res.status(200).json({ 
          suggestions: topics.slice(0, 5),
          source: 'openai',
          baseTopic: baseTopic
        });
      } catch (parseError) {
        // JSON parsing failed, extract topics from text
        console.log("JSON parsing failed, extracting topics from text format");
        
        // Look for numbered list patterns (1. topic, 2. topic, etc.)
        const numberedTopics = responseText.match(/\d+\.\s*(.*?)(?=\n\d+\.|\n\n|$)/gs);
        if (numberedTopics && numberedTopics.length > 0) {
          const cleanedTopics = numberedTopics.map(t => 
            t.replace(/^\d+\.\s*/, '').trim() // Remove numbering
          );
          console.log(`Extracted ${cleanedTopics.length} topics from numbered list`);
          return res.status(200).json({ 
            suggestions: cleanedTopics.slice(0, 5),
            source: 'openai_numbered_list',
            baseTopic: baseTopic
          });
        }
        
        // Try splitting by lines and filtering
        const lines = responseText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10 && line.includes('?'));
        
        if (lines.length > 0) {
          console.log(`Extracted ${lines.length} topics from lines containing question marks`);
          return res.status(200).json({ 
            suggestions: lines.slice(0, 5),
            source: 'openai_text',
            baseTopic: baseTopic
          });
        }
        
        // Last resort: just split text into chunks that could be topics
        const textChunks = responseText.split(/\n\n|\.\s+/)
          .map(chunk => chunk.trim())
          .filter(chunk => chunk.length > 15 && chunk.length < 200);
        
        if (textChunks.length > 0) {
          console.log(`Extracted ${textChunks.length} topics from text chunks`);
          return res.status(200).json({ 
            suggestions: textChunks.slice(0, 5),
            source: 'openai_chunks',
            baseTopic: baseTopic
          });
        }
        
        // If we still can't find good topics, use the entire text as one topic
        return res.status(200).json({ 
          suggestions: [responseText.substring(0, 200) + "..."],
          source: 'openai_raw',
          baseTopic: baseTopic
        });
      }
    } catch (apiError) {
      console.error("Error getting topic suggestions from OpenAI:", apiError);
      
      // Provide meaningful error feedback
      return res.status(200).json({ 
        suggestions: [
          `API Error: ${apiError.message}`,
          `Please check your OpenAI API key configuration.`,
          `Once fixed, this endpoint will suggest debate topics related to ${baseTopic}.`,
          `Check your server logs for more details.`,
          `Ensure your API key has sufficient quota remaining.`
        ],
        source: 'api_error',
        error: apiError.message,
        baseTopic: baseTopic
      });
    }
  } catch (error) {
    console.error("Error in /topics endpoint:", error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const port = parseInt(process.env.SERVER_PORT, 10);
try {
  // First check if port is already in use - try alternative ports if needed
  const server = app.listen(port);

  server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Trying alternative port ${port + 1}...`);
      const alternativePort = port + 1;
      const alternativeServer = app.listen(alternativePort, () => {
        console.log(`\n===================================================`);
        console.log(`🚀 Server running at http://localhost:${alternativePort} (alternative port)`);
        console.log(`===================================================\n`);
        console.log('Available endpoints:');
        console.log('  GET  /health            - Health check');
        console.log('  GET  /characters        - List available characters');
        console.log('  POST /chat              - Chat with a character');
        console.log('  POST /generate-script   - Generate a debate script');
        console.log('  GET  /topics            - Get topic suggestions using research data');
        console.log(`===================================================\n`);
        console.log('Loaded characters:');
        Object.keys(characters).forEach(key => {
          console.log(`  - ${characters[key].name}`);
        });
        console.log(`===================================================\n`);
      });
      
      alternativeServer.on('error', (alternativeErr) => {
        console.error(`Failed to start server on alternative port ${alternativePort}:`, alternativeErr.message);
      });
    }
  });
  
  server.on('listening', () => {
    console.log(`\n===================================================`);
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`===================================================\n`);
    console.log('Available endpoints:');
    console.log('  GET  /health            - Health check');
    console.log('  GET  /characters        - List available characters');
    console.log('  POST /chat              - Chat with a character');
    console.log('  POST /generate-script   - Generate a debate script');
    console.log('  GET  /topics            - Get topic suggestions using research data');
    console.log(`===================================================\n`);
    console.log('Loaded characters:');
    Object.keys(characters).forEach(key => {
      console.log(`  - ${characters[key].name}`);
    });
    console.log(`===================================================\n`);
  });
} catch (err) {
  console.error('Failed to start server:', err);
} 