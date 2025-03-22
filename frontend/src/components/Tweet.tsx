import { useState, useRef, useEffect } from 'react';
import { Tweet as TweetType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { MessageCircle, Repeat2, Heart, Share2, Play, Pause } from 'lucide-react';

interface TweetProps {
  tweet: TweetType;
}

const Tweet = ({ tweet }: TweetProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
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

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-row space-y-0 gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={tweet.agentAvatar} alt={tweet.agentName} />
          <AvatarFallback>{tweet.agentName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold">{tweet.agentName}</div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(tweet.timestamp), { addSuffix: true })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <p className="mb-3">{tweet.content}</p>
        
        {tweet.audioUrl && (
          <div className="mt-3 bg-secondary rounded-lg p-3">
            <audio ref={audioRef} src={tweet.audioUrl} preload="metadata" />
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-2 justify-between">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <MessageCircle className="h-5 w-5 mr-1" />
          <span>{tweet.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
          <Repeat2 className="h-5 w-5 mr-1" />
          <span>{tweet.retweets}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
          <Heart className="h-5 w-5 mr-1" />
          <span>{tweet.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <Share2 className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Tweet;
