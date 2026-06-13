const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;

const VOICE_LANG_MAP = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
  ar: 'ar-SA',
};

const ROMAN_URDU_MARKERS = [
  'mujhe', 'mera', 'aap', 'kya', 'bukhar', 'dard', 'urdu', 'mein', 'shukriya',
  'takleef', 'dawai', 'ilaj', 'pet dard', 'sar dard', 'zukam', 'khansi', 'bimaar',
];

export function detectLanguageFromText(text) {
  if (!text?.trim()) return 'en';

  if (URDU_SCRIPT_RE.test(text)) return 'ur';
  if (DEVANAGARI_RE.test(text)) return 'hi';

  const lower = ` ${text.toLowerCase()} `;
  if (/\b(urdu|اردو)\b|urdu mein|speak urdu|in urdu|urdu please/.test(lower)) return 'ur';
  if (/\benglish\b|speak english|in english|english please/.test(lower)) return 'en';
  if (/\bhindi\b|hindi mein|speak hindi/.test(lower)) return 'hi';
  if (/\barabic\b|speak arabic|in arabic/.test(lower)) return 'ar';

  const urduScore = ROMAN_URDU_MARKERS.filter((m) => lower.includes(` ${m} `) || lower.includes(m)).length;
  if (urduScore >= 1) return 'ur';

  return 'en';
}

export function voiceLangFor(language) {
  return VOICE_LANG_MAP[language] || VOICE_LANG_MAP.en;
}

export function pickSpeechVoice(preferredLang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const code = preferredLang.slice(0, 2);

  return (
    voices.find((v) => v.lang === preferredLang) ||
    voices.find((v) => v.lang.startsWith(`${code}-`)) ||
    voices.find((v) => v.lang.startsWith(code)) ||
    voices.find((v) => v.name.toLowerCase().includes('urdu') && code === 'ur') ||
    voices.find((v) => v.name.toLowerCase().includes('hindi') && code === 'hi') ||
    voices.find((v) => v.default) ||
    voices[0]
  );
}

export function stripForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/🚨|⚠️|•/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}
