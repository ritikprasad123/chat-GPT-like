import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Sliders,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  InfoIcon,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { Conversation, SUPPORTED_MODELS, ModelOption } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  // Model settings configuration callbacks
  activeModel: string;
  onModelChange: (model: string) => void;
  systemInstruction: string;
  onSystemInstructionChange: (text: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  // Speech controls settings
  voices: any[];
  selectedVoiceURI: string;
  onVoiceChange: (uri: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  isAutoReadEnabled: boolean;
  onAutoReadToggle: (enabled: boolean) => void;
  // Mobile sidebar states
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onClearAll,
  activeModel,
  onModelChange,
  systemInstruction,
  onSystemInstructionChange,
  temperature,
  onTemperatureChange,
  voices,
  selectedVoiceURI,
  onVoiceChange,
  speed,
  onSpeedChange,
  pitch,
  onPitchChange,
  isAutoReadEnabled,
  onAutoReadToggle,
  isOpen,
  onClose,
}: SidebarProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);

  const selectedModelInfo = SUPPORTED_MODELS.find(m => m.id === activeModel) || SUPPORTED_MODELS[0];

  return (
    <>
      {/* Mobile Back-drop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-40 lg:hidden transition-all duration-200"
          id="mobile-backdrop"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col w-72 bg-neutral-900 border-r border-neutral-800 text-neutral-100 transform lg:transform-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="app-sidebar"
      >
        {/* Upper Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight font-display text-[15px] text-white">
                Gemini Workspace
              </h2>
              <p className="text-[10px] text-neutral-400 font-medium">Real-time AI Assistant</p>
            </div>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="p-3">
          <button
            onClick={() => {
              onCreateConversation();
              onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            id="new-chat-sidebar-btn"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Scrollable Conversation Threads Section */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1" id="threads-container">
          <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-neutral-500 uppercase select-none">
            Recent chats ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center space-y-1 select-none">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-700" />
              <p className="text-xs text-neutral-500">No conversations started yet.</p>
            </div>
          ) : (
            conversations.map((chat) => {
              const isActive = chat.id === activeId;
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between rounded-xl p-2.5 transition-all text-sm relative ${
                    isActive
                      ? 'bg-neutral-800 text-white font-medium shadow-inner'
                      : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
                  }`}
                  id={`thread-item-${chat.id}`}
                >
                  <button
                    onClick={() => {
                      onSelectConversation(chat.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1 text-left truncate cursor-pointer py-0.5"
                    id={`select-thread-btn-${chat.id}`}
                  >
                    <MessageSquare size={16} className={isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'} />
                    <span className="truncate pr-2">{chat.title || 'Untitled Conversation'}</span>
                  </button>

                  {/* Deletion hover control button */}
                  <button
                    onClick={() => onDeleteConversation(chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-700/50 transition-all cursor-pointer z-10"
                    title="Delete Conversation"
                    id={`delete-thread-btn-${chat.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Model Customization Parameters & Settings (Footer Section) */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/30" id="sidebar-footer-settings">
          {/* Collapsible fine tuning trigger button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center justify-between w-full py-2 px-2.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-all cursor-pointer"
            id="toggle-model-settings-btn"
          >
            <span className="flex items-center gap-2">
              <Sliders size={13} className="text-indigo-400" />
              <span>Model & Context Tuning</span>
            </span>
            {showConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {/* Settings Section Body */}
          {showConfig && (
            <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4 animate-fade-in" id="settings-body">
              {/* Active model selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Select Model
                </label>
                <div className="relative">
                  <select
                    value={activeModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-indigo-500 font-sans"
                    id="model-selector-dropdown"
                  >
                    {SUPPORTED_MODELS.map((model: ModelOption) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans pl-0.5">
                  {selectedModelInfo.description}
                </p>
              </div>

              {/* Slider for Temperature parameters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Temperature</span>
                  <span className="font-mono text-neutral-200">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  id="temperature-slider"
                />
                <div className="flex justify-between text-[8px] text-neutral-500 select-none">
                  <span>Precise / Accurate</span>
                  <span>Creative / Wild</span>
                </div>
              </div>

              {/* System instructions prompt tuning */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  System Instructions
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => onSystemInstructionChange(e.target.value)}
                  placeholder="e.g. You are a senior engineer who answers very concisely."
                  className="w-full h-20 bg-neutral-950 border border-neutral-850 text-neutral-300 text-xs p-2 rounded-lg outline-none resize-none font-sans placeholder:text-neutral-600 focus:border-indigo-500"
                  id="system-instruction-textarea"
                />
              </div>
            </div>
          )}

          {/* Collapsible Voice Settings trigger button */}
          <button
            onClick={() => setShowVoiceConfig(!showVoiceConfig)}
            className="flex items-center justify-between w-full py-2 px-2.5 mt-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-all cursor-pointer"
            id="toggle-voice-settings-btn"
          >
            <span className="flex items-center gap-2">
              <Volume2 size={13} className="text-pink-400" />
              <span>Voice & Speech Settings</span>
            </span>
            {showVoiceConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {/* Voice Settings Section Body */}
          {showVoiceConfig && (
            <div className="mt-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4 animate-fade-in" id="voice-settings-body">
              {/* Auto Read toggle switcher */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Auto Read Responses
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAutoReadEnabled}
                    onChange={(e) => onAutoReadToggle(e.target.checked)}
                    className="sr-only peer"
                    id="auto-read-toggle-input"
                  />
                  <div className="w-9 h-5 bg-neutral-955 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-indigo-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-950 border border-neutral-800"></div>
                </label>
              </div>

              {/* Selected voice dropdown options */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Selected Voice</span>
                  <span className="text-[8px] bg-pink-950/40 text-pink-400 font-bold px-1.5 py-0.5 rounded border border-pink-900/30">
                    Female Suggested
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs py-2 px-2.5 rounded-lg outline-none cursor-pointer focus:border-pink-500 font-sans"
                    id="speech-voice-selector"
                  >
                    {voices.length === 0 ? (
                      <option value="">Default OS Voice</option>
                    ) : (
                      voices.map((v) => (
                        <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                          {v.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Slider for Speed parameters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Reading Speed</span>
                  <span className="font-mono text-neutral-200">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  id="speed-slider"
                />
              </div>

              {/* Slider for Pitch parameters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Voice Pitch</span>
                  <span className="font-mono text-neutral-200">{pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  id="pitch-slider"
                />
              </div>
            </div>
          )}

          {/* Quick Stats or clear records buttons */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-800/65 pt-2 text-[10px]">
            <span className="text-neutral-500 font-mono select-none">
              Local: {conversations.length} sessions
            </span>
            {conversations.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear ALL chat history? This cannot be undone.')) {
                    onClearAll();
                  }
                }}
                className="text-neutral-500 hover:text-red-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                id="clear-all-history-btn"
              >
                Clear all chats
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
