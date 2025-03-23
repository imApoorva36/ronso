import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Storage paths
const STORAGE_DIR = path.join(process.cwd(), '/storage');
const TOPICS_DIR = path.join(STORAGE_DIR, 'topics');
const SCRIPTS_DIR = path.join(STORAGE_DIR, 'scripts');

// Ensure storage directories exist
fs.ensureDirSync(STORAGE_DIR);
fs.ensureDirSync(TOPICS_DIR);
fs.ensureDirSync(SCRIPTS_DIR);

console.log('Topics storage directory initialized:', TOPICS_DIR);
console.log('Scripts storage directory initialized:', SCRIPTS_DIR);

// API configuration
const API_BASE_URL = 'https://autonome.alt.technology/ronso-picvnz';
const API_USERNAME = process.env.API_USERNAME || ''; 
const API_PASSWORD = process.env.API_PASSWORD || '';

// Create axios instance with basic auth
const api = axios.create({
  baseURL: API_BASE_URL,
  auth: {
    username: API_USERNAME,
    password: API_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to make API requests with axios
const makeApiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`);
    
    const config = {
      method,
      url: endpoint,
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error('Error making API request:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
      throw new Error(`API request failed with status code ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from API server');
    } else {
      throw error;
    }
  }
};

// GET all topics
router.get('/topics', async (req, res) => {
  console.log('GET /topics - Fetching all topics from API');
  try {
      // Make API call to get topics
      const topics = await makeApiRequest('/topics');
      console.log(`Retrieved ${topics.length} topics from API`);
      
    // Cache topics locally
    const topicsPath = path.join(TOPICS_DIR, 'topics.json');
    await fs.writeJson(topicsPath, topics, { spaces: 2 });
    console.log('Cached topics locally');

    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics from API:', error);
    
    // Fallback to local cache if API call fails
    try {
      const topicsPath = path.join(TOPICS_DIR, 'topics.json');
      if (await fs.pathExists(topicsPath)) {
        const cachedTopics = await fs.readJson(topicsPath);
      console.log(`Falling back to ${cachedTopics.length} cached topics`);
      return res.json(cachedTopics);
      }

      // If no cache exists, return empty array
      console.log('No cached topics found, returning empty array');
      return res.json([]);
    } catch (cacheError) {
      console.error('Error reading cached topics:', cacheError);
      res.status(500).json({ message: 'Failed to fetch topics', error: error.message });
    }
  }
});

// POST generate new script
router.post('/generate-script', async (req, res) => {
  console.log('POST /generate-new-script - Generating new script via API', req.body);
  try {
    const { topic } = req.body;
    
    if (!topic) {
      console.log('No topic provided');
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    console.log(`Generating script for topic: ${topic}`);
    
    // Make API call to generate script
    const scriptData = await makeApiRequest('/generate-script', 'POST', { "topic": topic });
    console.log(`Received script from API for topic: ${topic}`);
    
    // Replace speaker1 with Alex and speaker2 with Morgan
    if (scriptData && scriptData.script && Array.isArray(scriptData.script)) {
      scriptData.script = scriptData.script.map(segment => ({
        ...segment,
        speaker: segment.speaker === 'speaker1' ? 'Alex' : 
                 segment.speaker === 'speaker2' ? 'Morgan' : segment.speaker
      }));
      console.log('Modified script speakers to Alex and Morgan');
    }
    
    // Save the generated script locally
    const scriptsPath = path.join(SCRIPTS_DIR, 'scripts.json');
    let scripts = [];
    
    if (await fs.pathExists(scriptsPath)) {
      scripts = await fs.readJson(scriptsPath);
    }

    scripts.push(scriptData);
    console.log(`Added new script`);
    
    await fs.writeJson(scriptsPath, scripts, { spaces: 2 });
    console.log(`Saved script`);
    
    res.status(201).json(scriptData);
  } catch (error) {
    console.error('Error generating script via API:', error);
    res.status(500).json({ message: 'Failed to generate script', error: error.message });
  }
});

// POST generate new script with poll results
router.put('/generate-script', async (req, res) => {
  console.log('POST /generate-script - Generating updated script with poll results via API', req.body);
  try {
    const { topic, originalScript, pollResults } = req.body;
    console.log(`Generating updated script for topic: ${pollResults}`);
    
    if (!topic) {
      console.log('No topic provided');
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    if (!originalScript) {
      console.log('No original script provided');
      return res.status(400).json({ message: 'Original script is required' });
    }
    
    if (!pollResults) {
      console.log('No poll results provided');
      return res.status(400).json({ message: 'Poll results are required' });
    }
    
    console.log(`Generating updated script for topic: ${topic}`);
    console.log(`Poll results - Pro: ${pollResults.proArgumentsScore}%, Con: ${pollResults.conArgumentsScore}%`);
    console.log(`Audience comments: ${pollResults.audienceComments.join(', ')}`);
    
    // Make API call to generate updated script
    const scriptData = await makeApiRequest('/generate-script', 'POST', {
      topic,
      originalScript,
      pollResults
    });
    console.log(`Received updated script from API for topic: ${topic}`);
    
    // Save the generated script locally
    const scriptsPath = path.join(SCRIPTS_DIR, 'scripts.json');
    let scripts = [];
    
    if (await fs.pathExists(scriptsPath)) {
      scripts = await fs.readJson(scriptsPath);
    }

    scripts.push(scriptData);
    console.log(`Added new script`);
    
    await fs.writeJson(scriptsPath, scripts, { spaces: 2 });
    console.log(`Saved script`);
    
    res.status(200).json(scriptData);
  } catch (error) {
    console.error('Error generating updated script via API:', error);
    res.status(500).json({ message: 'Failed to generate updated script', error: error.message });
  }
});

export default router;
