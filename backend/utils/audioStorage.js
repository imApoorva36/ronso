import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Storage paths
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const SESSIONS_DIR = path.join(STORAGE_DIR, 'sessions');

// Initialize storage
const initStorage = async () => {
  await fs.ensureDir(STORAGE_DIR);
  await fs.ensureDir(SESSIONS_DIR);
  console.log('Storage initialized successfully');
  return { STORAGE_DIR, SESSIONS_DIR };
};

// Save audio buffer to file
const saveAudioBuffer = async (sessionId, buffer) => {
  const segmentId = uuidv4();
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  const audioDir = path.join(sessionDir, 'audio');
  
  await fs.ensureDir(audioDir);
  
  const filename = `${segmentId}.mp3`;
  const filepath = path.join(audioDir, filename);
  
  await fs.writeFile(filepath, buffer);
  
  return {
    segmentId,
    audioFilename: filename,
    audioFilePath: filepath
  };
};

// Get audio file path
const getAudioFilePath = (sessionId, filename) => {
  return path.join(SESSIONS_DIR, sessionId, 'audio', filename);
};

// Get session metadata
const getSessionMetadata = async (sessionId) => {
  const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
  
  if (!await fs.pathExists(metadataPath)) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  return fs.readJson(metadataPath);
};

// Update session metadata
const updateSessionMetadata = async (sessionId, metadata) => {
  const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  return metadata;
};

// Add segment to session
const addSegmentToSession = async (sessionId, segment, audioBuffer) => {
  try {
    // Save the audio file
    const { segmentId, audioFilename } = await saveAudioBuffer(sessionId, audioBuffer);
    
    // Get the current metadata
    const metadata = await getSessionMetadata(sessionId);
    
    // Create the new segment object
    const newSegment = {
      segmentId,
      audioFilename,
      ...segment,
      createdAt: new Date().toISOString()
    };
    
    // Add to metadata and sort by index
    metadata.segments.push(newSegment);
    metadata.segments.sort((a, b) => a.segmentIndex - b.segmentIndex);
    
    // Update metadata file
    await updateSessionMetadata(sessionId, metadata);
    
    return newSegment;
  } catch (error) {
    console.error(`Error adding segment to session ${sessionId}:`, error);
    throw error;
  }
};

export {
  initStorage,
  saveAudioBuffer,
  getAudioFilePath,
  getSessionMetadata,
  updateSessionMetadata,
  addSegmentToSession
}; 