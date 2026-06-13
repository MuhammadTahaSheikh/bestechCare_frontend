const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F]/;

const VOICE_LANG_MAP = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
  ar: 'ar-SA',
};

/** Arabic/Urdu letter → Roman Urdu (for TTS when no Urdu voice installed) */
const URDU_CHAR_MAP = {
  ا: 'a', آ: 'aa', ب: 'b', پ: 'p', ت: 't', ٹ: 't', ث: 's', ج: 'j', چ: 'ch',
  ح: 'h', خ: 'kh', د: 'd', ڈ: 'd', ذ: 'z', ر: 'r', ڑ: 'r', ز: 'z', ژ: 'zh',
  س: 's', ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: '', غ: 'gh', ف: 'f',
  ق: 'q', ک: 'k', ك: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n', و: 'o', ہ: 'h',
  ھ: 'h', ء: '', ی: 'i', ي: 'i', ے: 'e', ں: 'n', ؤ: 'o', ئ: 'i', ۃ: 'h',
  ة: 'a', ټ: 'p', ۰: '0', ۱: '1', ۲: '2', ۳: '3', ۴: '4', ۵: '5',
  ۶: '6', ۷: '7', ۸: '8', ۹: '9',
};

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
