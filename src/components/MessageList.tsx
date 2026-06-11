import { useEffect, useRef } from 'react';
import { Sparkles, Terminal, BookOpen, PenTool, Lightbulb } from 'lucide-react';
import { Conversation, PRESET_PROMPTS, PresetPrompt } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  conversation: Conversation | null;
  onApplyPreset: (text: string) => void;
  onSpeak?: (text: string, id: string) => void;
  currentlyPlayingId?: string | null;
}

export default function MessageList({ conversation, onApplyPreset, onSpeak, currentlyPlayingId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages?.length, conversation?.messages?.filter(m => m.status === 'sending').length]);

  const hasMessages = conversation && conversation.messages.length > 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding':
        return <Terminal className="text-pink-500 w-4 h-4" />;
      case 'writing':
        return <PenTool className="text-amber-500 w-4 h-4" />;
      case 'learning':
        return <BookOpen className="text-indigo-500 w-4 h-4" />;
      case 'brainstorming':
        return <Lightbulb className="text-emerald-500 w-4 h-4" />;
      default:
        return <Sparkles className="text-blue-500 w-4 h-4" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-neutral-50/20" id="message-list-container">
      {hasMessages ? (
        <div className="flex-1">
          {conversation.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onSpeak={onSpeak}
              currentlyPlayingId={currentlyPlayingId}
            />
          ))}
          <div ref={scrollRef} className="h-4" />
        </div>
      ) : (
        /* Welcome Dashboard if chat is empty */
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto px-6 py-12 md:py-24 space-y-8" id="welcome-dashboard">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 rounded-full border border-indigo-100/50 text-xs font-semibold shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Google Gemini 3.5
            </div>
            <h1 className="text-4xl font-extrabold font-display text-neutral-900 tracking-tight" id="dashboard-title">
              How can I assist you today?
            </h1>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Ask questions, write essays, refactor code, brainstorm ideas, or analyze files in real-time.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 select-none">
              Explore capabilities / Quick start presets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="presets-grid">
              {PRESET_PROMPTS.map((preset: PresetPrompt) => (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.promptText)}
                  className="flex flex-col items-start text-left p-4 bg-white hover:bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] group cursor-pointer"
                  id={`preset-btn-${preset.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-neutral-50 group-hover:bg-white border border-neutral-100 transition-colors">
                      {getCategoryIcon(preset.category)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-neutral-400 group-hover:text-neutral-600 transition-colors">
                      {preset.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800 line-clamp-1 mb-1">
                    {preset.label}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    "{preset.promptText}"
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-neutral-500">Instant Streaming response active</span>
            </div>
            <span>Attach images or documents below to review them together</span>
          </div>
        </div>
      )}
    </div>
  );
}
