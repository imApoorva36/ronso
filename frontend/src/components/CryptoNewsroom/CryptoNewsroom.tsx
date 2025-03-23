'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cryptoNewsScript, ScriptSegment } from './cryptoScript';
import { 
  generateFullConversation, 
  getAudioBlobUrl, 
  cleanupAudioData, 
  preloadAllAudioSegments
} from '../../lib/elevenLabsApi';

type EnhancedScriptSegment = ScriptSegment & {
  success?: boolean;
  segmentIndex?: number;
};

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
  type: NotificationType;
  message: string;
  id: number;
};

const CryptoNewsroom = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptSegments, setScriptSegments] = useState<EnhancedScriptSegment[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [audioBlobUrls, setAudioBlobUrls] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState<Record<number, boolean>>({});
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
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

  // Load audio data with a more robust approach
  useEffect(() => {
    const instanceId = 'crypto-newsroom-loading-' + Date.now();
    
    const loadAudioSegments = async () => {
      if (localStorage.getItem('audio-loading')) {
        console.log('Another instance is already loading audio, skipping');
        return;
      }
      
      localStorage.setItem('audio-loading', instanceId);
      
      if (audioLoadedRef.current || isLoadingAudio) {
        console.log('Audio already loaded or loading, skipping');
        localStorage.removeItem('audio-loading');
        return;
      }
      
      setIsLoadingAudio(true);
      
      try {
        setLoading(true);
        const segments = await generateFullConversation(cryptoNewsScript);
        setScriptSegments(segments);
        
        await preloadAudioSegments(segments);
        
        audioLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load audio segments:', err);
        setError('Failed to load audio. Please try again later.');
        setScriptSegments(cryptoNewsScript);
      } finally {
        setLoading(false);
        setIsLoadingAudio(false);
        if (localStorage.getItem('audio-loading') === instanceId) {
          localStorage.removeItem('audio-loading');
        }
      }
    };

    loadAudioSegments();

    return () => {
      cleanupAudioData();
      if (localStorage.getItem('audio-loading') === instanceId) {
        localStorage.removeItem('audio-loading');
      }
    };
  }, []);

  // Preload audio for all segments
  const preloadAudioSegments = async (segments: EnhancedScriptSegment[]) => {
    const indexedSegments = segments
      .filter(segment => segment.success && segment.segmentIndex !== undefined)
      .map(segment => ({
        speaker: segment.speaker as 'Alex' | 'Morgan',
        segmentIndex: segment.segmentIndex as number
      }));
    
    if (indexedSegments.length === 0) return;
    
    try {
      await preloadAllAudioSegments(indexedSegments);
      
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].success && segments[i].segmentIndex !== undefined) {
          await getSegmentAudioUrl(segments[i], i);
        }
      }
    } catch (error) {
      console.error('Error preloading audio segments:', error);
    }
  };

  // Set up audio element refs
  useEffect(() => {
    if (scriptSegments.length === 0) return;
    
    audioRefs.current = audioRefs.current.slice(0, scriptSegments.length);
    
    return () => {
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, [scriptSegments]);

  // Function to get or create blob URL for a segment
  const getSegmentAudioUrl = async (segment: EnhancedScriptSegment, index: number): Promise<string | null> => {
    const cacheKey = `${segment.speaker}-${index}`;
    if (audioBlobUrls[cacheKey]) {
      return audioBlobUrls[cacheKey];
    }

    if (segment.success && segment.segmentIndex !== undefined) {
      try {
        const url = await getAudioBlobUrl(segment.speaker, segment.segmentIndex);
        if (url) {
          setAudioBlobUrls(prev => ({
            ...prev,
            [cacheKey]: url
          }));
          return url;
        }
      } catch (error) {
        console.error(`Error getting audio blob URL for segment ${index}:`, error);
      }
    }
    
    return null;
  };

  const playSegment = async (index: number) => {
    if (currentlyPlaying !== null && currentlyPlaying !== index) {
      pauseSegment(currentlyPlaying);
    }
    
    const segment = scriptSegments[index];
    if (!segment) return;
    
    try {
      const audioUrl = await getSegmentAudioUrl(segment, index);
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
        
        newAudio.addEventListener('ended', () => {
          if (autoplay && index < scriptSegments.length - 1) {
            setTimeout(() => {
              setCurrentlyPlaying(index + 1);
              playSegment(index + 1);
            }, 500); 
          } else if (index === scriptSegments.length - 1) {
            setCurrentlyPlaying(null);
          }
        });
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
        console.error('Error playing audio:', error);
        showNotification('error', 'Failed to play audio. Trying alternative approach...');
        
        try {
          const freshAudio = new Audio(audioUrl);
          audioRefs.current[index] = freshAudio;
          
          freshAudio.addEventListener('ended', () => {
            if (autoplay && index < scriptSegments.length - 1) {
              setTimeout(() => {
                setCurrentlyPlaying(index + 1);
                playSegment(index + 1);
              }, 500);
            } else if (index === scriptSegments.length - 1) {
              setCurrentlyPlaying(null);
            }
          });
          
          await freshAudio.play();
          console.log(`Successfully playing audio for segment ${index} with fresh element`);
        } catch (secondError) {
          console.error('Second attempt also failed:', secondError);
          
          if (autoplay && index < scriptSegments.length - 1) {
            setTimeout(() => {
              setCurrentlyPlaying(index + 1);
              playSegment(index + 1);
            }, 500);
          } else {
            setCurrentlyPlaying(null);
          }
        }
      }
    } catch (error) {
      console.error(`Error preparing audio for segment ${index}:`, error);
      showNotification('error', 'Error preparing audio playback.');
    }
  };

  // Handle audio end events to support autoplay
  useEffect(() => {
    scriptSegments.forEach((_, index) => {
      const audioElement = audioRefs.current[index];
      if (audioElement) {
        const handleEnded = () => {
          if (autoplay && index < scriptSegments.length - 1) {
            setTimeout(() => {
              setCurrentlyPlaying(index + 1);
              playSegment(index + 1);
            }, 500); 
          } else if (index === scriptSegments.length - 1) {
            setCurrentlyPlaying(null);
          }
        };
        
        audioElement.addEventListener('ended', handleEnded);
        
        return () => {
          audioElement.removeEventListener('ended', handleEnded);
        };
      }
    });
  }, [scriptSegments, autoplay]);

  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
  };

  const playAll = async () => {
    setAutoplay(true);
    if (scriptSegments.length > 0) {
      setLoading(true);
      showNotification('info', 'Loading audio files...');
      
      try {
        const loadingTimeout = setTimeout(() => {
          setLoading(false);
          showNotification('info', 'Continuing with available audio...');
        }, 8000); 
        
        
        await preloadAudioSegments(scriptSegments);
        
        clearTimeout(loadingTimeout);
        setLoading(false);
        
        const hasAnyAudio = Object.values(audioLoaded).some(loaded => loaded);
        
        if (hasAnyAudio) {
          showNotification('success', 'Audio loaded successfully!');
          
          setCurrentlyPlaying(0);
          playSegment(0);
        } else {
          showNotification('info', 'Limited audio available. Starting playback with best effort...');
          setCurrentlyPlaying(0);
          playSegment(0);
        }
      } catch (error) {
        console.error('Error preparing audio playback:', error);
        showNotification('error', 'Failed to load all audio segments. Playing with available audio.');
        setLoading(false);
        
        setCurrentlyPlaying(0);
        playSegment(0);
      }
    }
  };

  const resetAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setCurrentlyPlaying(null);
  };

  const stopAll = () => {
    resetAllAudio();
  };

  useEffect(() => {
    return () => {
      resetAllAudio();
      
      Object.values(audioBlobUrls).forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error revoking URL:', error);
        }
      });
    };
  }, [audioBlobUrls]);

  const downloadAudio = async (segment: EnhancedScriptSegment, index: number) => {
    const audioUrl = await getSegmentAudioUrl(segment, index);
    if (!audioUrl) {
      console.error(`No audio URL available for segment ${index}`);
      showNotification('error', `Failed to download audio for ${segment.speaker}.`);
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = audioUrl;
    
    const characterNum = segment.speaker === 'Alex' ? '1' : '2';
    const fileName = `${segment.speaker.toLowerCase()}_${characterNum}_${index + 1}.mp3`;
    
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    setTimeout(() => {
      document.body.removeChild(downloadLink);
    }, 100);
    
    showNotification('success', `Downloaded ${fileName}`);
  };

  const downloadAllAsMp3 = async () => {
    setDownloadingAll(true);
    showNotification('info', 'Downloading all MP3 files...');
    
    try {
      let successCount = 0;
      const totalFiles = scriptSegments.filter((segment, index) => 
        segment.success || getSegmentAudioUrl(segment, index) !== null
      ).length;
      
      for (let i = 0; i < scriptSegments.length; i++) {
        const segment = scriptSegments[i];
        if (segment.success || getSegmentAudioUrl(segment, i) !== null) {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            downloadAudio(segment, i);
            successCount++;
          } catch (error) {
            console.error(`Error downloading segment ${i}:`, error);
          }
        }
      }
      
      showNotification('success', `Downloaded ${successCount} of ${totalFiles} MP3 files`);
    } catch (error) {
      console.error('Error downloading MP3 files:', error);
      showNotification('error', 'Some files could not be downloaded.');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Generating crypto newsroom audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-600">Displaying script without audio instead:</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-2 rounded shadow-lg text-white max-w-xs animate-fade-in ${
              notification.type === 'success' ? 'bg-green-500' : 
              notification.type === 'error' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>
      
      <div className="fixed top-4 left-4 z-10">
        <Link 
          to="/" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm flex items-center"
        >
          Back to Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Crypto Daily Newsroom</h1>
            <p className="text-blue-100 mt-1">The latest cryptocurrency news and analysis</p>
          </div>
          
          <div className="border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={playAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play All
              </button>
              
              <button 
                onClick={stopAll}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                Stop
              </button>
            </div>
            
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoplay} 
                  onChange={toggleAutoplay}
                  className="sr-only peer" 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900">Autoplay</span>
              </label>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {scriptSegments.map((segment, index) => {
              const hasAudio = segment.success || getSegmentAudioUrl(segment, index) !== null;
              
              return (
                <div 
                  key={index}
                  className={`px-6 py-4 ${currentlyPlaying === index ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${segment.speaker === 'Alex' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                      {segment.speaker === 'Alex' ? 'A' : 'M'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${segment.speaker === 'Alex' ? 'text-blue-700' : 'text-purple-700'}`}>
                          {segment.speaker}
                        </h3>
                        
                        {hasAudio && (
                          <button
                            onClick={() => downloadAudio(segment, index)}
                            className="text-xs flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Save Audio
                          </button>
                        )}
                      </div>
                      
                      <p className="mt-1 text-gray-800">{segment.text}</p>
                      
                      {hasAudio && (
                        <div className="mt-3 flex items-center">
                          <audio 
                            ref={(el) => { audioRefs.current[index] = el; }}
                            controls
                            preload="none"
                            onEnded={() => {
                              if (autoplay && index < scriptSegments.length - 1) {
                                setCurrentlyPlaying(index + 1);
                                playSegment(index + 1);
                              } else if (index === scriptSegments.length - 1) {
                                setCurrentlyPlaying(null);
                              }
                            }}
                          />
                          
                          {currentlyPlaying === index ? (
                            <button 
                              onClick={() => pauseSegment(index)}
                              className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 ml-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
                              </svg>
                              Pause
                            </button>
                          ) : (
                            <button 
                              onClick={() => playSegment(index)}
                              className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 ml-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              Play
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 px-6 py-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={downloadAllAsMp3}
              disabled={downloadingAll}
              className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center ${downloadingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {downloadingAll ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Download All MP3 Files
            </button>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500 text-center">
            Powered by ElevenLabs AI voice technology
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoNewsroom; 