// ElevenLabs API Integration
// Based on docs from https://elevenlabs.io/docs/api-reference/text-to-speech

import { uploadAudioToIPFS, getIPFSAudioUrl, fetchExistingAudioFiles, registerAudioCID } from './pinataApi';

const API_KEY = import.meta.env.VITE_ELEVENLABS_XI_API_KEY || import.meta.env.VITE_ELEVENLABS_XI_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs for our speakers - these are defaults from ElevenLabs
// You can replace these with any voice IDs from your ElevenLabs account
const VOICE_IDS = {
  Alex: 'onwK4e9ZLuTAKqWW03F9', // Adam - male voice
  Morgan: 'Zlb1dXrM653N07WRdFW3' // Rachel - female voice
};

console.log('ElevenLabs API initialized with key:', API_KEY ? 'API key present' : 'API key missing');
console.log('Using voice IDs:', VOICE_IDS);

type TTSRequest = {
  text: string;
  model_id: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
};

// Store audio data instead of blob URLs
interface AudioData {
  buffer: ArrayBuffer;
  speaker: string;
  segmentIndex: number;
  ipfsCid?: string; // Added IPFS CID for persistent storage
  blobUrl?: string; // Store the blob URL to avoid recreating it
}

const audioDataStore: AudioData[] = [];
// Track blob URLs so we can release them on cleanup
const createdBlobUrls: string[] = [];

// Clear the audio data store
export const cleanupAudioData = () => {
  console.log(`Cleaning up ${audioDataStore.length} audio segments and ${createdBlobUrls.length} blob URLs`);
  
  // Revoke all blob URLs to prevent memory leaks
  createdBlobUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  });
  
  // Clear arrays
  createdBlobUrls.length = 0;
  audioDataStore.length = 0;
  // We don't clear the IPFS CID cache here anymore since we want to reuse existing audio files
};

// Helper function to create and store a blob URL
const createAndStoreBlobUrl = (buffer: ArrayBuffer, type = 'audio/mpeg'): string => {
  try {
    const blob = new Blob([buffer], { type });
    const url = URL.createObjectURL(blob);
    createdBlobUrls.push(url);
    return url;
  } catch (error) {
    console.error('Error creating blob URL:', error);
    throw error;
  }
};

// Get or create blob URL from audio data
export const getAudioBlobUrl = async (speaker: string, index: number): Promise<string | null> => {
  try {
    // First, try to find it in our audio data store
    const audioData = audioDataStore.find(data => 
      data.speaker === speaker && data.segmentIndex === index
    );
    
    // If we have it in the store and already have a blob URL, return that
    if (audioData && audioData.blobUrl) {
      console.log(`Returning existing blob URL for ${speaker} segment ${index}`);
      return audioData.blobUrl;
    }
    
    // If we have the buffer but no blob URL, create it
    if (audioData && audioData.buffer) {
      const blobUrl = createAndStoreBlobUrl(audioData.buffer);
      audioData.blobUrl = blobUrl; // Store for future use
      console.log(`Created new blob URL for ${speaker} segment ${index} from buffer`);
      return blobUrl;
    }
    
    // If not in the audio data store, check IPFS
    const ipfsUrl = getIPFSAudioUrl(speaker as 'Alex' | 'Morgan', index);
    if (ipfsUrl) {
      console.log(`Found audio on IPFS, fetching: ${ipfsUrl}`);
      try {
        // Fetch the audio from IPFS with a timeout
        const fetchPromise = fetch(ipfsUrl);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 10000)
        );
        
        // Race the fetch against a timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        if (!response.ok) {
          throw new Error(`Failed to fetch from IPFS: ${response.status} ${response.statusText}`);
        }
        
        // Store the fetched data in our local cache
        const buffer = await response.arrayBuffer();
        const blobUrl = createAndStoreBlobUrl(buffer);
        
        // Store in our data store
        audioDataStore.push({
          buffer,
          speaker,
          segmentIndex: index,
          ipfsCid: ipfsUrl.split('/').pop(),
          blobUrl
        });
        
        console.log(`Successfully loaded audio for ${speaker} segment ${index} from IPFS`);
        return blobUrl;
      } catch (error) {
        console.error('Error fetching audio from IPFS:', error);
        // If there's an error, continue to try generation
      }
    }
    
    console.log(`No audio data found for ${speaker} segment ${index}, may need to generate it.`);
    return null;
  } catch (error) {
    console.error(`Error in getAudioBlobUrl for ${speaker} segment ${index}:`, error);
    return null;
  }
};

// Define an interface for errors with a name property
interface ErrorWithName extends Error {
  name: string;
}

// Available CORS proxies - if one fails, we'll try the next one
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://proxy.cors.sh/'
];

// Check if audio exists on IPFS and load it if available
export const loadAudioFromIPFS = async (
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number
): Promise<boolean> => {
  try {
    const ipfsUrl = getIPFSAudioUrl(speaker, segmentIndex);
    if (!ipfsUrl) {
      console.log(`No IPFS URL found for ${speaker} segment ${segmentIndex}`);
      return false;
    }
    
    console.log(`Loading audio from IPFS: ${ipfsUrl}`);
    
    // Try each proxy in sequence until one works
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      const proxiedUrl = `${proxy}${encodeURIComponent(ipfsUrl)}`;
      console.log(`Trying proxy ${i+1}/${CORS_PROXIES.length}: ${proxy}`);
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      try {
        const response = await fetch(proxiedUrl, { 
          signal: controller.signal,
          mode: 'cors' // Ensure we're using CORS mode
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`Proxy ${i+1} failed with status: ${response.status}`);
          continue; // Try next proxy
        }
        
        // Store the fetched data in our local cache
        const buffer = await response.arrayBuffer();
        const blobUrl = createAndStoreBlobUrl(buffer);
        
        // Check if this segment is already in audioDataStore
        const existingIndex = audioDataStore.findIndex(
          data => data.speaker === speaker && data.segmentIndex === segmentIndex
        );
        
        if (existingIndex >= 0) {
          // Update existing entry
          audioDataStore[existingIndex].buffer = buffer;
          audioDataStore[existingIndex].ipfsCid = ipfsUrl.split('/').pop();
          audioDataStore[existingIndex].blobUrl = blobUrl;
        } else {
          // Add new entry
          audioDataStore.push({
            buffer,
            speaker,
            segmentIndex,
            ipfsCid: ipfsUrl.split('/').pop(),
            blobUrl
          });
        }
        
        console.log(`Successfully loaded audio for ${speaker} segment ${segmentIndex} from IPFS via proxy ${i+1}`);
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        const err = error as ErrorWithName;
        if (err.name === 'AbortError') {
          console.warn(`Proxy ${i+1} timed out for ${speaker} segment ${segmentIndex}`);
        } else {
          console.warn(`Proxy ${i+1} error for ${speaker} segment ${segmentIndex}:`, error);
        }
        // Continue to next proxy
      }
    }
    
    // If we're here, all proxies failed
    console.error(`All proxies failed for ${speaker} segment ${segmentIndex}`);
    return false;
  } catch (error) {
    console.error(`Error in loadAudioFromIPFS for ${speaker} segment ${segmentIndex}:`, error);
    return false;
  }
};

// Preload all audio segments with retries and backoff
export const preloadAllAudioSegments = async (
  segments: Array<{ speaker: 'Alex' | 'Morgan'; segmentIndex: number }>
): Promise<boolean> => {
  try {
    console.log(`Preloading ${segments.length} audio segments...`);
    
    // Process segments in batches to avoid rate limiting
    const BATCH_SIZE = 3; // Process 3 at a time to avoid overwhelming servers
    const MAX_RETRIES = 2;
    
    let succeeded = 0;
    let failed = 0;
    
    // Clone the array to avoid modifying the original
    const segmentsToProcess = [...segments];
    
    // Keep track of which segments we've already processed
    const processedSegments = new Set<string>();
    
    // Process in batches with retries
    while (segmentsToProcess.length > 0) {
      // Take the next batch
      const batch = segmentsToProcess.splice(0, BATCH_SIZE);
      
      // Create an array of promises to load the current batch in parallel
      const loadPromises = batch.map(({ speaker, segmentIndex }) => {
        const key = `${speaker}_${segmentIndex}`;
        
        // Skip if already processed
        if (processedSegments.has(key)) {
          return Promise.resolve(true);
        }
        
        return loadAudioFromIPFS(speaker, segmentIndex).then(result => {
          if (result) {
            processedSegments.add(key);
            succeeded++;
          } else {
            failed++;
          }
          return result;
        });
      });
      
      // Wait for the current batch to complete
      await Promise.all(loadPromises);
      
      // Small delay between batches to avoid rate limiting
      if (segmentsToProcess.length > 0) {
        // Random delay between 200-500ms to prevent pattern detection by rate limiters
        const delay = 200 + Math.floor(Math.random() * 300);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Check for any failed segments and retry once with more delay
    if (failed > 0 && MAX_RETRIES > 0) {
      console.log(`Retrying ${failed} failed segments...`);
      
      // Find segments that failed (not in processedSegments)
      const failedSegments = segments.filter(({ speaker, segmentIndex }) => {
        const key = `${speaker}_${segmentIndex}`;
        return !processedSegments.has(key);
      });
      
      // Wait a bit longer before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry each failed segment one by one with delay between attempts
      for (const { speaker, segmentIndex } of failedSegments) {
        const key = `${speaker}_${segmentIndex}`;
        if (processedSegments.has(key)) continue;
        
        const success = await loadAudioFromIPFS(speaker, segmentIndex);
        if (success) {
          processedSegments.add(key);
          succeeded++;
          failed--;
        }
        
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Preloaded ${succeeded} segments successfully, ${failed} failed`);
    return succeeded > 0;
  } catch (error) {
    console.error('Error preloading audio segments:', error);
    return false;
  }
};

export const convertTextToSpeech = async (
  text: string,
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number
): Promise<boolean> => {
  console.log(`Converting text to speech for speaker: ${speaker}, segment: ${segmentIndex}`);
  
  // First check if we already have this audio on IPFS
  const ipfsUrl = getIPFSAudioUrl(speaker, segmentIndex);
  if (ipfsUrl) {
    console.log(`Audio already exists on IPFS, loading instead of regenerating`);
    const loaded = await loadAudioFromIPFS(speaker, segmentIndex);
    if (loaded) {
      return true;
    }
    console.log('Failed to load from IPFS, falling back to generation');
    // If loading failed, continue with generation
  }
  
  console.log(`Text content (first 50 chars): ${text.substring(0, 50)}...`);
  
  try {
    const voiceId = VOICE_IDS[speaker];
    console.log(`Using voice ID: ${voiceId} for speaker: ${speaker}`);
    
    if (!voiceId) {
      console.error(`Voice ID not found for speaker: ${speaker}`);
      throw new Error(`Voice ID not found for speaker: ${speaker}`);
    }

    if (!API_KEY) {
      console.error('ElevenLabs API key is missing');
      throw new Error('ElevenLabs API key is missing');
    }

    const requestData: TTSRequest = {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    };
    console.log('Request data prepared:', { model_id: requestData.model_id, voice_settings: requestData.voice_settings });

    console.log(`Making API request to: ${API_URL}/text-to-speech/${voiceId}`);
    const response = await fetch(
      `${API_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    console.log('API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API error details:', errorData);
      throw new Error(`ElevenLabs API error: ${JSON.stringify(errorData)}`);
    }

    // Get audio blob from response
    const audioBlob = await response.blob();
    console.log('Audio blob received:', { 
      size: `${(audioBlob.size / 1024).toFixed(2)} KB`, 
      type: audioBlob.type 
    });
    
    // Store the audio buffer in our audio store
    const buffer = await audioBlob.arrayBuffer();
    // Create a blob URL for the audio
    const blobUrl = createAndStoreBlobUrl(buffer);
    console.log(`Created blob URL for ${speaker}, segment ${segmentIndex}: ${blobUrl}`);
    
    // Upload the audio to IPFS via Pinata
    const ipfsCid = await uploadAudioToIPFS(
      new Blob([buffer], { type: 'audio/mp3' }),
      { 
        speaker, 
        segmentIndex,
        conversationId: new Date().toISOString() // Use timestamp as conversation ID
      }
    );
    
    console.log(`Uploaded audio to IPFS, CID: ${ipfsCid || 'upload failed'}`);
    
    // If we successfully uploaded to IPFS, register the CID
    if (ipfsCid) {
      registerAudioCID(speaker, segmentIndex, ipfsCid);
    }
    
    // Store the audio data locally as well
    audioDataStore.push({
      buffer,
      speaker,
      segmentIndex,
      ipfsCid: ipfsCid || undefined, // Convert null to undefined to satisfy TS
      blobUrl
    });
    
    console.log(`Audio data stored for ${speaker}, segment ${segmentIndex}`);
    return true;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return false;
  }
};

export const generateFullConversation = async (
  segments: Array<{ speaker: 'Alex' | 'Morgan'; text: string }>
) => {
  console.log(`Generating full conversation with ${segments.length} segments`);
  
  try {
    // Clear only the local audio data store but keep the IPFS cache
    cleanupAudioData(); // This will clear audioDataStore but keeps IPFS cache intact
    
    // First, fetch existing audio files from Pinata
    const fetchResult = await fetchExistingAudioFiles();
    console.log(`Finished fetching existing audio files from Pinata: ${fetchResult ? 'success' : 'failed'}`);
    
    // Try to preload all the audio segments first
    const indexedSegments = segments.map((segment, index) => ({
      speaker: segment.speaker,
      segmentIndex: index
    }));
    
    await preloadAllAudioSegments(indexedSegments);
    
    const results = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`Processing segment ${i} for speaker: ${segment.speaker}`);
      
      // Check if we've already preloaded this segment
      const existingAudio = audioDataStore.find(data => 
        data.speaker === segment.speaker && data.segmentIndex === i
      );
      
      let success = existingAudio !== undefined;
      
      // If not preloaded, generate it
      if (!success) {
        success = await convertTextToSpeech(segment.text, segment.speaker, i);
      } else {
        console.log(`Using preloaded audio for ${segment.speaker} segment ${i}`);
      }
      
      results.push({
        ...segment,
        success,
        segmentIndex: i
      });
    }
    
    console.log(`Successfully processed ${results.length} segments`);
    return results;
  } catch (error) {
    console.error('Error generating full conversation:', error);
    throw error;
  }
}; 