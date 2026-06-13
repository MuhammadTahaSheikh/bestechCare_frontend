const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F]/;

const VOICE_LANG_MAP = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
  ar: 'ar-SA',
};

/** Arabic/Urdu letter → Roman Urdu (for TTS when no native Urdu voice) */
const URDU_CHAR_MAP = Object.fromEntries([
  ['\u0627', 'a'], ['\u0622', 'aa'], ['\u0628', 'b'], ['\u067E', 'p'],
  ['\u062A', 't'], ['\u0679', 't'], ['\u062B', 's'], ['\u062C', 'j'],
  ['\u0686', 'ch'], ['\u062D', 'h'], ['\u062E', 'kh'], ['\u062F', 'd'],
  ['\u0688', 'd'], ['\u0630', 'z'], ['\u0631', 'r'], ['\u0691', 'r'],
  ['\u0632', 'z'], ['\u0698', 'zh'], ['\u0633', 's'], ['\u0634', 'sh'],
  ['\u0635', 's'], ['\u0636', 'z'], ['\u0637', 't'], ['\u0638', 'z'],
  ['\u0639', ''], ['\u063A', 'gh'], ['\u0641', 'f'], ['\u0642', 'q'],
  ['\u06A9', 'k'], ['\u0643', 'k'], ['\u06AF', 'g'], ['\u0644', 'l'],
  ['\u0645', 'm'], ['\u0646', 'n'], ['\u0648', 'o'], ['\u06C1', 'h'],
  ['\u06BE', 'h'], ['\u0621', ''], ['\u06CC', 'i'], ['\u064A', 'i'],
  ['\u06D2', 'e'], ['\u06BA', 'n'], ['\u0624', 'o'], ['\u0626', 'i'],
  ['\u06C3', 'h'], ['\u0629', 'a'], ['\u067C', 'p'],
  ['\u06F0', '0'], ['\u06F1', '1'], ['\u06F2', '2'], ['\u06F3', '3'],
  ['\u06F4', '4'], ['\u06F5', '5'], ['\u06F6', '6'], ['\u06F7', '7'],
  ['\u06F8', '8'], ['\u06F9', '9'],
]);

/** Common words → natural Roman Urdu (better TTS than letter-by-letter) */
const URDU_PHRASES = [
  ['ہمیشہ پیشہ ور ڈاکٹر سے مکمل معائنہ کروائیں', 'hamesha doctor se mukammal checkup karwayen'],
  ['وعلیکم السلام', 'walaikum assalam'],
  ['السلام علیکم', 'assalam o alaikum'],
  ['میں ٹھیک ہوں', 'main theek hoon'],
  ['براہ کرم', 'barah e karam'],
  ['علامات', 'alamat'],
  ['بخار', 'bukhar'],
  ['سر درد', 'sar dard'],
  ['پیٹ درد', 'pet dard'],
  ['کھانسی', 'khansi'],
  ['شکریہ', 'shukriya'],
  ['آپ', 'aap'],
  ['میں', 'main'],
  ['کیا', 'kya'],
  ['ہے', 'hai'],
  ['ہیں', 'hain'],
  ['نہیں', 'nahin'],
  ['ڈاکٹر', 'doctor'],
  ['دوائی', 'dawai'],
  ['تکلیف', 'takleef'],
  ['احتیاط', 'ehteryaat'],
  ['فوری', 'fori'],
  ['ایمرجنسی', 'emergency'],
];

export function containsUrduScript(text) {
  return URDU_SCRIPT_RE.test(text || '');
}

export function voiceLangFor(language) {
  return VOICE_LANG_MAP[language] || VOICE_LANG_MAP.en;
}

export function getSpeechVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices() || [];
}

export function hasNativeUrduVoice() {
  return getSpeechVoices().some(
    (v) => v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu')
  );
}

export function pickSpeechVoice(preferredLang, { forRomanUrdu = false } = {}) {
  const voices = getSpeechVoices();
  if (!voices.length) return null;

  const code = preferredLang.slice(0, 2);

  if (forRomanUrdu) {
    return (
      voices.find((v) => v.lang === 'hi-IN') ||
      voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang.startsWith('en'))
    );
  }

  if (code === 'ur') {
    const urduVoice =
      voices.find((v) => v.lang === 'ur-PK') ||
      voices.find((v) => v.lang === 'ur') ||
      voices.find((v) => v.name.toLowerCase().includes('urdu'));
    if (urduVoice) return urduVoice;
  }

  return (
    voices.find((v) => v.lang === preferredLang) ||
    voices.find((v) => v.lang.startsWith(`${code}-`)) ||
    voices.find((v) => v.lang.startsWith(code)) ||
    voices.find((v) => v.name.toLowerCase().includes('hindi') && code === 'hi') ||
    voices.find((v) => v.default) ||
    voices[0]
  );
}

function transliterateUrduWord(word) {
  let out = '';
  for (const ch of word) {
    if (URDU_CHAR_MAP[ch] !== undefined) out += URDU_CHAR_MAP[ch];
    else if (/[a-zA-Z0-9]/.test(ch)) out += ch;
    else if (ch === ' ') out += ' ';
  }
  return out;
}

export function urduToRomanUrdu(text) {
  if (!text) return '';

  let result = text;
  for (const [urdu, roman] of URDU_PHRASES) {
    result = result.split(urdu).join(roman);
  }

  return result
    .split(/(\s+)/)
    .map((part) => (URDU_SCRIPT_RE.test(part) ? transliterateUrduWord(part) : part))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripForSpeech(text) {
  return (text || '')
    .replace(/\*\*/g, '')
    .replace(/🚨|⚠️|⚠/g, '')
    .replace(/[•·▪]/g, ', ')
    .replace(/[۔\.]/g, ', ')
    .replace(/[،,;]/g, ', ')
    .replace(/\n+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,+/g, ', ')
    .replace(/^,\s*|,\s*$/g, '')
    .trim();
}

/**
 * Prepare text + voice settings for speechSynthesis.
 * Falls back to Roman Urdu when no native Urdu voice (fixes "dot" bug).
 */
export function prepareSpeech(text, langCode = 'en') {
  const cleaned = stripForSpeech(text);
  const preferredLang = voiceLangFor(langCode);
  const hasUrdu = containsUrduScript(cleaned);

  if ((langCode === 'ur' || hasUrdu) && !hasNativeUrduVoice()) {
    const roman = urduToRomanUrdu(cleaned);
    const speechText = roman || cleaned.replace(URDU_SCRIPT_RE, ' ').replace(/\s+/g, ' ').trim();
    return {
      text: speechText,
      lang: 'hi-IN',
      useRomanUrdu: true,
    };
  }

  if (langCode === 'ur' || hasUrdu) {
    return {
      text: cleaned,
      lang: preferredLang,
      useRomanUrdu: false,
    };
  }

  return {
    text: cleaned,
    lang: preferredLang,
    useRomanUrdu: false,
  };
}

export function langCodeFromVoiceLang(voiceLang) {
  if (!voiceLang) return 'en';
  if (voiceLang.startsWith('ur')) return 'ur';
  if (voiceLang.startsWith('hi')) return 'hi';
  if (voiceLang.startsWith('ar')) return 'ar';
  return 'en';
}
