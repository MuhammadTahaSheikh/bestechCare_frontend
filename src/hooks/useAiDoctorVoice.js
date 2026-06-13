import { useCallback, useEffect, useRef, useState } from 'react';
import {
  detectLanguageFromText,
  pickSpeechVoice,
  stripForSpeech,
  voiceLangFor,
} from '../utils/languageUtils';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useAiDoctorVoice({ onTranscript, enabled = true, onLanguageDetected }) {
  const [voiceSupported] = useState(() => Boolean(SpeechRecognition && window.speechSynthesis));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [conversationLang, setConversationLang] = useState('en');
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [langMode, setLangMode] = useState('auto');

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onLanguageDetectedRef = useRef(onLanguageDetected);
  const handsFreeRef = useRef(handsFree);
  const enabledRef = useRef(enabled);
  const voiceLangRef = useRef(voiceLang);
  const langModeRef = useRef(langMode);

  onTranscriptRef.current = onTranscript;
  onLanguageDetectedRef.current = onLanguageDetected;
  handsFreeRef.current = handsFree;
  enabledRef.current = enabled;
  voiceLangRef.current = voiceLang;
  langModeRef.current = langMode;

  const applyLanguage = useCallback((lang) => {
    const code = lang || 'en';
    setConversationLang(code);
    if (langModeRef.current === 'auto') {
      const vLang = voiceLangFor(code);
      setVoiceLang(vLang);
      voiceLangRef.current = vLang;
    }
    onLanguageDetectedRef.current?.(code, voiceLangFor(code));
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, { onDone, lang } = {}) => {
      if (!window.speechSynthesis || !text?.trim()) {
        onDone?.();
        return;
      }

      const speakLang = lang || voiceLangRef.current;

      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
      utterance.lang = speakLang;
      utterance.rate = speakLang.startsWith('ur') ? 0.9 : 0.95;
      utterance.pitch = 1;

      const voice = pickSpeechVoice(speakLang);
      if (voice) utterance.voice = voice;

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
    [stopSpeaking]
  );

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !enabledRef.current) return;

    stopSpeaking();
    stopListening();

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLangRef.current;
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

      const preview = interim || finalText;
      setInterimText(preview);

      if (preview && langModeRef.current === 'auto') {
        applyLanguage(detectLanguageFromText(preview));
      }

      if (finalText.trim()) {
        const detected = detectLanguageFromText(finalText);
        applyLanguage(detected);
        onTranscriptRef.current?.(finalText.trim(), detected, voiceLangFor(detected));
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
  }, [applyLanguage, stopListening, stopSpeaking]);

  const setManualVoiceLang = useCallback((value) => {
    setLangMode(value === 'auto' ? 'auto' : 'manual');
    if (value === 'auto') {
      const vLang = voiceLangFor(conversationLang);
      setVoiceLang(vLang);
      voiceLangRef.current = vLang;
    } else {
      setVoiceLang(value);
      voiceLangRef.current = value;
    }
  }, [conversationLang]);

  const syncReplyLanguage = useCallback((language, replyVoiceLang) => {
    applyLanguage(language || 'en');
    if (langModeRef.current === 'auto' && replyVoiceLang) {
      setVoiceLang(replyVoiceLang);
      voiceLangRef.current = replyVoiceLang;
    }
  }, [applyLanguage]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
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
    conversationLang,
    voiceLang,
    langMode,
    setManualVoiceLang,
    syncReplyLanguage,
    applyLanguage,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
