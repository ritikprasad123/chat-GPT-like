import { useState, useEffect, useRef } from 'react';

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  isFemale: boolean;
  label: string;
}

export function useSpeech() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [isAutoReadEnabled, setIsAutoReadEnabled] = useState<boolean>(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load and categorize voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    const updateVoices = () => {
      const allVoices = synth.getVoices();
      
      const mapped: VoiceOption[] = allVoices.map((v) => {
        const nameLower = v.name.toLowerCase();
        // Categorize common female voice names in browsers
        const isFemale =
          nameLower.includes('female') ||
          nameLower.includes('samantha') ||
          nameLower.includes('victoria') ||
          nameLower.includes('zira') ||
          nameLower.includes('karen') ||
          nameLower.includes('moira') ||
          nameLower.includes('tessa') ||
          nameLower.includes('siri') ||
          nameLower.includes('google us english') || // Generally default female-aligned Google stream
          nameLower.includes('hazel') ||
          nameLower.includes('susan');

        let genderBadge = isFemale ? '👩 Female' : '👨 Male';
        // Some systems don't have explicit indicators, display human friendly names
        const label = `${v.name} (${v.lang}) - ${genderBadge}`;

        return { voice: v, isFemale, label };
      });

      // Sort so that English speaking female voices show up on top
      const sorted = mapped.sort((a, b) => {
        // En-US / English first
        const aEn = a.voice.lang.toLowerCase().startsWith('en');
        const bEn = b.voice.lang.toLowerCase().startsWith('en');
        if (aEn && !bEn) return -1;
        if (!aEn && bEn) return 1;

        // Female first
        if (a.isFemale && !b.isFemale) return -1;
        if (!a.isFemale && b.isFemale) return 1;

        return a.voice.name.localeCompare(b.voice.name);
      });

      setVoices(sorted);

      // Auto-select the premium or first English female voice
      const defaultFemale = sorted.find((v) => v.isFemale && v.voice.lang.toLowerCase().startsWith('en')) || 
                            sorted.find((v) => v.isFemale) || 
                            sorted[0];
      
      if (defaultFemale) {
        setSelectedVoiceURI((prev) => prev || defaultFemale.voice.voiceURI);
      }
    };

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = null;
      }
      synth.cancel();
    };
  }, []);

  // Sync state with Synthesis updates
  const stop = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setPlayingMessageId(null);
    setIsPlaying(false);
  };

  const speak = (text: string, messageId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // If already playing this message, stop/mute it
    if (playingMessageId === messageId && isPlaying) {
      stop();
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();

    // Text formatting for cleaner speech synthesis (strip markdown)
    const cleanText = text
      .replace(/#+\s+/g, '') // strip headers
      .replace(/[*_~`]+/g, '') // strip markdown symbols
      .replace(/```[\s\S]*?```/g, '[Code Block]') // represent code block nicely
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find selected voice
    const activeVoice = voices.find((v) => v.voice.voiceURI === selectedVoiceURI)?.voice;
    if (activeVoice) {
      utterance.voice = activeVoice;
    }

    utterance.rate = speed;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setPlayingMessageId(messageId);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setPlayingMessageId(null);
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setPlayingMessageId(null);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  return {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speed,
    setSpeed,
    pitch,
    setPitch,
    isAutoReadEnabled,
    setIsAutoReadEnabled,
    playingMessageId,
    isPlaying,
    speak,
    stop,
  };
}
