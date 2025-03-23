// Audio API for TTS and local storage
// Based on ElevenLabs API but modified to use local backend storage

const API_KEY = import.meta.env.VITE_ELEVENLABS_XI_API_KEY || import.meta.env.VITE_ELEVENLABS_XI_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Voice IDs for our speakers - these are defaults from ElevenLabs
const VOICE_IDS = {
  Alex: 'onwK4e9ZLuTAKqWW03F9', // Adam - male voice
  Morgan: 'Zlb1dXrM653N07WRdFW3' // Rachel - female voice
};

console.log('Audio API initialized with ElevenLabs key:', API_KEY ? 'API key present' : 'API key missing');
console.log('Using voice IDs:', VOICE_IDS);
console.log('Backend URL:', BACKEND_URL);

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

// Store session and segment info
interface SegmentInfo {
  sessionId: string;
  segmentId: string;
  speaker: string;
  segmentIndex: number;
  text: string;
  audioUrl?: string;
}

// Current session management
let currentSessionId: string | null = null;
const segmentCache: Map<string, SegmentInfo> = new Map();

// Get or create a session
export const getOrCreateSession = async (sessionId?: string, forceCreate: boolean = false): Promise<string> => {
  try {
    // If session ID provided, validate it exists
    if (sessionId) {
      try {
        const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`);
        if (response.ok) {
          console.log('Session found:', sessionId);
          currentSessionId = sessionId;
          return sessionId;
        }
        // If not found, continue to create a new one
        console.log(`Session ${sessionId} not found, creating a new one`);
      } catch (error) {
        console.error('Error validating session:', error);
      }
    }
    
    // If no session ID provided and we have a current session and not forcing creation, return it
    if (!sessionId && currentSessionId && !forceCreate) {
      console.log('Returning current session ID:', currentSessionId);
      return currentSessionId;
    }
    
    // Create a new session
    console.log('Creating new session');
    const response = await fetch(`${BACKEND_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Newsroom ${new Date().toISOString().substring(0, 10)}`
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    
    const data = await response.json();
    currentSessionId = data.sessionId;
    console.log('New session created:', data.sessionId);
    return data.sessionId;
  } catch (error) {
    console.error('Error in getOrCreateSession:', error);
    throw error;
  }
};

// Set current session ID
export const setCurrentSession = (sessionId: string) => {
  currentSessionId = sessionId;
  // Clear the segment cache when changing sessions
  segmentCache.clear();
};

// Get all available sessions
export const getAllSessions = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

// Get session details
export const getSessionDetails = async (sessionId: string): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session details: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching session details for ${sessionId}:`, error);
    throw error;
  }
};

// Get segments for a session
export const getSessionSegments = async (sessionId: string): Promise<SegmentInfo[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/segments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch segments: ${response.statusText}`);
    }
    
    const segments = await response.json();
    
    // Update segment cache
    segments.forEach((segment: any) => {
      const cacheKey = `${sessionId}_${segment.segmentIndex}`;
      segmentCache.set(cacheKey, {
        sessionId,
        segmentId: segment.segmentId,
        speaker: segment.speaker,
        segmentIndex: segment.segmentIndex,
        text: segment.text,
        audioUrl: `${BACKEND_URL}/sessions/${sessionId}/segments/${segment.segmentId}`
      });
    });
    
    return segments.map((segment: any) => ({
      ...segment,
      audioUrl: `${BACKEND_URL}/sessions/${sessionId}/segments/${segment.segmentId}`
    }));
  } catch (error) {
    console.error(`Error fetching segments for session ${sessionId}:`, error);
    return [];
  }
};

// Get audio URL for a segment
export const getAudioUrl = (sessionId: string, segmentId: string): string => {
  return `${BACKEND_URL}/sessions/${sessionId}/segments/${segmentId}`;
};

// Convert text to speech and store in the backend
export const convertTextToSpeech = async (
  text: string,
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number,
  sessionId?: string
): Promise<SegmentInfo | null> => {
  try {
    console.log(`Converting text to speech for speaker: ${speaker}, segment: ${segmentIndex}`);
    
    // Ensure we have a session ID
    const activeSessionId = sessionId || currentSessionId || await getOrCreateSession();
    
    // Check if this segment is already in the cache
    const cacheKey = `${activeSessionId}_${segmentIndex}`;
    const cachedSegment = segmentCache.get(cacheKey);
    
    if (cachedSegment) {
      console.log(`Using cached segment for ${speaker}, index ${segmentIndex}`);
      return cachedSegment;
    }
    
    // Generate audio with ElevenLabs
    const voiceId = VOICE_IDS[speaker];
    
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
    
    console.log(`Making API request to ElevenLabs: ${API_URL}/text-to-speech/${voiceId}`);
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
    
    // Upload to backend storage
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.mp3');
    formData.append('speaker', speaker);
    formData.append('text', text);
    formData.append('segmentIndex', segmentIndex.toString());
    
    console.log(`Uploading audio to backend: ${BACKEND_URL}/sessions/${activeSessionId}/segments`);
    const backendResponse = await fetch(`${BACKEND_URL}/sessions/${activeSessionId}/segments`, {
      method: 'POST',
      body: formData,
    });
    
    if (!backendResponse.ok) {
      console.error('Backend storage error:', await backendResponse.text());
      throw new Error('Failed to store audio in backend');
    }
    
    const segmentData = await backendResponse.json();
    
    // Create a segment info object
    const segmentInfo: SegmentInfo = {
      sessionId: activeSessionId,
      segmentId: segmentData.segmentId,
      speaker,
      segmentIndex,
      text,
      audioUrl: getAudioUrl(activeSessionId, segmentData.segmentId)
    };
    
    // Cache the segment info
    segmentCache.set(cacheKey, segmentInfo);
    
    return segmentInfo;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return null;
  }
};

// Generate full conversation with segments
export const generateFullConversation = async (
  segments: Array<{ speaker: 'Alex' | 'Morgan'; text: string }>,
  sessionId?: string
) => {
  try {
    console.log(`Generating full conversation with ${segments.length} segments`);
    
    // Ensure we have a session ID
    const activeSessionId = sessionId || currentSessionId || await getOrCreateSession();
    console.log(`Using session ID: ${activeSessionId}`);
    
    const results: Array<{ 
      speaker: string; 
      text: string; 
      success: boolean; 
      segmentIndex: number;
      audioUrl?: string;
    }> = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`Processing segment ${i} for speaker: ${segment.speaker}`);
      
      try {
        const segmentInfo = await convertTextToSpeech(
          segment.text, 
          segment.speaker, 
          i,
          activeSessionId
        );
        
        results.push({
          ...segment,
          success: !!segmentInfo,
          segmentIndex: i,
          audioUrl: segmentInfo?.audioUrl
        });
      } catch (error) {
        console.error(`Error generating speech for segment ${i}:`, error);
        results.push({
          ...segment,
          success: false,
          segmentIndex: i
        });
      }
    }
    
    console.log(`Successfully processed ${results.length} segments`);
    return results;
  } catch (error) {
    console.error('Error generating full conversation:', error);
    throw error;
  }
}; 