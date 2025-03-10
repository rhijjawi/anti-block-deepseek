export interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastUpdated: string;
} 