import { useCallback, useEffect, useRef, useState } from 'react';
import {
  detectLanguageFromText,
  voiceLangFor,
} from '../utils/languageUtils';
import {
  pickSpeechVoice,
  prepareSpeech,
  langCodeFromVoiceLang,
} from '../utils/speechUtils';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useAiDoctorVoice({
  onTranscript,
  enabled = true,
  onLanguageDetected,
  initialLanguage = null,
  initialVoiceLang = null,
  doctorGender = 'male',
  lockLanguage = false,
}) {
  const [voiceSupported] = useState(() => Boolean(SpeechRecognition && window.speechSynthesis));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [conversationLang, setConversationLang] = useState(initialLanguage || 'en');
  const [voiceLang, setVoiceLang] = useState(initialVoiceLang || voiceLangFor(initialLanguage || 'en'));
  const [langMode, setLangMode] = useState(lockLanguage || initialLanguage ? 'manual' : 'auto');

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onLanguageDetectedRef = useRef(onLanguageDetected);
  const handsFreeRef = useRef(handsFree);
  const enabledRef = useRef(enabled);
  const voiceLangRef = useRef(voiceLang);
  const langModeRef = useRef(langMode);
  const lockLanguageRef = useRef(lockLanguage);
  const doctorGenderRef = useRef(doctorGender);

  onTranscriptRef.current = onTranscript;
  onLanguageDetectedRef.current = onLanguageDetected;
  handsFreeRef.current = handsFree;
  enabledRef.current = enabled;
  voiceLangRef.current = voiceLang;
  langModeRef.current = langMode;
  lockLanguageRef.current = lockLanguage;
  doctorGenderRef.current = doctorGender;

  const applyLanguage = useCallback((lang) => {
    if (lockLanguageRef.current) return;
    const code = lang || 'en';
    setConversationLang(code);
    if (langModeRef.current === 'auto') {
      const vLang = voiceLangFor(code);
      setVoiceLang(vLang);
      voiceLangRef.current = vLang;
    }
    onLanguageDetectedRef.current?.(code, voiceLangFor(code));
  }, []);

  const setPreferredLanguage = useCallback((language, replyVoiceLang) => {
    const code = language || 'en';
    setConversationLang(code);
    setLangMode('manual');
    langModeRef.current = 'manual';
    const vLang = replyVoiceLang || voiceLangFor(code);
    setVoiceLang(vLang);
    voiceLangRef.current = vLang;
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

      stopSpeaking();

      const speakLang = lang || voiceLangRef.current;
      const langCode = langCodeFromVoiceLang(speakLang);
      const { text: speechText, lang: utteranceLang, useRomanUrdu } = prepareSpeech(text, langCode);

      if (!speechText) {
        onDone?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = utteranceLang;
      utterance.rate = useRomanUrdu || utteranceLang.startsWith('ur') ? 0.88 : 0.95;
      utterance.pitch = doctorGenderRef.current === 'female' ? 1.08 : 0.92;

      const voice = pickSpeechVoice(utteranceLang, {
        forRomanUrdu: useRomanUrdu,
        preferFemale: doctorGenderRef.current === 'female',
      });
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

      if (preview && langModeRef.current === 'auto' && !lockLanguageRef.current) {
        applyLanguage(detectLanguageFromText(preview));
      }

      if (finalText.trim()) {
        const detected = lockLanguageRef.current
          ? conversationLang
          : detectLanguageFromText(finalText);
        if (!lockLanguageRef.current) {
          applyLanguage(detected);
        }
        onTranscriptRef.current?.(finalText.trim(), detected, voiceLangRef.current);
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
  }, [applyLanguage, conversationLang, stopListening, stopSpeaking]);

  const syncReplyLanguage = useCallback((language, replyVoiceLang) => {
    if (lockLanguageRef.current) return;
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
    if (!initialLanguage) return;
    setPreferredLanguage(initialLanguage, initialVoiceLang);
  }, [initialLanguage, initialVoiceLang, setPreferredLanguage]);

  useEffect(() => {
    doctorGenderRef.current = doctorGender;
  }, [doctorGender]);

  useEffect(() => {
    lockLanguageRef.current = lockLanguage;
    if (lockLanguage) {
      setLangMode('manual');
      langModeRef.current = 'manual';
    }
  }, [lockLanguage]);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    const t = setTimeout(loadVoices, 500);
    return () => {
      clearTimeout(t);
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
    syncReplyLanguage,
    applySessionLanguage: setPreferredLanguage,
    applyLanguage,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
