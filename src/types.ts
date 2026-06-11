export interface Attachment {
  name: string;
  mimeType: string;
  dataUrl: string; // Base64 data with data-uri prefix
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status: 'sending' | 'success' | 'error';
  errorMessage?: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  isPremium?: boolean;
}

export const SUPPORTED_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    description: 'Fast, highly intelligent next-gen model for text, reasoning, and multi-modal analysis.',
    badge: 'Recommended',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-fast, light model built for low-latency chat interactions.',
    badge: 'Fastest',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    description: 'Maximum reasoning power for complex logic, multi-turn coding, and deep math.',
    badge: 'Advanced',
  }
];

export interface PresetPrompt {
  id: string;
  label: string;
  promptText: string;
  category: 'coding' | 'writing' | 'learning' | 'brainstorming';
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'explain-code',
    label: 'Explain a code snippet',
    promptText: 'Analyze the following code block, explain its purpose, time complexity, and suggest any potential optimizations:',
    category: 'coding',
  },
  {
    id: 'write-email',
    label: 'Refine a professional email',
    promptText: 'Help me draft a polite, professional, and convincing email to follow up on a project proposal. Here is the context:',
    category: 'writing',
  },
  {
    id: 'summarize',
    label: 'In-depth summarization',
    promptText: 'Provide a structured summary of the following text. Highlight key takeaways, action items, and create a concluding bulleted list of 5 essential points:',
    category: 'learning',
  },
  {
    id: 'creative-ideas',
    label: 'Brainstorm creative concepts',
    promptText: 'Brainstorm 5 unique, creative, and futuristic concepts for a sustainable home-delivery shipping box. Describe why each is eco-friendly:',
    category: 'brainstorming',
  },
];
