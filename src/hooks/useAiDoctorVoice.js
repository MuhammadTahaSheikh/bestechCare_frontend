import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function stripForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/🚨/g, '')
    .replace(/⚠️/g, '')
    .replace(/•/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useAiDoctorVoice({ onTranscript, enabled = true }) {
  const [voiceSupported] = useState(() => Boolean(SpeechRecognition && window.speechSynthesis));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-US');

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const handsFreeRef = useRef(handsFree);
  const enabledRef = useRef(enabled);

  onTranscriptRef.current = onTranscript;
  handsFreeRef.current = handsFree;
  enabledRef.current = enabled;

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, { onDone } = {}) => {
      if (!window.speechSynthesis || !text?.trim()) {
        onDone?.();
        return;
      }

      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
      utterance.lang = voiceLang;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith(voiceLang.slice(0, 2)));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onDone?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onDone?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking, voiceLang]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !enabledRef.current) return;

    stopSpeaking();
    stopListening();

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim || finalText);

      if (finalText.trim()) {
        onTranscriptRef.current?.(finalText.trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimText('');
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.warn('[voice]', event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [stopListening, stopSpeaking, voiceLang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    voiceSupported,
    isListening,
    isSpeaking,
    voiceReplies,
    setVoiceReplies,
    handsFree,
    setHandsFree,
    interimText,
    voiceLang,
    setVoiceLang,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
