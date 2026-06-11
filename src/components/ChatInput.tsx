import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, X, Sparkles, Image, Check } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
  initialValue?: string;
  onClearValue?: () => void;
}

export default function ChatInput({ onSendMessage, isGenerating, initialValue = '', onClearValue }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialValue from preset clicks
  useEffect(() => {
    if (initialValue) {
      setContent(initialValue);
      if (onClearValue) onClearValue();
      // Refocus textarea after a preset is applied
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  // Adjust textarea height on word wraps
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) return;
    if (!content.trim() && attachments.length === 0) return;

    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFiles = (files: FileList) => {
    const newAttachments: Attachment[] = [];
    const readPromises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            newAttachments.push({
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              dataUrl: reader.result,
            });
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(() => {
      setAttachments((prev) => [...prev, ...newAttachments]);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6 bg-white border-t border-neutral-100"
      id="chat-input-form"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col w-full border rounded-2xl transition-all shadow-sm ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-100'
            : 'border-neutral-200 focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400'
        }`}
        id="input-container"
      >
        {/* Drag and Drop Hover overlay indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl flex items-center justify-center pointer-events-none select-none">
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-white/95 px-4 py-2 rounded-full shadow-md border border-indigo-100">
              <Paperclip className="w-4 h-4 animate-bounce" />
              Drop files/images here to attach
            </span>
          </div>
        )}

        {/* Thumbnail Preview Area for Attached documents */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0 bg-neutral-50/50 rounded-t-2xl border-b border-dashed border-neutral-100" id="attached-thumbnails">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="group relative flex items-center gap-2 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-xl shadow-xs"
              >
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded border border-neutral-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-[10px] font-mono text-indigo-500 font-bold">
                    FILE
                  </div>
                )}
                <div className="max-w-32 pr-4 overflow-hidden">
                  <p className="text-xs font-medium text-neutral-700 truncate">{file.name}</p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">{file.mimeType}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-neutral-100 hover:bg-red-100 text-neutral-500 hover:text-red-600 border border-neutral-200 transition-colors cursor-pointer shadow-xs"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action input bar */}
        <div className="flex items-end p-2.5 gap-2">
          {/* File select hidden component & clip trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept="image/*,text/*,application/pdf"
            id="file-upload-input"
          />
          <button
            type="button"
            onClick={triggerFileSelect}
            className="p-2.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Attach images or documents"
            id="attachment-trigger-btn"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Core textarea area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Processing reply / thinking..." : "Ask me anything... (Drop files/images to attach)"}
            disabled={isGenerating}
            className="flex-1 py-2 px-1 text-[15px] text-neutral-800 bg-transparent outline-none border-none resize-none min-h-[38px] max-h-[200px] leading-relaxed placeholder:text-neutral-400"
            id="chat-textarea"
          />

          {/* Focus indicator badge */}
          {!isGenerating && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-50 border border-neutral-200 rounded self-center select-none mr-1 shrink-0">
              Ctrl+K
            </kbd>
          )}

          {/* Action trigger Button */}
          <button
            type="submit"
            disabled={isGenerating || (!content.trim() && attachments.length === 0)}
            className={`p-2.5 rounded-xl shrink-0 transition-all flex items-center justify-center ${
              content.trim() || attachments.length > 0
                ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs cursor-pointer active:scale-95'
                : 'bg-neutral-100 text-neutral-300 pointer-events-none'
            }`}
            id="send-message-btn"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
