import { useState } from 'react';
import { Check, Copy, User, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onSpeak?: (text: string, id: string) => void;
  currentlyPlayingId?: string | null;
}

export default function MessageItem({ message, onSpeak, currentlyPlayingId }: MessageItemProps) {
  const { role, content, status, errorMessage, attachments, timestamp } = message;
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId('all');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyCodeBlock = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const isUser = role === 'user';
  const isError = status === 'error';

  return (
    <div
      className={`flex gap-4 p-4 md:p-6 transition-all border-b border-neutral-100 ${
        isUser ? 'bg-white' : 'bg-neutral-50/50'
      }`}
      id={`msg-${message.id}`}
    >
      {/* Avatar Container */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white" id="user-avatar">
            <User size={16} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-200 animate-pulse-slow" id="ai-avatar">
            <Sparkles size={16} />
          </div>
        )}
      </div>

      {/* Message Content Area */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="flex items-center gap-2 select-none">
          <span className="font-semibold text-sm text-neutral-800">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-neutral-400">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {status === 'sending' && (
            <span className="text-xs text-blue-500 flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              thinking...
            </span>
          )}
        </div>

        {/* Attachments Display */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1" id="attachments-preview-list">
            {attachments.map((attachment, idx) => (
              <div
                key={idx}
                className="group relative flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-sm max-w-64"
              >
                {attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="w-10 h-10 object-cover rounded border border-neutral-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-500 text-xs font-mono font-bold">
                    FILE
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-neutral-700 truncate">{attachment.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono truncate">{attachment.mimeType}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Markdown Output or Error Banner */}
        {isError ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm" id="error-banner">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Error receiving response</span>
              <p className="text-xs text-red-600">{errorMessage || 'Something went wrong during generation. Please try again.'}</p>
            </div>
          </div>
        ) : (
          <div className="prose prose-neutral max-w-none text-neutral-800 text-[15px] leading-relaxed break-words" id="message-text">
            <Markdown
              components={{
                // Custom paragraph renderer for clean spacing
                p({ children }) {
                  return <p className="mb-3 last:mb-0">{children}</p>;
                },
                // Custom list renderers
                ul({ children }) {
                  return <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>;
                },
                // Custom headers for readability
                h1({ children }) {
                  return <h1 className="text-xl font-bold font-display mt-6 mb-2 text-neutral-900">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-semibold font-display mt-5 mb-2 text-neutral-800">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-md font-semibold font-display mt-4 mb-2 text-neutral-800">{children}</h3>;
                },
                // Blockquote styling
                blockquote({ children }) {
                  return <blockquote className="border-l-4 border-neutral-300 pl-4 py-1 italic text-neutral-600 my-4 bg-neutral-50/50 rounded-r">{children}</blockquote>;
                },
                // Code rendering with copy button
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !className || !String(children).includes('\n');
                  const codeString = String(children).replace(/\n$/, '');

                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded font-mono text-xs font-semibold" {...props}>
                        {children}
                      </code>
                    );
                  }

                  const blockId = `code-${Math.random().toString(36).substr(2, 9)}`;
                  const isCopied = copiedCodeId === blockId;

                  return (
                    <div className="relative group my-4 rounded-lg overflow-hidden border border-neutral-200">
                      <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-800 text-neutral-300 text-xs font-mono select-none">
                        <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
                        <button
                          onClick={() => handleCopyCodeBlock(codeString, blockId)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          id={`copy-btn-${blockId}`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={12} className="text-green-400" />
                              <span className="text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 bg-neutral-900 overflow-x-auto font-mono text-sm text-neutral-100">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }
              }}
            >
              {content}
            </Markdown>
          </div>
        )}

        {/* Global Copy & speak Button for Assistant Text Messages */}
        {!isUser && !isError && content && (
          <div className="flex items-center gap-3 pt-2" id="msg-actions">
            <button
              onClick={() => handleCopyText(content)}
              className="p-1 px-2 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Copy response"
              id={`copy-all-btn-${message.id}`}
            >
              {copiedCodeId === 'all' ? (
                <>
                  <Check size={13} className="text-green-500" />
                  <span className="text-green-600 font-medium font-sans">Copied Response</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="font-sans">Copy text</span>
                </>
              )}
            </button>

            {onSpeak && (
              <button
                onClick={() => onSpeak(content, message.id)}
                className={`p-1 px-2 rounded text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  currentlyPlayingId === message.id
                    ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-100/50'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                }`}
                title={currentlyPlayingId === message.id ? 'Stop auxiliary voice' : 'Listen with female voice'}
                id={`speak-btn-${message.id}`}
              >
                {currentlyPlayingId === message.id ? (
                  <>
                    <span className="flex gap-0.5 items-end h-2 w-2 relative bottom-0.5" id="audio-wave-bars">
                      <span className="w-0.5 h-1.5 bg-pink-600 animate-[bounce_0.6s_infinite_alternate]"></span>
                      <span className="w-0.5 h-2.5 bg-pink-600 animate-[bounce_0.5s_infinite_alternate_0.1s]"></span>
                      <span className="w-0.5 h-2 bg-pink-600 animate-[bounce_0.7s_infinite_alternate_0.2s]"></span>
                    </span>
                    <span className="font-medium font-sans">Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={13} />
                    <span className="font-sans">Speak Response</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
