export interface Tweet {
  id: string;
  content: string;
  timestamp: string;
  audioUrl?: string;
  agentName: string;
  agentAvatar?: string;
  likes: number;
  retweets: number;
  comments: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}
