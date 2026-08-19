export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: 'sparkles' | 'code' | 'lightbulb' | 'compass' | 'book' | 'pen';
  prompt: string;
}

export interface HalloweenConfig {
  showIntro: boolean;
  leavesEnabled: boolean;
  pumpkinsVisible: boolean;
}
