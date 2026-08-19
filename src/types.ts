export type CreativeMediaType = 'image' | 'video' | 'music';

export interface CreativeMediaAttachment {
  type: CreativeMediaType;
  url?: string;
  title?: string;
  audioData?: {
    bpm?: number;
    genre?: string;
    lyrics?: string;
    duration?: string;
  };
  thumbnailUrl?: string;
  status: 'generating' | 'ready' | 'error';
  prompt: string;
  error?: string;
  provider?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
  media?: CreativeMediaAttachment;
}

export type AppMode = 'standard' | 'creative';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  mode?: AppMode;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: 'sparkles' | 'code' | 'lightbulb' | 'compass' | 'book' | 'pen';
  prompt: string;
}
