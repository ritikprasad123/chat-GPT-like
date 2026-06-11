import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Sparkles, RefreshCw, Trash2, Heart, ShieldAlert, Download, Printer, FileDown, ChevronDown } from 'lucide-react';
import { Conversation, Message, Attachment, SUPPORTED_MODELS } from './types';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { useSpeech } from './hooks/useSpeech';

export default function App() {
  const speech = useSpeech();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [presetInputValue, setPresetInputValue] = useState('');

  // Global tuning parameters (automatically synced to selected thread)
  const [activeModel, setActiveModel] = useState('gemini-3.5-flash');
  const [systemInstruction, setSystemInstruction] = useState('You are a helpful, respectful, and highly intelligent AI assistant mimicking the style of ChatGPT. Format your responses elegantly in markdown.');
  const [temperature, setTemperature] = useState(0.7);

  // Status block for backend API health checks
  const [backendReady, setBackendReady] = useState(true);

  // Initialize and load conversations on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gemini-chats');
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);

          // Sync initial model settings to first chat
          setActiveModel(parsed[0].model || 'gemini-3.5-flash');
          setSystemInstruction(parsed[0].systemInstruction || '');
          setTemperature(parsed[0].temperature ?? 0.7);
        }
      }
    } catch (e) {
      console.error('Failed reading browser local storage:', e);
    }

    // Ping backend to confirm server API readiness
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendReady(data.status === 'ok');
      })
      .catch((err) => {
        console.warn('Backend connection ping offline:', err);
        setBackendReady(false);
      });
  }, []);

  // Persist conversations on any mutations
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('gemini-chats', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('gemini-chats');
    }
  }, [conversations]);

  // Sync parameters whenever active conversation shifts
  useEffect(() => {
    if (!activeConversationId) return;
    const active = conversations.find(c => c.id === activeConversationId);
    if (active) {
      setActiveModel(active.model || 'gemini-3.5-flash');
      setSystemInstruction(active.systemInstruction || '');
      setTemperature(active.temperature ?? 0.7);
    }
  }, [activeConversationId]);

  // Update active conversation tuning configs on slider modifications
  const handleUpdateActiveConfig = (updates: { model?: string; systemInstruction?: string; temperature?: number }) => {
    if (updates.model !== undefined) setActiveModel(updates.model);
    if (updates.systemInstruction !== undefined) setSystemInstruction(updates.systemInstruction);
    if (updates.temperature !== undefined) setTemperature(updates.temperature);

    if (!activeConversationId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            model: updates.model !== undefined ? updates.model : c.model,
            systemInstruction: updates.systemInstruction !== undefined ? updates.systemInstruction : c.systemInstruction,
            temperature: updates.temperature !== undefined ? updates.temperature : c.temperature,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );
  };

  const handleCreateNewConversation = () => {
    const newChat: Conversation = {
      id: `chat-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeModel,
      systemInstruction: systemInstruction,
      temperature: temperature,
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAllHistory = () => {
    setConversations([]);
    setActiveConversationId(null);
  };

  const handleApplyPresetPrompt = (text: string) => {
    setPresetInputValue(text);
  };

  // Keyboard shortcut state syncing
  const createNewChatRef = useRef(handleCreateNewConversation);
  useEffect(() => {
    createNewChatRef.current = handleCreateNewConversation;
  }, [handleCreateNewConversation]);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // 1. Focus input (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const textarea = document.getElementById('chat-textarea');
        if (textarea) {
          e.preventDefault();
          textarea.focus();
        }
      }

      // 2. Start new conversation (Ctrl/Cmd + N or Alt/Option + N)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') ||
        (e.altKey && e.key.toLowerCase() === 'n')
      ) {
        e.preventDefault();
        createNewChatRef.current();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, []);

  const handleSendMessage = async (userContent: string, attachments: Attachment[]) => {
    if (isGenerating) return;

    let targetChatId = activeConversationId;
    let updatedConversations = [...conversations];

    // 1. Create a dynamic conversation thread on-the-fly if none are open
    if (!targetChatId) {
      const newChatId = `chat-${Math.random().toString(36).substr(2, 9)}`;
      const proposedTitle = userContent.trim().substring(0, 30) || 'Attached Document Review';
      const newChat: Conversation = {
        id: newChatId,
        title: proposedTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: activeModel,
        systemInstruction: systemInstruction,
        temperature: temperature,
      };

      updatedConversations = [newChat, ...updatedConversations];
      targetChatId = newChatId;
      setActiveConversationId(newChatId);
    }

    const currentChat = updatedConversations.find(c => c.id === targetChatId);
    if (!currentChat) return;

    // First user message changes placeholder thread title automatically
    let updatedTitle = currentChat.title;
    if (currentChat.messages.length === 0) {
      updatedTitle = userContent.trim().substring(0, 32) || 'Attached Assets Review';
    }

    // 2. Draft target client message models
    const userMessage: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
      status: 'success',
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessageId = `msg-${Math.random().toString(36).substr(2, 9)}`;
    const assistantPlaceholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 10,
      status: 'sending',
    };

    // Update conversation arrays in memory state
    const workingMessages = [...currentChat.messages, userMessage];
    const workingMessagesWithPlaceholder = [...workingMessages, assistantPlaceholderMessage];

    setConversations(
      updatedConversations.map((c) => {
        if (c.id === targetChatId) {
          return {
            ...c,
            title: updatedTitle,
            messages: workingMessagesWithPlaceholder,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    // 3. Fire streaming HTTP POST request proxying server
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: workingMessages,
          model: activeModel,
          systemInstruction: systemInstruction,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status} connecting backend`);
      }

      // Stream evaluation begins
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('ReadableStream API not supported in client browser.');
      }

      let accumulatedContent = '';
      let sseBuffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const parts = sseBuffer.split('\n\n');
        
        // Retain any dangling/unsplit part for the next chunk read buffer
        sseBuffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;

          if (line.startsWith('data: ')) {
            const dataString = line.substring(6).trim();
            if (dataString === '[DONE]') continue;

            try {
              const payload = JSON.parse(dataString);
              if (payload.error) {
                throw new Error(payload.error);
              }
              if (payload.text) {
                accumulatedContent += payload.text;

                // Sync typing chunks into state messages dynamically
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id === targetChatId) {
                      return {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: accumulatedContent }
                            : m
                        ),
                      };
                    }
                    return c;
                  })
                );
              }
            } catch (err) {
              // Partial streams or non-JSON parts during rapid chunk updates are ignored
            }
          }
        }
      }

      // Generation successful. Change status indicator of assistant message.
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, status: 'success' }
                  : m
              ),
            };
          }
          return c;
        })
      );

      // Trigger automatic audio read out if active
      if (speech.isAutoReadEnabled && accumulatedContent) {
        speech.speak(accumulatedContent, assistantMessageId);
      }

    } catch (e: any) {
      console.error('Error streaming response:', e);
      const messageText = e?.message || String(e);

      // Append visual indicators in chat to let user debug missing keys or bad responses easily
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, status: 'error', errorMessage: messageText }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportMarkdown = () => {
    if (!activeConversation) return;

    let content = `# ${activeConversation.title || 'Conversation Transcript'}\n\n`;
    content += `*Exported from Gemini Workspace on ${new Date().toLocaleDateString()}*\n`;
    content += `*Model:* ${SUPPORTED_MODELS.find(m => m.id === activeModel)?.name || activeModel}\n`;
    if (activeConversation.systemInstruction) {
      content += `*System Prompt:* "${activeConversation.systemInstruction}"\n`;
    }
    content += `\n---\n\n`;

    activeConversation.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? '👤 **You**' : '✨ **Assistant**';
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      content += `### ${roleName} *(${timeStr})*\n\n`;

      if (msg.attachments && msg.attachments.length > 0) {
        content += `*Attachments:*\n`;
        msg.attachments.forEach((att) => {
          content += `- \`${att.name}\` (${att.mimeType})\n`;
        });
        content += `\n`;
      }

      content += `${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const safeTitle = (activeConversation.title || 'chat-transcript')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    link.setAttribute('download', `${safeTitle || 'conversation'}-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handlePrintPDF = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-800 font-sans" id="app-root">
      {/* Central Sidebar orchestrator */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={handleCreateNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAllHistory}
        activeModel={activeModel}
        onModelChange={(model) => handleUpdateActiveConfig({ model })}
        systemInstruction={systemInstruction}
        onSystemInstructionChange={(systemInstruction) => handleUpdateActiveConfig({ systemInstruction })}
        temperature={temperature}
        onTemperatureChange={(temp) => handleUpdateActiveConfig({ temperature: temp })}
        voices={speech.voices}
        selectedVoiceURI={speech.selectedVoiceURI}
        onVoiceChange={speech.setSelectedVoiceURI}
        speed={speech.speed}
        onSpeedChange={speech.setSpeed}
        pitch={speech.pitch}
        onPitchChange={speech.setPitch}
        isAutoReadEnabled={speech.isAutoReadEnabled}
        onAutoReadToggle={speech.setIsAutoReadEnabled}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Conversation Workspace Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative" id="chat-workspace">
        {/* Upper Workspace Topbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-white select-none relative shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger menu for compact/mobile layouts */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer lg:hidden"
              title="Open Navigation"
              id="sidebar-toggle-btn"
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-900 font-display">
                  {activeConversation ? activeConversation.title : 'Assistant Sandbox'}
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100/50">
                  {SUPPORTED_MODELS.find(m => m.id === activeModel)?.name || 'Gemini 3.5'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                {isGenerating ? 'Assistant is typing...' : 'Idle - ready for prompt'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConversation && activeConversation.messages.length > 0 && (
              <div className="relative" id="topbar-export-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 font-semibold rounded-xl border border-neutral-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  title="Export Chat History"
                  id="topbar-export-btn"
                >
                  <FileDown size={14} className="text-neutral-500" />
                  <span>Export</span>
                  <ChevronDown size={10} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportMenu(false)}
                      id="export-clickaway-shield"
                    />
                    <div
                      className="absolute right-0 mt-1.5 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 z-50 text-xs text-neutral-800 animate-fade-in"
                      id="export-dropdown-menu"
                    >
                      <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 hover:bg-neutral-50 hover:text-neutral-950 font-medium cursor-pointer transition-colors"
                        id="btn-export-markdown"
                      >
                        <Download size={14} className="text-indigo-500" />
                        <div>
                          <p className="font-semibold text-neutral-800">Save Markdown (.md)</p>
                          <p className="text-[9px] text-neutral-400 font-sans">Raw formatted text file</p>
                        </div>
                      </button>

                      <button
                        onClick={handlePrintPDF}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 hover:bg-neutral-50 hover:text-neutral-950 font-medium cursor-pointer transition-colors border-t border-neutral-100"
                        id="btn-export-pdf"
                      >
                        <Printer size={14} className="text-pink-500" />
                        <div>
                          <p className="font-semibold text-neutral-800">Print / Save as PDF (.pdf)</p>
                          <p className="text-[9px] text-neutral-400 font-sans">Universal PDF document</p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Fast direct "New Chat" icon trigger */}
            <button
              onClick={handleCreateNewConversation}
              className="p-2 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded-xl transition-all cursor-pointer border border-neutral-150/40"
              title="Create new conversation thread"
              id="topbar-new-chat-btn"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* API key validation status banner */}
        {!backendReady && (
          <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 flex items-center justify-between text-xs text-amber-800" id="backend-warning">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Workspace warning:</strong> Server-side configuration is still completing or API credentials are initializing. Please verify variables in Settings if this persists.
              </span>
            </div>
          </div>
        )}

        {/* Scrollable chat thread area */}
        <MessageList
          conversation={activeConversation}
          onApplyPreset={handleApplyPresetPrompt}
          onSpeak={speech.speak}
          currentlyPlayingId={speech.playingMessageId}
        />

        {/* Floating rich input zone */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          initialValue={presetInputValue}
          onClearValue={() => setPresetInputValue('')}
        />
      </main>
    </div>
  );
}
