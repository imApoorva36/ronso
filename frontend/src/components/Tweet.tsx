import { useState, useRef, useEffect } from 'react';
import { Tweet as TweetType } from '../types';
import {
  Bookmark,
  MoreHorizontal,
  Play,
  Pause
} from "lucide-react"

interface TweetProps {
  tweet: TweetType;
}

const Tweet = ({ tweet }: TweetProps) => {
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [currentTime1, setCurrentTime1] = useState(0);
  const [currentTime2, setCurrentTime2] = useState(0);
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const audioRef1 = useRef<HTMLAudioElement | null>(null);
  const audioRef2 = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef1.current) {
      const audio = audioRef1.current;

      const handleLoadedMetadata = () => {
        setDuration1(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime1(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying1(false);
        setCurrentTime1(0);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef2.current) {
      const audio = audioRef2.current;

      const handleLoadedMetadata = () => {
        setDuration2(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime2(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying2(false);
        setCurrentTime2(0);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const togglePlayPause1 = () => {
    if (audioRef1.current) {
      if (isPlaying1) {
        audioRef1.current.pause();
      } else {
        // Pause the other audio if it's playing
        if (isPlaying2 && audioRef2.current) {
          audioRef2.current.pause();
          setIsPlaying2(false);
        }
        audioRef1.current.play();
      }
      setIsPlaying1(!isPlaying1);
    }
  };

  const togglePlayPause2 = () => {
    if (audioRef2.current) {
      if (isPlaying2) {
        audioRef2.current.pause();
      } else {
        // Pause the other audio if it's playing
        if (isPlaying1 && audioRef1.current) {
          audioRef1.current.pause();
          setIsPlaying1(false);
        }
        audioRef2.current.play();
      }
      setIsPlaying2(!isPlaying2);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="p-4 border-b border-gray-800 hover:bg-gray-900/50">
      <div className="flex">
        <div className="mr-4">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
            <img
              src="https://api.dicebear.com/9.x/pixel-art/svg"
              alt="Profile"
              className="object-cover w-10 h-10"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-bold">hamptonism</span>
            <span className="text-gray-500 ml-2">@hamptonism · 12h</span>
            <button className="ml-auto text-gray-500">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2">
            <p>{tweet.content}</p>
            
            {/* Two person audio box */}
            <div className="mt-4 p-4 border border-gray-700 rounded-lg max-w-2xl m-auto py-10">
              <div className="flex justify-around items-center">
                {/* Person 1 */}
                <div className="flex flex-col items-center">
                  <div className={`relative ${isPlaying1 ? 'animate-pulse' : ''}`}>
                    <div className={`w-16 h-16 rounded-full bg-gray-700 overflow-hidden ${isPlaying1 ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
                      <img
                        src="https://api.dicebear.com/9.x/pixel-art/svg?seed=person1"
                        alt="Person 1"
                        className="object-cover w-16 h-16"
                      />
                    </div>
                    {isPlaying1 && (
                      <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse"></div>
                    )}
                  </div>
                  <span className="mt-2 text-sm">Person 1</span>
                  <button 
                    onClick={togglePlayPause1}
                    className="mt-2 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  >
                    {isPlaying1 ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Person 2 */}
                <div className="flex flex-col items-center">
                  <div className={`relative ${isPlaying2 ? 'animate-pulse' : ''}`}>
                    <div className={`w-16 h-16 rounded-full bg-gray-700 overflow-hidden ${isPlaying2 ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
                      <img
                        src="https://api.dicebear.com/9.x/pixel-art/svg?seed=person2"
                        alt="Person 2"
                        className="object-cover w-16 h-16"
                      />
                    </div>
                    {isPlaying2 && (
                      <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-pulse"></div>
                    )}
                  </div>
                  <span className="mt-2 text-sm">Person 2</span>
                  <button 
                    onClick={togglePlayPause2}
                    className="mt-2 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                  >
                    {isPlaying2 ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Hidden audio elements */}
              <audio ref={audioRef1} src={tweet.audioUrl || "https://example.com/audio1.mp3"} />
              <audio ref={audioRef2} src="https://example.com/audio2.mp3" />
            </div>
            
            <div className="flex justify-between mt-4 text-gray-500">
              <button className="flex items-center">
                <span>{tweet.comments || 377}</span>
              </button>
              <button className="flex items-center">
                <span>{tweet.retweets || 245}</span>
              </button>
              <button className="flex items-center">
                <span>{tweet.likes || "3.6K"}</span>
              </button>
              <button className="flex items-center">
                <span>607K</span>
              </button>
              <button className="flex items-center">
                <Bookmark className="h-5 w-5" />
              </button>
              <button className="flex items-center">
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tweet;
