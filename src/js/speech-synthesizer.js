const p = Object.freeze({
  pitch: Symbol('pitch'),
  rate: Symbol('rate'),
  synthesis: Symbol('synthesis'),

  // Methods
  getPreferredVoice: Symbol('getPreferredVoice'),
});

export default class SpeechSynthesizer {
  constructor(pitch, rate) {
    this[p.pitch] = pitch;
    this[p.rate] = rate;
    this[p.synthesis] = window.speechSynthesis || null;

    Object.seal(this);
  }

  /**
   * Speak a text aloud.
   *
   * @param {string} text
   * @param {string} language
   */
  speak(text = '', language = 'en') {
    const synthesis = this[p.synthesis];
    if (!text || !synthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const voice = this[p.getPreferredVoice](language);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = language;
    utterance.pitch = this[p.pitch];
    utterance.rate = this[p.rate];

    synthesis.speak(utterance);
  }

  /**
   * From all the voices available, set the default language to English with a
   * female voice if available.
   *
   * @param {string} language
   *
   * @returns {Object}
   */
  [p.getPreferredVoice](language) {
    const allVoices = this[p.synthesis].getVoices();
    if (!allVoices.length) {
      return null;
    }

    const voices = allVoices.filter((voice) => voice.lang.startsWith(language));
    const femaleVoices = voices.filter(
      (voice) => voice.name.includes('Female')
    );

    if (femaleVoices.length) {
      return femaleVoices[0];
    }

    if (voices.length) {
      return voices[0];
    }

    // If we can't find any voice for the language let's fallback to English.
    if (!language.startsWith('en')) {
      return this[p.getPreferredVoice]('en');
    }

    return null;
  }
}
