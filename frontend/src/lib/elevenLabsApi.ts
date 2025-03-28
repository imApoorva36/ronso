// ElevenLabs API Integration
// Based on docs from https://elevenlabs.io/docs/api-reference/text-to-speech

import { uploadAudioToIPFS, getIPFSAudioCID, registerAudioCID, getAudioFromIPFS, getIPFSAudioUrl } from './pinataApi';

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

// Check if audio exists on IPFS and load it if available
export const loadAudioFromIPFS = async (
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number
): Promise<boolean> => {
  try {
    const ipfsUrl = getIPFSAudioCID(speaker, segmentIndex);
    if (!ipfsUrl) {
      console.log(`No IPFS URL found for ${speaker} segment ${segmentIndex}`);
      return false;
    }

    console.log(`Loading audio from IPFS: ${ipfsUrl}`);

    try {
      const { data, contentType } = await getAudioFromIPFS(ipfsUrl);

      if (!data) {
        console.error(`No data returned from IPFS for ${speaker} segment ${segmentIndex}`);
        return false;
      }

      console.log(contentType);
      let buffer;
      // Type assertion to tell TypeScript that data is a Blob
      if (data instanceof Blob) {
        buffer = await data.arrayBuffer();
      } else {
        console.error('Expected data to be a Blob but got:', typeof data);
        return false;
      }
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

      return true;
    } catch (error) {
      // Handle specific IPFS errors
      const err = error as ErrorWithName;
      if (err.name === 'AuthenticationError') {
        console.error(`Authentication error accessing IPFS: ${err.message}`);
      }
      throw error; // Re-throw to be caught by the outer catch
    }
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

  // Check if we already have this audio in the store
  const existingInStore = audioDataStore.find(
    data => data.speaker === speaker && data.segmentIndex === segmentIndex
  );
  
  if (existingInStore) {
    console.log(`Audio already exists in store for ${speaker}, segment ${segmentIndex}`);
    return true;
  }

  // First check if we already have this audio on IPFS
  const ipfsUrl = getIPFSAudioUrl(speaker, segmentIndex);
  
  if (ipfsUrl) {
    console.log(`Audio already exists on IPFS, loading instead of regenerating`);
    try {
      const loaded = await loadAudioFromIPFS(speaker, segmentIndex);
      if (loaded) {
        return true;
      }
      console.log('Failed to load from IPFS, falling back to generation');
      // If loading failed, continue with generation
    } catch (error) {
      console.error(`Error loading from IPFS: ${error}`);
      console.log('IPFS loading error, falling back to generation');
      // Continue with generation on error
    }
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

    // Check again if the data was added to the store during IPFS operations
    const addedDuringProcess = audioDataStore.find(
      data => data.speaker === speaker && data.segmentIndex === segmentIndex
    );
    
    // Only add to store if it wasn't already added
    if (!addedDuringProcess) {
      // Store the audio data locally as well
      audioDataStore.push({
        buffer,
        speaker,
        segmentIndex,
        ipfsCid: ipfsCid || undefined, // Convert null to undefined to satisfy TS
        blobUrl
      });
      console.log(`Audio data stored for ${speaker}, segment ${segmentIndex}`);
    } else {
      console.log(`Audio data was already added to store for ${speaker}, segment ${segmentIndex}`);
    }

    return true;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return false;
  }
};

// Save audio data to a JSON file or return JSON data
export const saveAudioDataToJSON = async (options?: { 
  downloadFile?: boolean; // If true, will trigger a file download
  returnData?: boolean;   // If true, will return the serialized data
}): Promise<{ success: boolean; data?: any }> => {
  try {
    console.log(`Processing ${audioDataStore.length} audio segments for JSON storage`);
    
    // Create a serializable version of the audio data
    // We can't directly serialize ArrayBuffer, so we'll store metadata and IPFS CIDs
    const serializableData = audioDataStore.map(data => ({
      speaker: data.speaker,
      segmentIndex: data.segmentIndex,
      ipfsCid: data.ipfsCid || null,
      hasBuffer: !!data.buffer,
      bufferSize: data.buffer ? data.buffer.byteLength : 0,
      hasBlobUrl: !!data.blobUrl,
      timestamp: new Date().toISOString()
    }));
    
    console.log("data to be downloaded")
    // Format the data as a JSON string
    const jsonString = JSON.stringify(serializableData, null, 2);

        console.log(jsonString)

    // If download option is enabled, create a downloadable file
    if (options?.downloadFile) {
      // Create a Blob with the JSON data
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      
      // Create a download link and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(jsonBlob);
      downloadLink.download = `audio_data_store_${new Date().toISOString().replace(/:/g, '-')}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(downloadLink.href);
      
      console.log('Audio data successfully saved to JSON file');
    }
    
    // Return the data if requested
    if (options?.returnData) {
      return { 
        success: true, 
        data: serializableData 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing audio data for JSON:', error);
    return { success: false };
  }
};

export const generateFullConversation = async (
  segments: Array<{ speaker: 'Alex' | 'Morgan'; text: string }>
) => {
  try {
    console.log(`Generating full conversation with ${segments.length} segments`);
    const results: Array<{ speaker: string; text: string; success: boolean; segmentIndex: number }> = [];
    
    // Use JSON.stringify for proper array logging instead of toString()
    console.log(JSON.stringify(segments));
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`Processing segment ${i} for speaker: ${segment.speaker}`);

      // Check if we've already preloaded this segment
      const existingAudio = audioDataStore.find(data =>
        data.speaker === segment.speaker && data.segmentIndex === i
      );

      let success = existingAudio !== undefined;

      console.log(`Preloaded audio check: ${success}`);
      
      // If not preloaded, generate it
      if (!success) {
        try {
          success = await convertTextToSpeech(segment.text, segment.speaker, i);
        } catch (error) {
          console.error(`Error generating speech for segment ${i}:`, error);
          success = false;
        }
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
    
    // Save the audio data to a JSON file after all processing is complete
    // By default, just process the data but don't download a file
    await saveAudioDataToJSON();
    
    return results;
  } catch (error) {
    console.error('Error generating full conversation:', error);
    throw error;
  }
}; 