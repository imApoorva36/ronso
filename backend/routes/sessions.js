import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import fileUpload from 'express-fileupload';

const router = express.Router();

// Storage paths
const STORAGE_DIR = path.join(process.cwd(), '/storage');
const SESSIONS_DIR = path.join(STORAGE_DIR, 'sessions');

// Ensure storage directories exist
fs.ensureDirSync(STORAGE_DIR);
fs.ensureDirSync(SESSIONS_DIR);

console.log('Storage directories initialized:', { STORAGE_DIR, SESSIONS_DIR });

// Middleware for file uploads
router.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}));

console.log('File upload middleware configured with 50MB limit');

// GET all sessions
router.get('/', async (req, res) => {
  console.log('GET /sessions - Fetching all sessions');
  try {
    const sessionDirs = await fs.readdir(SESSIONS_DIR);
    console.log(`Found ${sessionDirs.length} session directories`);
    const sessions = [];

    for (const dir of sessionDirs) {
      const metadataPath = path.join(SESSIONS_DIR, dir, 'metadata.json');
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        console.log(`Processing session: ${dir}, name: ${metadata.name}, segments: ${metadata.segments.length}`);
        sessions.push({
          sessionId: dir,
          name: metadata.name || `Newsroom ${dir}`,
          createdAt: metadata.createdAt,
          segmentCount: metadata.segments.length
        });
      } else {
        console.log(`Skipping directory ${dir} - no metadata.json found`);
      }
    }

    console.log(`Returning ${sessions.length} sessions`);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
});

// POST create new session
router.post('/', async (req, res) => {
  console.log('POST /sessions - Creating new session', req.body);
  try {
    const sessionId = uuidv4();
    const { name = `Newsroom ${sessionId.substring(0, 8)}` } = req.body;
    
    console.log(`Creating session with ID: ${sessionId}, name: ${name}`);
    
    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    const audioDir = path.join(sessionDir, 'audio');
    
    await fs.ensureDir(sessionDir);
    await fs.ensureDir(audioDir);
    console.log(`Created directories: ${sessionDir}, ${audioDir}`);
    
    const metadata = {
      sessionId,
      name,
      createdAt: new Date().toISOString(),
      segments: []
    };
    
    await fs.writeJson(path.join(sessionDir, 'metadata.json'), metadata, { spaces: 2 });
    console.log(`Wrote metadata file for session ${sessionId}`);
    
    res.status(201).json({ sessionId, name });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
});

// GET specific session metadata
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`GET /sessions/${sessionId} - Fetching session metadata`);
  try {
    const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const metadata = await fs.readJson(metadataPath);
    console.log(`Returning metadata for session ${sessionId}, segments: ${metadata.segments.length}`);
    res.json(metadata);
  } catch (error) {
    console.error(`Error fetching session ${req.params.sessionId}:`, error);
    res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
});

// POST add segment to session
router.post('/:sessionId/segments', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`POST /sessions/${sessionId}/segments - Adding new segment`, req.body);
  try {
    const { speaker, text, segmentIndex } = req.body;
    console.log(`Segment details - speaker: ${speaker}, text length: ${text?.length}, index: ${segmentIndex}`);
    
    // Check if session exists
    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    const metadataPath = path.join(sessionDir, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Process audio file upload
    if (!req.files || !req.files.audio) {
      console.log('No audio file uploaded');
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const audioFile = req.files.audio;
    const segmentId = uuidv4();
    const audioFilename = `${segmentId}.mp3`;
    const audioPath = path.join(sessionDir, 'audio', audioFilename);
    
    console.log(`Saving audio file: ${audioPath}, size: ${audioFile.size} bytes`);
    
    // Save the audio file
    await audioFile.mv(audioPath);
    console.log(`Audio file saved successfully`);
    
    // Update metadata
    const metadata = await fs.readJson(metadataPath);
    
    const newSegment = {
      segmentId,
      speaker,
      text,
      segmentIndex: segmentIndex || metadata.segments.length,
      audioFilename,
      createdAt: new Date().toISOString()
    };
    
    console.log(`Adding new segment: ${segmentId}, index: ${newSegment.segmentIndex}`);
    metadata.segments.push(newSegment);
    
    // Sort segments by index
    metadata.segments.sort((a, b) => a.segmentIndex - b.segmentIndex);
    console.log(`Sorted segments, total count: ${metadata.segments.length}`);
    
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    console.log(`Updated metadata file for session ${sessionId}`);
    
    res.status(201).json(newSegment);
  } catch (error) {
    console.error(`Error adding segment to session ${req.params.sessionId}:`, error);
    res.status(500).json({ message: 'Failed to add segment', error: error.message });
  }
});

// GET specific segment audio file
router.get('/:sessionId/segments/:segmentId', async (req, res) => {
  const { sessionId, segmentId } = req.params;
  console.log(`GET /sessions/${sessionId}/segments/${segmentId} - Fetching segment audio`);
  try {
    const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const metadata = await fs.readJson(metadataPath);
    const segment = metadata.segments.find(s => s.segmentId === segmentId);
    
    if (!segment) {
      console.log(`Segment ${segmentId} not found in session ${sessionId}`);
      return res.status(404).json({ message: 'Segment not found' });
    }
    
    const audioPath = path.join(SESSIONS_DIR, sessionId, 'audio', segment.audioFilename);
    console.log(`Serving audio file: ${audioPath}`);
    
    if (!await fs.pathExists(audioPath)) {
      console.log(`Audio file not found: ${audioPath}`);
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    console.log(`Sending audio file for segment ${segmentId}`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(audioPath);
  } catch (error) {
    console.error(`Error fetching segment audio ${req.params.segmentId}:`, error);
    res.status(500).json({ message: 'Failed to fetch segment audio', error: error.message });
  }
});

// GET all segments for a session
router.get('/:sessionId/segments', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`GET /sessions/${sessionId}/segments - Fetching all segments`);
  try {
    const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const metadata = await fs.readJson(metadataPath);
    console.log(`Returning ${metadata.segments.length} segments for session ${sessionId}`);
    res.json(metadata.segments);
  } catch (error) {
    console.error(`Error fetching segments for session ${req.params.sessionId}:`, error);
    res.status(500).json({ message: 'Failed to fetch segments', error: error.message });
  }
});

export default router; 