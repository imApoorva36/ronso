import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cryptoNewsScript, ScriptSegment } from './cryptoScript';
import axios from 'axios';
import { 
  generateFullConversation, 
  getOrCreateSession,
  getSessionDetails,
  getSessionSegments,
  setCurrentSession
} from '../../lib/audioApi';

// Extend ScriptSegment to include additional properties
type EnhancedScriptSegment = ScriptSegment & {
  success?: boolean;
  segmentIndex?: number;
  segmentId?: string;
  audioUrl?: string;
  sessionId?: string;
};

// Segment from the backend
interface BackendSegment {
  segmentId: string;
  sessionId: string;
  speaker: string;
  segmentIndex: number;
  text: string;
  audioUrl?: string;
  success?: boolean;
}

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
  type: NotificationType;
  message: string;
  id: number;
};

const CryptoNewsroom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptSegments, setScriptSegments] = useState<EnhancedScriptSegment[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{name?: string, id?: string}>({}); 
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [scriptData, setScriptData] = useState<any>(null);
  const [audioLoaded, setAudioLoaded] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<string | null>(null);
  
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);
  const notificationIdCounter = useRef(0);
  const audioLoadedRef = useRef(false);

  // Function to show a notification
  const showNotification = (type: NotificationType, message: string) => {
    const id = notificationIdCounter.current++;
    setNotifications(prev => [...prev, { type, message, id }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  // Function to pause playback of a segment
  const pauseSegment = (index: number) => {
    audioRefs.current[index]?.pause();
    if (currentlyPlaying === index) {
      setCurrentlyPlaying(null);
    }
  };

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        let activeSessionId = sessionId;
        
        // If no sessionId in URL, get or create one
        if (!activeSessionId) {
          activeSessionId = await getOrCreateSession();
          navigate(`/crypto-newsroom/${activeSessionId}`, { replace: true });
          return; // The navigation will trigger this effect again
        }
        
        // Set as current session
        setCurrentSession(activeSessionId);
        
        // Get session details
        try {
          const sessionDetails = await getSessionDetails(activeSessionId);
          setSessionInfo(sessionDetails);
          
          // Get existing segments
          const segments = await getSessionSegments(activeSessionId);
          
          if (segments && segments.length > 0) {
            // We have existing segments, use them
            // Convert backend segments to EnhancedScriptSegment
            const enhancedSegments: EnhancedScriptSegment[] = segments.map(segment => ({
              speaker: segment.speaker as 'Alex' | 'Morgan', // Type assertion for safety
              text: segment.text,
              success: true,
              segmentIndex: segment.segmentIndex,
              segmentId: segment.segmentId,
              sessionId: segment.sessionId,
              audioUrl: segment.audioUrl
            }));
            
            setScriptSegments(enhancedSegments);
            audioLoadedRef.current = true;
          } else {
            // No segments yet, generate conversation from the script
            await generateConversation(activeSessionId);
          }
        } catch (error) {
          console.error('Error fetching session data:', error);
          await generateConversation(activeSessionId);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setError('Failed to initialize session. Please try again later.');
        setScriptSegments(cryptoNewsScript);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [sessionId, navigate]);

  // Generate conversation from script
  const generateConversation = async (activeSessionId: string) => {
    setIsLoadingAudio(true);
    try {
      // First fetch topics from the backend
      const topicsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/autonome/topics`);
      console.log('Topics response:', topicsResponse.data);
      
      if (topicsResponse.data && topicsResponse.data.suggestions && topicsResponse.data.suggestions.length > 0) {
        // Select the first topic
        const firstTopic = topicsResponse.data.suggestions[0];
        setSelectedTopic(firstTopic);
        
        // Generate script using the selected topic
        const scriptResponse = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/autonome/generate-script`, 
          { topic: firstTopic }
        );
        
        console.log('Script generation response:', scriptResponse.data);
        setScriptData(scriptResponse.data);

        // Make API request to /openai/summarize route with scriptResponse.data.script
        if (scriptResponse.data && scriptResponse.data.script) {
          try {
            // Extract just the text content from each segment for summarization
            const conversationText = scriptResponse.data.script
              .map((segment: { speaker: string; text: string }) => `${segment.speaker}: ${segment.text}`)
              .join('\n\n');
            
            // Send the conversation text to the summarize endpoint
            const summaryResponse = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/openai/summarize`,
              { text: conversationText }
            );
            
            console.log('Summary response:', summaryResponse.data);
            
            // Store the summary in state if needed
            if (summaryResponse.data && summaryResponse.data.summary) {
              setSummary(summaryResponse.data.summary);
              
              // Create a tweet with the summary and topic
              try {
                // Truncate summary to 250 characters and add ellipsis if needed
                const truncatedSummary = summaryResponse.data.summary.length > 250 
                  ? summaryResponse.data.summary.substring(0, 250) + '...' 
                  : summaryResponse.data.summary;
                
                const tweetText = `${truncatedSummary}`;
                
                // Post the tweet using the backend API
                const tweetResponse = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/tweetapi/tweets`,
                  { 
                    text: tweetText,
                    sessionId: activeSessionId 
                  }
                );
                
                console.log('Tweet posted successfully:', tweetResponse.data);
              } catch (error) {
                console.error('Error posting tweet:', error);
              }
            }
          } catch (error) {
            console.error('Error getting summary:', error);
          }
        }

        // Use the generated script if available, otherwise fall back to the default
        const scriptToUse = scriptResponse.data && scriptResponse.data.script 
          ? scriptResponse.data.script 
          : cryptoNewsScript;
        
        const generatedSegments = await generateFullConversation(scriptToUse, activeSessionId);
        
        // Convert to EnhancedScriptSegment
        const enhancedSegments: EnhancedScriptSegment[] = generatedSegments.map(segment => ({
          speaker: segment.speaker as 'Alex' | 'Morgan', // Type assertion for safety
          text: segment.text,
          success: segment.success,
          segmentIndex: segment.segmentIndex,
          audioUrl: segment.audioUrl
        }));
        
        setScriptSegments(enhancedSegments);
        audioLoadedRef.current = true;
      } else {
        throw new Error('No topics received from backend');
      }
    } catch (error) {
      console.error('Error generating conversation:', error);
      setError('Failed to generate audio. Please try again later.');
      setScriptSegments(cryptoNewsScript);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Set up audio element refs and event listeners for autoplay
  useEffect(() => {
    if (scriptSegments.length === 0) return;
    
    audioRefs.current = audioRefs.current.slice(0, scriptSegments.length);
    
    // Set up event listeners for autoplay
    const setupEventListeners = () => {
      audioRefs.current.forEach((audio, index) => {
        if (audio) {
          // Remove any existing ended event listeners to avoid duplicates
          audio.removeEventListener('ended', () => {});
          
          // Add new event listener
          audio.addEventListener('ended', () => {
            console.log(`Audio ended for segment ${index}`);
            if (autoplay && index < scriptSegments.length - 1) {
              console.log(`Autoplay - fetching and playing next segment ${index + 1}`);
              
              // Fetch the next segment from the backend before playing
              const fetchAndPlayNextSegment = async () => {
                try {
                  // Get the active session ID
                  const activeSessionId = sessionId || '';
                  if (!activeSessionId) {
                    console.error('No active session ID available');
                    return;
                  }
                  
                  // Fetch the latest segments from the backend
                  const segments = await getSessionSegments(activeSessionId);
                  
                  if (segments && segments.length > index + 1) {
                    // Update the next segment with fresh data from backend
                    const nextSegment = segments[index + 1];
                    
                    // Update the scriptSegments state with the fresh data
                    setScriptSegments(prevSegments => {
                      const updatedSegments = [...prevSegments];
                      updatedSegments[index + 1] = {
                        ...updatedSegments[index + 1],
                        audioUrl: nextSegment.audioUrl,
                        success: true,
                        segmentId: nextSegment.segmentId
                      };
                      return updatedSegments;
                    });
                    
                    // Play the next segment after a short delay
                    setTimeout(() => {
                      setCurrentlyPlaying(index + 1);
                      playSegment(index + 1);
                    }, 500);
                  } else {
                    console.log('Next segment not available yet');
                    showNotification('info', 'Waiting for next segment to be ready...');
                    
                    // Try again after a delay
                    setTimeout(() => fetchAndPlayNextSegment(), 2000);
                  }
                } catch (error) {
                  console.error('Error fetching next segment:', error);
                  showNotification('error', 'Failed to fetch next segment. Trying to play anyway...');
                  
                  // Fallback to playing the next segment without fresh data
                  setTimeout(() => {
                    setCurrentlyPlaying(index + 1);
                    playSegment(index + 1);
                  }, 500);
                }
              };
              
              fetchAndPlayNextSegment();
            } else if (index === scriptSegments.length - 1) {
              console.log('Reached end of playlist');
              setCurrentlyPlaying(null);
            }
          });
        }
      });
    };
    
    setupEventListeners();
    
    return () => {
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
          // Clean up event listeners
          audio.removeEventListener('ended', () => {});
        }
      });
    };
  }, [scriptSegments, autoplay, sessionId]);

  const playSegment = async (index: number) => {
    if (currentlyPlaying !== null && currentlyPlaying !== index) {
      pauseSegment(currentlyPlaying);
    }
    
    const segment = scriptSegments[index];
    if (!segment) return;
    
    try {
      // Ensure we have the latest data for this segment from the backend
      if (sessionId) {
        try {
          const segments = await getSessionSegments(sessionId);
          if (segments && segments.length > index) {
            const backendSegment = segments[index];
            // Update the current segment with fresh data
            setScriptSegments(prevSegments => {
              const updatedSegments = [...prevSegments];
              updatedSegments[index] = {
                ...updatedSegments[index],
                audioUrl: backendSegment.audioUrl,
                success: true,
                segmentId: backendSegment.segmentId
              };
              return updatedSegments;
            });
            // Use the updated segment
            segment.audioUrl = backendSegment.audioUrl;
          }
        } catch (fetchError) {
          console.error('Error fetching updated segment data:', fetchError);
        }
      }
      
      const audioUrl = segment.audioUrl;
      if (!audioUrl) {
        console.error(`No audio URL available for segment ${index}`);
        showNotification('error', `Could not play audio for ${segment.speaker}.`);
        if (autoplay && index < scriptSegments.length - 1) {
          setTimeout(() => {
            setCurrentlyPlaying(index + 1);
            playSegment(index + 1);
          }, 500);
        }
        return;
      }
      
      setCurrentlyPlaying(index);
      
      if (!audioRefs.current[index]) {
        console.log(`Creating new audio element for segment ${index}`);
        const newAudio = new Audio();
        audioRefs.current[index] = newAudio;
        
        // The ended event handler is now set up in the useEffect
      }
      
      const audioElement = audioRefs.current[index];
      if (!audioElement) {
        console.error(`Could not create audio element for segment ${index}`);
        showNotification('error', 'Audio playback system error');
        return;
      }
      
      audioElement.pause();
      audioElement.currentTime = 0;
      
      if (!audioLoaded[index] || audioElement.src !== audioUrl) {
        audioElement.src = audioUrl;
        audioElement.load();
        
        audioElement.oncanplaythrough = () => {
          setAudioLoaded(prev => ({ ...prev, [index]: true }));
        };
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      try {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log(`Successfully playing audio for segment ${index}`);
        }
      } catch (error) {
        // console.error('Error playing audio:', error);
        console.log('Error playing audio:', error);
        // showNotification('error', 'Failed to play audio. Trying alternative approach...');
        
        try {
          const freshAudio = new Audio(audioUrl);
          audioRefs.current[index] = freshAudio;
          
          // Set up ended event for the fresh audio element
          freshAudio.addEventListener('ended', () => {
            console.log(`Fresh audio ended for segment ${index}`);
            if (autoplay && index < scriptSegments.length - 1) {
              console.log(`Autoplay (fresh) - fetching and playing next segment ${index + 1}`);
              
              // Fetch the next segment from the backend before playing
              const fetchAndPlayNextSegment = async () => {
                try {
                  const activeSessionId = sessionId || '';
                  if (!activeSessionId) return;
                  
                  const segments = await getSessionSegments(activeSessionId);
                  
                  if (segments && segments.length > index + 1) {
                    setScriptSegments(prevSegments => {
                      const updatedSegments = [...prevSegments];
                      updatedSegments[index + 1] = {
                        ...updatedSegments[index + 1],
                        audioUrl: segments[index + 1].audioUrl,
                        success: true,
                        segmentId: segments[index + 1].segmentId
                      };
                      return updatedSegments;
                    });
                    
                    setTimeout(() => {
                      setCurrentlyPlaying(index + 1);
                      playSegment(index + 1);
                    }, 500);
                  } else {
                    setTimeout(() => fetchAndPlayNextSegment(), 2000);
                  }
                } catch (error) {
                  console.error('Error fetching next segment:', error);
                  setTimeout(() => {
                    setCurrentlyPlaying(index + 1);
                    playSegment(index + 1);
                  }, 500);
                }
              };
              
              fetchAndPlayNextSegment();
            } else {
              setCurrentlyPlaying(null);
            }
          });
          
          await freshAudio.play();
        } catch (innerError) {
          console.error('Alternative approach also failed:', innerError);
          showNotification('error', 'Audio playback failed. Please try again later.');
          setCurrentlyPlaying(null);
        }
      }
    } catch (error) {
      console.error(`Error playing segment ${index}:`, error);
      showNotification('error', 'Audio playback failed. Please try again later.');
      setCurrentlyPlaying(null);
    }
  };

  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
  };

  const playAll = async () => {
    if (currentlyPlaying !== null) {
      pauseSegment(currentlyPlaying);
    }
    
    // Fetch the latest segments from the backend before starting playback
    if (sessionId) {
      try {
        const segments = await getSessionSegments(sessionId);
        if (segments && segments.length > 0) {
          // Update all segments with fresh data
          const enhancedSegments: EnhancedScriptSegment[] = segments.map(segment => ({
            speaker: segment.speaker as 'Alex' | 'Morgan',
            text: segment.text,
            success: true,
            segmentIndex: segment.segmentIndex,
            segmentId: segment.segmentId,
            sessionId: segment.sessionId,
            audioUrl: segment.audioUrl
          }));
          
          setScriptSegments(enhancedSegments);
        }
      } catch (error) {
        console.error('Error fetching segments before playAll:', error);
        showNotification('error', 'Failed to fetch latest segments. Playing with existing data.');
      }
    }
    
    setAutoplay(true);
    playSegment(0);
  };

  const resetAllAudio = () => {
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setCurrentlyPlaying(null);
  };

  const stopAll = () => {
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause();
      }
    });
    setCurrentlyPlaying(null);
  };

  const returnToSessionList = () => {
    navigate('/sessions');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Crypto Newsroom</h1>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Please wait while we set up your newsroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={returnToSessionList}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-3 rounded-md shadow-md transition-all duration-300 ease-in-out ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {sessionInfo?.name || "Crypto Market News"}
          </h1>
          <button
            onClick={returnToSessionList}
            className="px-3 py-1 text-sm rounded-full border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            Back to Sessions
          </button>
        </div>
        
        {/* Twitter Spaces Style Audio Box */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <p className="mb-4 text-center"><strong>Topic : </strong> {selectedTopic}</p>
          <div className="flex justify-around items-center py-8">
            {/* Alex */}
            <div className="flex flex-col items-center">
              <div className={`relative ${currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Alex' ? 'animate-pulse' : ''}`}>
                <div className={`w-16 h-16 rounded-full bg-gray-700 overflow-hidden ${
                  currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Alex' 
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                    : ''
                }`}>
                  <img
                    src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Alex"
                    alt="Alex"
                    className="object-cover w-16 h-16"
                  />
                </div>
                {currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Alex' && (
                  <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse"></div>
                )}
              </div>
              <span className="mt-2 text-sm font-medium">Alex</span>
            </div>
            
            {/* Morgan */}
            <div className="flex flex-col items-center">
              <div className={`relative ${currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Morgan' ? 'animate-pulse' : ''}`}>
                <div className={`w-16 h-16 rounded-full bg-gray-700 overflow-hidden ${
                  currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Morgan' 
                    ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900' 
                    : ''
                }`}>
                  <img
                    src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Morgan"
                    alt="Morgan"
                    className="object-cover w-16 h-16"
                  />
                </div>
                {currentlyPlaying !== null && scriptSegments[currentlyPlaying]?.speaker === 'Morgan' && (
                  <div className="absolute -inset-1 rounded-full bg-purple-500/20 animate-pulse"></div>
                )}
              </div>
              <span className="mt-2 text-sm font-medium">Morgan</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={playAll}
              disabled={isLoadingAudio}
              className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingAudio ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={stopAll}
              className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={toggleAutoplay}
              className={`p-2 rounded-full transition-colors ${
                autoplay ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM1 8a1 1 0 01-1-1V5a1 1 0 012 0v2a1 1 0 001 1zm4-1a1 1 0 00-1 1V8a1 1 0 012 0v2a1 1 0 001 1zm4-1a1 1 0 00-1 1V8a1 1 0 012 0v2a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={resetAllAudio}
              className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4 6a2 2 0 00-2 2v4a2 2 0 110 4v-4a2 2 0 012-2zm3 0a2 2 0 00-2 2v4a2 2 0 110 4v-4a2 2 0 012-2zm3 0a2 2 0 00-2 2v4a2 2 0 110 4v-4a2 2 0 012-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Script Segments */}
        <div className="space-y-4">
          {scriptSegments.map((segment, index) => (
            <div key={index} className="p-4 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="flex">
                <div className="mr-3">
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${
                    currentlyPlaying === index ? 'ring-2 ring-offset-1 ring-offset-gray-900 ' + 
                    (segment.speaker === 'Alex' ? 'ring-blue-500' : 'ring-purple-500') : ''
                  }`}>
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${segment.speaker}`}
                      alt={segment.speaker}
                      className="object-cover w-10 h-10"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-bold">{segment.speaker}</span>
                    <span className="text-gray-400 ml-2">Segment {index + 1}</span>
                  </div>
                  <p className="mt-2 text-gray-300">{segment.text}</p>
                  
                  <div className="mt-3">
                    {currentlyPlaying === index ? (
                      <button
                        onClick={() => pauseSegment(index)}
                        className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                        </svg>
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => playSegment(index)}
                        disabled={!segment.success || isLoadingAudio}
                        className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>{!segment.success ? "Not Available" : "Play"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoNewsroom; 