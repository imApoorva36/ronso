// Pinata IPFS Integration
// Based on Pinata SDK docs: https://docs.pinata.cloud/sdk/upload/public/file

import { PinataSDK } from 'pinata';

// Initialize Pinata client with JWT from environment variables
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_PINATA_JWT;
// You can replace this with your specific gateway if you have one
const PINATA_GATEWAY = "amber-perfect-mollusk-742.mypinata.cloud"

console.log('Pinata API initialized:', PINATA_JWT ? 'JWT present' : 'JWT missing');

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
});

// Interface for audio file data
interface AudioFileMetadata {
  speaker: 'Alex' | 'Morgan';
  segmentIndex: number;
  conversationId?: string; // Optional identifier to group conversation segments
}

// Interface for upload response from Pinata
interface PinataUploadResponse {
  id: string;
  name: string;
  cid: string;
  size: number;
  created_at: string;
  number_of_files: number;
  mime_type: string;
  group_id: string | null;
  keyvalues: {
    [key: string]: string;
  };
  vectorized: boolean;
  network: string;
}

// Store CIDs for audio files indexed by speaker and segment index
type AudioCIDMap = {
  [key: string]: string; // Format: "speaker_segmentIndex" -> "CID"
};

// In-memory cache of CIDs
const audioCIDCache: AudioCIDMap = {};

/**
 * Force add a specific CID to the cache
 * This can be used to manually register known CIDs
 */
export const registerAudioCID = (
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number,
  cid: string
): void => {
  const cacheKey = `${speaker}_${segmentIndex}`;
  audioCIDCache[cacheKey] = cid;
  console.log(`Manually registered CID for ${speaker} segment ${segmentIndex}: ${cid}`);
};

/**
 * Upload audio blob to IPFS via Pinata
 * 
 * @param audioBlob - The audio blob to upload
 * @param metadata - Metadata about the audio segment
 * @returns The IPFS CID or null if upload failed
 */
export const uploadAudioToIPFS = async (
  audioBlob: Blob,
  metadata: AudioFileMetadata
): Promise<string | null> => {
  try {
    if (!PINATA_JWT) {
      console.error('Pinata JWT is missing');
      throw new Error('Pinata JWT is missing');
    }

    const { speaker, segmentIndex, conversationId } = metadata;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${speaker.toLowerCase()}_segment_${segmentIndex}_${timestamp}.mp3`;

    // Check if we already have this audio file in cache
    const cacheKey = `${speaker}_${segmentIndex}`;
    if (audioCIDCache[cacheKey]) {
      console.log(`Audio file already exists on IPFS, reusing CID: ${audioCIDCache[cacheKey]}`);
      return audioCIDCache[cacheKey];
    }

    console.log(`Uploading audio to IPFS: ${fileName}`);

    // Create a File object from the Blob
    const audioFile = new File([audioBlob], fileName, { type: 'audio/mp3' });

    // Upload to Pinata with metadata
    const keyvalues: Record<string, string> = {
      speaker,
      segmentIndex: segmentIndex.toString(),
      timestamp: timestamp,
    };

    if (conversationId) {
      keyvalues.conversationId = conversationId;
    }

    const uploadResponse = await pinata.upload.public
      .file(audioFile)
      .name(fileName)
      .keyvalues(keyvalues);

    console.log('IPFS upload response:', uploadResponse);

    const cid = uploadResponse.cid;

    // Store CID in cache
    audioCIDCache[cacheKey] = cid;

    return cid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return null;
  }
};

/**
 * Get IPFS URL for audio by speaker and segment index
 * 
 * @param speaker - Speaker identifier (Alex or Morgan)
 * @param segmentIndex - Segment index in the conversation
 * @returns IPFS gateway URL or null if not found
 */
export const getIPFSAudioUrl = (
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number
): string | null => {
  const cacheKey = `${speaker}_${segmentIndex}`;
  const cid = audioCIDCache[cacheKey];

  if (!cid) {
    console.log(`No IPFS CID found for ${speaker} segment ${segmentIndex}. Available CIDs:`, Object.keys(audioCIDCache));
    return null;
  }

  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
};

export const getIPFSAudioCID = (
  speaker: 'Alex' | 'Morgan',
  segmentIndex: number
): string | null => {
  const cacheKey = `${speaker}_${segmentIndex}`;
  const cid = audioCIDCache[cacheKey];

  if (!cid) {
    console.log(`No IPFS CID found for ${speaker} segment ${segmentIndex}. Available CIDs:`, Object.keys(audioCIDCache));
    return null;
  }

  return cid;
};

/**
 * Clear the audio CID cache
 */
export const clearAudioCIDCache = () => {
  console.log(`Clearing audio CID cache with ${Object.keys(audioCIDCache).length} entries`);
  Object.keys(audioCIDCache).forEach(key => {
    delete audioCIDCache[key];
  });
};

export const getAudioFromIPFS = async (cid: string) => {
  const { data, contentType } = await pinata.gateways.public.get(
    cid
  )

  return { data, contentType }
}

// Register known CIDs from the error message for faster access
// registerAudioCID('Alex', 0, 'bafkreiaejjzw3ftvwfkngcs5wv2nwvp7xlfbppbdkrmsukihbrw6dthu');
// registerAudioCID('Morgan', 1, 'bafkreihjc4izcstykptwhpn7dy6rkgprmqmyvpxzvjzn7pu3lf3k5km'); 